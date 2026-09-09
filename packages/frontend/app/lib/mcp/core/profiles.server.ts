import { ipfs2https } from "~/lib/ipfs";
import {
  getNamesByAddress,
  listAllNames,
  type NameProfile,
} from "~/lib/namespace.server";
import { anonymousProfile, type ProfileView, shortAddress } from "./present";

/**
 * アドレス → ENS サブネームの解決。
 *
 * 取引一覧 1 ページで最大 100 アドレスを引くことになるため、
 * 1 アドレス 1 リクエストでは Namespace 側にも Vercel の実行時間にも厳しい。
 * 一次戦略として親名配下のサブネームを丸ごとキャッシュし、
 * 取り切れなかった場合だけ個別問い合わせにフォールバックする。
 */

const DIRECTORY_TTL_MS = 5 * 60_000;
const INDIVIDUAL_TTL_MS = 5 * 60_000;
const MAX_DIRECTORY_ITEMS = 2000;
const FALLBACK_CONCURRENCY = 8;

interface Directory {
  fetchedAt: number;
  byAddress: Map<string, NameProfile>;
  /** 親名配下を全件取り切れたか。true なら「載っていない = 未登録」と断定できる */
  complete: boolean;
}

/**
 * モジュールスコープのキャッシュ。サーバーレスではインスタンスごとに独立し、
 * コールドスタートで消えるが、それで困るのは初回リクエストだけなので十分。
 */
let directory: Directory | null = null;
let directoryInFlight: Promise<Directory | null> | null = null;
const individual = new Map<
  string,
  { fetchedAt: number; profile: NameProfile | null }
>();

/**
 * Namespace が落ちている / 未設定のときに、1 リクエストで何十回も無駄に叩かないための冷却期間。
 * 直前に失敗していれば個別問い合わせをスキップして匿名プロフィールで返す。
 * （toban#555 の「Namestone 障害で全リクエストが吊られた」の再発防止）
 */
const FAILURE_COOLDOWN_MS = 60_000;
let failedAt = 0;

function markFailure(): void {
  failedAt = Date.now();
}

function isCoolingDown(): boolean {
  return Date.now() - failedAt < FAILURE_COOLDOWN_MS;
}

/** avatar が ipfs:// のときだけ https に変換する。Pinata 未設定なら元の値のまま */
function toAvatarUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return ipfs2https(raw) ?? null;
  } catch {
    return raw;
  }
}

export function toProfileView(profile: NameProfile): ProfileView {
  const address = profile.address.toLowerCase();
  const label = profile.name;
  const display = profile.text_records?.display?.trim();

  return {
    address,
    name: label ? `${label}.${profile.domain}` : null,
    label: label || null,
    display_name: display || label || shortAddress(address),
    avatar: toAvatarUrl(profile.text_records?.avatar),
    description: profile.text_records?.description?.trim() || null,
    is_registered: true,
    explorer_url: anonymousProfile(address).explorer_url,
  };
}

async function loadDirectory(): Promise<Directory | null> {
  const { profiles, complete } = await listAllNames(MAX_DIRECTORY_ITEMS);

  const byAddress = new Map<string, NameProfile>();
  for (const profile of profiles) {
    const address = profile.address.toLowerCase();
    // 同一アドレスが複数のサブネームを持つ場合は最初の 1 件を採用する
    // （アプリ本体の /api/profile/:address も profiles[0] を使っている）
    if (address && !byAddress.has(address)) byAddress.set(address, profile);
  }

  return { fetchedAt: Date.now(), byAddress, complete };
}

async function getDirectory(): Promise<Directory | null> {
  if (directory && Date.now() - directory.fetchedAt < DIRECTORY_TTL_MS) {
    return directory;
  }
  // 同時に複数のツール呼び出しが来ても全件取得は 1 回で済ませる
  if (!directoryInFlight) {
    directoryInFlight = loadDirectory()
      .then((loaded) => {
        directory = loaded;
        return loaded;
      })
      .catch((error) => {
        console.error("[mcp] failed to load subname directory", error);
        markFailure();
        return null;
      })
      .finally(() => {
        directoryInFlight = null;
      });
  }
  return directoryInFlight;
}

