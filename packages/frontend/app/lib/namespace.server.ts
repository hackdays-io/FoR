import {
  ChainName,
  createOffchainClient,
  getCoinType,
  type OffchainClient,
  type SubnameDTO,
  SubnameNotFoundError,
} from "@thenamespace/offchain-manager";
import { foldLabel } from "./label";

/**
 * text records は avatar / description を利用するが、
 * 親名を toban と共有しており toban 側が書いたキーもそのまま通す。
 */
export interface NameTextRecords {
  avatar?: string;
  display?: string;
  description?: string;
  [key: string]: string | undefined;
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

/** ENS のアドレスレコードは coin type 60 が Ethereum */
const ETH_COIN_TYPE = String(getCoinType(ChainName.Ethereum));

/** 検索結果の取得件数。Namespace の size は最大 100 */
const SEARCH_PAGE_SIZE = 20;
const OWNER_PAGE_SIZE = 100;

/** Namestone の障害時に全リクエストが吊られた反省（toban#555）から明示的に設ける */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * 表記揺れを無視した検索・突合のための全件インデックス。
 *
 * Namespace のラベル検索 / 完全一致 / 空き確認はすべて大文字小文字を区別し、
 * 無視するオプションも無い（実測: `Ryoma` で引くと `ryoma` は 404）。
 * 親名配下には toban 側で登録された `Alice` のような大文字ラベルが既に混在しているため、
 * クエリを小文字化するだけでは取りこぼす。親名配下は数十〜数百件なので、
 * 全件を短期間キャッシュしてローカルで畳み込み比較する。
 */
const INDEX_TTL_MS = 60_000;
const INDEX_MAX_ITEMS = 2000;

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
        timeout: REQUEST_TIMEOUT_MS,
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
 * axios は直接の依存ではないので status をダックタイピングで見る。
 */
function isNotFound(error: unknown): boolean {
  if (error instanceof SubnameNotFoundError) return true;
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status;
  return status === 404;
}

/**
 * ラベルは dto.label ではなく fullName から復元する。
 * toban は split 用に `foo.split.toban.eth` のようなドット入りラベルを登録しており、
 * API 側が label: "foo" / parentName: "split.toban.eth" に分解して返すことがあるため、
 * dto.label をそのまま使うと名前が切り詰められ、削除時の対象名もずれる。
 */
function toProfile(dto: SubnameDTO, parentName: string): NameProfile {
  const suffix = `.${parentName}`;
  const name = dto.fullName?.endsWith(suffix)
    ? dto.fullName.slice(0, -suffix.length)
    : dto.label;

  return {
    name,
    address: dto.addresses?.[ETH_COIN_TYPE] ?? dto.owner ?? "",
    domain: parentName,
    text_records: dto.texts ?? {},
  };
}

export async function setName(params: {
  name: string;
  address: string;
  textRecords?: NameTextRecords;
}): Promise<void> {
  const { client, parentName } = getContext();

  // POST /api/v1/subnames はレコード全体の置き換え（upsert）なので、
  // 空値を落とすことでユーザーが自己紹介を消せる。
  const texts = Object.entries(params.textRecords ?? {})
    .filter(([, value]) => typeof value === "string" && value !== "")
    .map(([key, value]) => ({ key, value: value as string }));

  // owner は toban 側の実装に合わせて常に小文字で書き込む。
  const owner = params.address.toLowerCase();

  // SDK の updateSubname / addTextRecord は再構築するリクエストに owner を含めず
  // 所有者が失われるため、書き込みは常に createSubname に全フィールドを渡す。
  await client.createSubname({
    parentName,
    label: params.name,
    owner,
    addresses: [{ chain: ChainName.Ethereum, value: owner }],
    texts,
  });
  invalidateNameIndex();
}

/**
 * owner フィルタは大文字小文字を区別する（実測: チェックサム形式で引くと 0 件）。
 * toban も owner を小文字で書き込んでいるため小文字に正規化して引き、
 * 不透明な文字列一致に頼り切らないようローカルでも突合する。
 */
export async function getNamesByAddress(
  address: string,
): Promise<NameProfile[]> {
  const { client, parentName } = getContext();
  const owner = address.toLowerCase();

  const page = await client.getFilteredSubnames({
    parentName,
    owner,
    page: 1,
    size: OWNER_PAGE_SIZE,
  });

  return (page?.items ?? [])
    .filter((dto) => (dto.owner ?? "").toLowerCase() === owner)
    .map((dto) => toProfile(dto, parentName));
}

/**
 * 親名配下のサブネームを全件取得する。
 *
 * Namespace の検索 API は owner の複数指定に対応していないため、
 * 多数のアドレスをまとめて名前に変換したい用途（MCP の取引一覧など）では
 * 1 アドレスずつ引くより全件を 1 度舐めてキャッシュする方が往復が少ない。
 *
 * @param maxItems 取得上限。超える場合は打ち切り、呼び出し側は不完全として扱う
 */
export async function listAllNames(maxItems = 2000): Promise<{
  profiles: NameProfile[];
  /** 親名配下の全件を取り切れたか */
  complete: boolean;
}> {
  const { client, parentName } = getContext();
  const profiles: NameProfile[] = [];

  for (let page = 1; ; page++) {
    const result = await client.getFilteredSubnames({
      parentName,
      page,
      size: OWNER_PAGE_SIZE,
    });

    const items = result?.items ?? [];
    for (const dto of items) profiles.push(toProfile(dto, parentName));

    const total = result?.totalItems ?? profiles.length;
    if (items.length < OWNER_PAGE_SIZE) return { profiles, complete: true };
    if (profiles.length >= total) return { profiles, complete: true };
    if (profiles.length >= maxItems) return { profiles, complete: false };
  }
}

interface NameIndex {
  fetchedAt: number;
  profiles: NameProfile[];
  /** 親名配下を全件取り切れたか。false のときは API 側の検索で補う */
  complete: boolean;
}

/**
 * モジュールスコープのキャッシュ。サーバーレスではインスタンスごとに独立し
 * コールドスタートで消えるが、困るのは初回リクエストだけなので十分。
 */
let nameIndex: NameIndex | null = null;
let nameIndexInFlight: Promise<NameIndex> | null = null;

function invalidateNameIndex(): void {
  nameIndex = null;
}

async function getNameIndex(): Promise<NameIndex> {
  if (nameIndex && Date.now() - nameIndex.fetchedAt < INDEX_TTL_MS) {
    return nameIndex;
  }
  // 検索はキー入力ごとに走るので、同時に来ても全件取得は 1 回で済ませる
  if (!nameIndexInFlight) {
    nameIndexInFlight = listAllNames(INDEX_MAX_ITEMS)
      .then((loaded) => {
        nameIndex = { fetchedAt: Date.now(), ...loaded };
        return nameIndex;
      })
      .finally(() => {
        nameIndexInFlight = null;
      });
  }
  return nameIndexInFlight;
}

async function fetchByExactLabel(label: string): Promise<NameProfile | null> {
  const { client, parentName } = getContext();

  try {
    const dto = await client.getSingleSubname(fullName(label, parentName));
    return dto ? toProfile(dto, parentName) : null;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * ラベルの部分一致検索。ユーザー検索用。
 * 大文字小文字・全角半角の違いは無視する（`Alice` → `alice`、`alice` → `Alice`）。
 * 前方一致を先に、残りをラベル順に並べて返す。
 */
export async function searchNames(query: string): Promise<NameProfile[]> {
  const needle = foldLabel(query);
  if (!needle) return [];

  const { profiles, complete } = await getNameIndex();
  const candidates = [...profiles];

  if (!complete) {
    // 取り切れなかった分は API の検索（大文字小文字を区別する）で補う
    const { client, parentName } = getContext();
    const page = await client.getFilteredSubnames({
      parentName,
      labelSearch: query.trim(),
      page: 1,
      size: SEARCH_PAGE_SIZE,
    });
    candidates.push(
      ...(page?.items ?? []).map((dto) => toProfile(dto, parentName)),
    );
  }

  const seen = new Set<string>();
  const hits: { profile: NameProfile; folded: string }[] = [];
  for (const profile of candidates) {
    if (seen.has(profile.name)) continue;
    const folded = foldLabel(profile.name);
    if (!folded.includes(needle)) continue;
    seen.add(profile.name);
    hits.push({ profile, folded });
  }

  hits.sort((a, b) => {
    const aPrefix = a.folded.startsWith(needle) ? 0 : 1;
    const bPrefix = b.folded.startsWith(needle) ? 0 : 1;
    if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    return a.folded.localeCompare(b.folded);
  });

  return hits.slice(0, SEARCH_PAGE_SIZE).map((hit) => hit.profile);
}

/**
 * ラベルの完全一致取得。存在しなければ null。
 * まず入力そのままで引き、無ければ表記揺れを無視してインデックスから探す
 * （`alice` で `Alice` を、`Alice` で `alice` を引ける）。
 */
export async function getNameByLabel(
  label: string,
): Promise<NameProfile | null> {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const exact = await fetchByExactLabel(trimmed);
  if (exact) return exact;

  const needle = foldLabel(trimmed);
  const { profiles, complete } = await getNameIndex();
  const hit = profiles.find((profile) => foldLabel(profile.name) === needle);
  if (hit) return hit;

  // 取り切れていない場合は正規化後のラベルも直接引いておく
  if (!complete && needle !== trimmed) {
    return fetchByExactLabel(needle);
  }
  return null;
}

/**
 * ユーザー名が未使用かどうか。
 * 表記揺れを無視して判定するので、`Alice` が登録済みなら `alice` も使用中扱いになる。
 */
export async function isNameAvailable(label: string): Promise<boolean> {
  return (await getNameByLabel(label)) === null;
}

export async function deleteName(label: string): Promise<void> {
  const { client, parentName } = getContext();

  try {
    await client.deleteSubname(fullName(label, parentName));
  } catch (error) {
    // 既に存在しない名前の削除は、呼び出し側が望んだ状態そのもの
    if (!isNotFound(error)) throw error;
  }
  invalidateNameIndex();
}
