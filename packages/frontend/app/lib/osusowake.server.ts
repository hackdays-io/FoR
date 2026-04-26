import { type Address, isAddress } from "viem";
import { routerAbi } from "./abis/routerAbi";
import { addresses } from "./contracts";
import { searchNames } from "./namestone.server";
import { publicClient } from "./viem";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf00NnXIn5txdg2fZi6zaeis8MZtmuDOwJQa5foy28zCNdypyI_jD36-DbxK61sZicAAePXMSCmlX6/pub?gid=1439252994&single=true&output=csv";

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type OsusowakeItem = {
  id: number;
  title: string;
  amount: number;
  description: string;
  recipient: string;
  isNew: boolean;
  imageUrl?: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseSheetTimestamp(value: string): number | null {
  const match = value.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
  );
  if (!match) return null;
  const [, y, m, d, hh, mm, ss] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
  ).getTime();
}

function toDirectDriveImageUrl(url: string): string | undefined {
  if (!url) return undefined;
  const queryMatch = url.match(/[?&]id=([^&]+)/);
  if (queryMatch) return `https://lh3.googleusercontent.com/d/${queryMatch[1]}`;
  const pathMatch = url.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) return `https://lh3.googleusercontent.com/d/${pathMatch[1]}`;
  return url;
}

export async function loadOsusowakeItems(): Promise<OsusowakeItem[]> {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) return [];
  const text = await res.text();
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];

  const colIndex = (name: string) => header.indexOf(name);
  const idxTimestamp = colIndex("タイムスタンプ");
  const idxTitle = colIndex("商品名");
  const idxAmount = colIndex("値段");
  const idxDescription = colIndex("説明");
  const idxImage = colIndex("画像");
  const idxRecipient = colIndex("支払先");
  const idxInactive = colIndex("非アクティブ");

  const now = Date.now();
  const items: OsusowakeItem[] = [];
  let id = 0;
  for (const r of rows) {
    const title = (r[idxTitle] ?? "").trim();
    if (!title) continue;
    if ((r[idxInactive] ?? "").trim().toUpperCase() === "TRUE") continue;
    id += 1;
    const amount = Number((r[idxAmount] ?? "").trim()) || 0;
    const description = r[idxDescription] ?? "";
    const recipient = (r[idxRecipient] ?? "").trim();
    const ts = parseSheetTimestamp((r[idxTimestamp] ?? "").trim());
    const isNew = ts !== null && now - ts < NEW_THRESHOLD_MS;
    const imageUrl = toDirectDriveImageUrl((r[idxImage] ?? "").trim());
    items.push({
      id,
      title,
      amount,
      description,
      recipient,
      isNew,
      ...(imageUrl ? { imageUrl } : {}),
    });
  }
  return items;
}

export async function loadOsusowakeItem(
  id: number,
): Promise<OsusowakeItem | undefined> {
  const items = await loadOsusowakeItems();
  return items.find((item) => item.id === id);
}

let cachedFundWallet: Address | undefined;

async function getFundWalletAddress(): Promise<Address> {
  if (cachedFundWallet) return cachedFundWallet;
  if (!addresses) throw new Error("Contract addresses not configured");
  const fundWallet = await publicClient.readContract({
    address: addresses.router,
    abi: routerAbi,
    functionName: "fundWallet",
  });
  cachedFundWallet = fundWallet as Address;
  return cachedFundWallet;
}

export async function resolveRecipientAddress(
  recipient: string,
): Promise<Address> {
  if (recipient) {
    if (isAddress(recipient)) return recipient as Address;
    try {
      const profiles = await searchNames(recipient, true);
      const candidate = profiles[0]?.address;
      if (candidate && isAddress(candidate)) return candidate as Address;
    } catch {
      // fall through to fund wallet
    }
  }
  return getFundWalletAddress();
}