async function fetchIndividual(address: string): Promise<NameProfile | null> {
  const cached = individual.get(address);
  if (cached && Date.now() - cached.fetchedAt < INDIVIDUAL_TTL_MS) {
    return cached.profile;
  }

  try {
    const profiles = await getNamesByAddress(address);
    const profile = profiles[0] ?? null;
    // 「サブネーム無し」も覚えておく。未登録の相手は多く、
    // 負のキャッシュが無いと毎回全件を空振りで叩きに行くことになる。
    individual.set(address, { fetchedAt: Date.now(), profile });
    return profile;
  } catch (error) {
    console.error("[mcp] failed to resolve subname", address, error);
    markFailure();
    return null;
  }
}

/** 並列度を絞って個別解決する（Namespace 側のレート制限対策） */
async function resolveIndividually(
  addresses: string[],
): Promise<Map<string, NameProfile>> {
  const resolved = new Map<string, NameProfile>();
  const queue = [...addresses];

  const workers = Array.from(
    { length: Math.min(FALLBACK_CONCURRENCY, queue.length) },
    async () => {
      for (;;) {
        const address = queue.shift();
        if (!address) return;
        const profile = await fetchIndividual(address);
        if (profile) resolved.set(address, profile);
      }
    },
  );

  await Promise.all(workers);
  return resolved;
}

/**
 * アドレス配列をプロフィールに一括変換する。
 * 未登録・解決失敗のアドレスは短縮アドレス表示の匿名プロフィールになる。
 */
export async function resolveProfiles(
  addresses: string[],
): Promise<Map<string, ProfileView>> {
  const wanted = [...new Set(addresses.map((a) => a.toLowerCase()))].filter(
    Boolean,
  );
  const views = new Map<string, ProfileView>();
  if (wanted.length === 0) return views;

  const dir = await getDirectory();
  const missing: string[] = [];

  for (const address of wanted) {
    const hit = dir?.byAddress.get(address);
    if (hit) {
      views.set(address, toProfileView(hit));
    } else if (dir?.complete) {
      // 全件取り切れているので、載っていない = 未登録と断定できる
      views.set(address, anonymousProfile(address));
    } else {
      missing.push(address);
    }
  }

  if (missing.length > 0 && isCoolingDown()) {
    // Namespace が応答しない状態なので、名前は諦めてアドレス表示で返す
    for (const address of missing)
      views.set(address, anonymousProfile(address));
  } else if (missing.length > 0) {
    const resolved = await resolveIndividually(missing);
    for (const address of missing) {
      const profile = resolved.get(address);
      views.set(
        address,
        profile ? toProfileView(profile) : anonymousProfile(address),
      );
    }
  }

  return views;
}

/** 1 アドレス分の解決。取引の enrich と同じキャッシュを共有する */
export async function resolveProfile(address: string): Promise<ProfileView> {
  const views = await resolveProfiles([address]);
  return views.get(address.toLowerCase()) ?? anonymousProfile(address);
}

/** 取引 enrich 用のリゾルバを作る。未取得アドレスは匿名にフォールバックする */
export function makeResolver(
  views: Map<string, ProfileView>,
): (address: string) => ProfileView {
  return (address: string) =>
    views.get(address.toLowerCase()) ?? anonymousProfile(address);
}

/** get_index_status 用。Namespace 側の状態を可視化する */
export function directoryStatus(): {
  cached: boolean;
  size: number;
  complete: boolean;
} {
  return {
    cached: directory !== null,
    size: directory?.byAddress.size ?? 0,
    complete: directory?.complete ?? false,
  };
}
