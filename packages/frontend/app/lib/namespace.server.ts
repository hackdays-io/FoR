import {
  ChainName,
  createOffchainClient,
  getCoinType,
  type OffchainClient,
  type SubnameDTO,
} from "@thenamespace/offchain-manager";
import { getAddress, isAddress } from "viem";

export interface NameTextRecords {
  avatar?: string;
  display?: string;
  description?: string;
}

/**
 * アプリ内で扱うプロフィールの形。
 * `name` はラベル（例: alice）、`domain` は親名（例: toban.eth）。
 */
export interface NameProfile {
  name: string;
  address: string;
  domain: string;
  text_records?: NameTextRecords;
}

const TEXT_RECORD_KEYS = ["avatar", "display", "description"] as const;

/** ENS のアドレスレコードは coin type 60 が Ethereum */
const ETH_COIN_TYPE = String(getCoinType(ChainName.Ethereum));

/** 検索結果の取得件数。Namespace の size は最大 100 */
const SEARCH_PAGE_SIZE = 20;
const OWNER_PAGE_SIZE = 100;

interface NamespaceContext {
  client: OffchainClient;
  parentName: string;
}

let cached: (NamespaceContext & { apiKey: string }) | undefined;

function getContext(): NamespaceContext {
  const apiKey = process.env.NAMESPACE_API_KEY;
  const parentName = process.env.NAMESPACE_PARENT_NAME;

  if (!apiKey) {
    throw new Error("NAMESPACE_API_KEY is not set");
  }
  if (!parentName) {
    throw new Error("NAMESPACE_PARENT_NAME is not set");
  }

  if (!cached || cached.apiKey !== apiKey || cached.parentName !== parentName) {
    cached = {
      apiKey,
      parentName,
      // API キーはアドレスベース / ドメインベースのどちらでも受け付けられるよう両方に登録する
      client: createOffchainClient({
        mode: "mainnet",
        timeout: 10_000,
        defaultApiKey: apiKey,
        domainApiKeys: { [parentName]: apiKey },
      }),
    };
  }

  return cached;
}

function fullName(label: string, parentName: string): string {
  return `${label}.${parentName}`;
}

/**
 * Namespace は 404 を AxiosError として投げる。
 * SDK の getSingleSubname は 404 を null に変換する実装になっているが、
 * try の中で await せずに Promise を返しているため実際には catch されない。
 */
function isNotFound(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status;
  return status === 404;
}

function toProfile(subname: SubnameDTO): NameProfile {
  const texts = subname.texts ?? {};
  const textRecords: NameTextRecords = {};
  for (const key of TEXT_RECORD_KEYS) {
    const value = texts[key];
    if (value) {
      textRecords[key] = value;
    }
  }

  return {
    name: subname.label,
    address: subname.addresses?.[ETH_COIN_TYPE] ?? subname.owner ?? "",
    domain: subname.parentName,
    text_records: textRecords,
  };
}

/**
 * owner フィルタは大文字小文字を区別する（実測: チェックサム形式で引くと 0 件）。
 * 書き込み側は常に小文字で owner を入れるため小文字を第一候補にし、
 * 親名を共有する他アプリがチェックサム形式で書いていた場合に備えて
 * 空振り時のみチェックサム形式で引き直す。
 */
function ownerCandidates(address: string): string[] {
  const lower = address.toLowerCase();
  if (!isAddress(address)) {
    return [lower];
  }
  const checksummed = getAddress(address);
  return checksummed === lower ? [lower] : [lower, checksummed];
}

export async function setName(params: {
  name: string;
  address: string;
  textRecords?: NameTextRecords;
}): Promise<void> {
  const { client, parentName } = getContext();

  const texts = Object.entries(params.textRecords ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({ key, value: value as string }));

  const owner = params.address.toLowerCase();

  // POST /api/v1/subnames は upsert なので新規作成と更新を分岐しない。
  // SDK の updateSubname / addTextRecord は再構築するリクエストに owner を含めず
  // 所有者が失われるため使わない。
  await client.createSubname({
    parentName,
    label: params.name,
    owner,
    addresses: [{ chain: ChainName.Ethereum, value: owner }],
    texts,
  });
}

export async function getNamesByAddress(
  address: string,
): Promise<NameProfile[]> {
  const { client, parentName } = getContext();

  for (const owner of ownerCandidates(address)) {
    const { items } = await client.getFilteredSubnames({
      parentName,
      owner,
      page: 1,
      size: OWNER_PAGE_SIZE,
    });
    if (items && items.length > 0) {
      return items.map(toProfile);
    }
  }

  return [];
}

/** ラベルの部分一致検索。ユーザー検索用 */
export async function searchNames(query: string): Promise<NameProfile[]> {
  const { client, parentName } = getContext();

  const { items } = await client.getFilteredSubnames({
    parentName,
    labelSearch: query,
    page: 1,
    size: SEARCH_PAGE_SIZE,
  });

  return (items ?? []).map(toProfile);
}

/** ラベルの完全一致取得。存在しなければ null */
export async function getNameByLabel(
  label: string,
): Promise<NameProfile | null> {
  const { client, parentName } = getContext();

  try {
    const subname = await client.getSingleSubname(fullName(label, parentName));
    return subname ? toProfile(subname) : null;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

/** ユーザー名が未使用かどうか */
export async function isNameAvailable(label: string): Promise<boolean> {
  const { client, parentName } = getContext();

  const { isAvailable } = await client.isSubnameAvailable(
    fullName(label, parentName),
  );
  return isAvailable;
}

export async function deleteName(label: string): Promise<void> {
  const { client, parentName } = getContext();

  await client.deleteSubname(fullName(label, parentName));
}
