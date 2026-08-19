import {
  ChainName,
  createOffchainClient,
  getCoinType,
  type OffchainClient,
  type SubnameDTO,
  SubnameNotFoundError,
} from "@thenamespace/offchain-manager";

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

/** ラベルの部分一致検索。ユーザー検索用 */
export async function searchNames(query: string): Promise<NameProfile[]> {
  const { client, parentName } = getContext();

  const page = await client.getFilteredSubnames({
    parentName,
    labelSearch: query,
    page: 1,
    size: SEARCH_PAGE_SIZE,
  });

  return (page?.items ?? []).map((dto) => toProfile(dto, parentName));
}

/** ラベルの完全一致取得。存在しなければ null */
export async function getNameByLabel(
  label: string,
): Promise<NameProfile | null> {
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

  try {
    await client.deleteSubname(fullName(label, parentName));
  } catch (error) {
    // 既に存在しない名前の削除は、呼び出し側が望んだ状態そのもの
    if (!isNotFound(error)) throw error;
  }
}
