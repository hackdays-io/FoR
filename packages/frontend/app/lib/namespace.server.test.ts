import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Namespace API の実測挙動（大文字小文字を区別する）を模した偽クライアント。
 *   - getFilteredSubnames の labelSearch は大文字小文字を区別する部分一致
 *   - getSingleSubname は完全一致で、無ければ 404 の AxiosError 相当を投げる
 */
interface StoredSubname {
  label: string;
  owner: string;
}

const PARENT = "toban.eth";
let store: StoredSubname[] = [];

const toDto = (s: StoredSubname) => ({
  label: s.label,
  fullName: `${s.label}.${PARENT}`,
  parentName: PARENT,
  owner: s.owner,
  addresses: { "60": s.owner },
  texts: {},
});

const notFound = () =>
  Object.assign(new Error("Request failed with status code 404"), {
    response: { status: 404 },
  });

const getFilteredSubnames = vi.fn(
  async (query: { labelSearch?: string; page: number; size: number }) => {
    const items = store
      .filter((s) => !query.labelSearch || s.label.includes(query.labelSearch))
      .map(toDto);
    const start = (query.page - 1) * query.size;
    return {
      items: items.slice(start, start + query.size),
      totalItems: items.length,
    };
  },
);

const getSingleSubname = vi.fn(async (fullName: string) => {
  const hit = store.find((s) => `${s.label}.${PARENT}` === fullName);
  if (!hit) throw notFound();
  return toDto(hit);
});

const createSubname = vi.fn(async (req: { label: string; owner: string }) => {
  store = store.filter((s) => s.label !== req.label);
  store.push({ label: req.label, owner: req.owner });
});

const deleteSubname = vi.fn(async (fullName: string) => {
  store = store.filter((s) => `${s.label}.${PARENT}` !== fullName);
});

vi.mock("@thenamespace/offchain-manager", () => {
  class SubnameNotFoundError extends Error {}
  return {
    ChainName: { Ethereum: "ethereum" },
    getCoinType: () => 60,
    SubnameNotFoundError,
    createOffchainClient: () => ({
      getFilteredSubnames,
      getSingleSubname,
      createSubname,
      deleteSubname,
    }),
  };
});

const ALICE = "0x9284c1352b8c9a0b76d7adb58d99abbe475c76b4";
const BOB = "0xc69f53975884e1a9194c427a6d9abcce5f4bdd79";

/** モジュールスコープのインデックスキャッシュを毎回捨てるため、都度読み込み直す */
async function loadModule() {
  vi.resetModules();
  return import("./namespace.server");
}

beforeEach(() => {
  process.env.NAMESPACE_API_KEY = "test-key";
  process.env.NAMESPACE_PARENT_NAME = PARENT;
  store = [
    { label: "Alice", owner: ALICE },
    { label: "bob", owner: BOB },
    { label: "RickyAigbe", owner: BOB },
    { label: "Uchida na", owner: BOB },
    { label: "ryoma", owner: BOB },
  ];
  vi.clearAllMocks();
});

describe("searchNames", () => {
  it("大文字で登録された名前を小文字のクエリで引ける", async () => {
    const { searchNames } = await loadModule();
    const results = await searchNames("alice");
    expect(results.map((p) => p.name)).toEqual(["Alice"]);
  });

  it("小文字で登録された名前を先頭大文字のクエリで引ける", async () => {
    const { searchNames } = await loadModule();
    const results = await searchNames("Bob");
    expect(results.map((p) => p.name)).toEqual(["bob"]);
  });

  it("ラベル途中の大文字も無視して部分一致する", async () => {
    const { searchNames } = await loadModule();
    const results = await searchNames("aigbe");
    expect(results.map((p) => p.name)).toEqual(["RickyAigbe"]);
  });

  it("ENS 正規化できない既存ラベル（スペース入り）も検索対象になる", async () => {
    const { searchNames } = await loadModule();
    const results = await searchNames("uchida");
    expect(results.map((p) => p.name)).toEqual(["Uchida na"]);
  });

  it("前方一致を先に、残りをラベル順に並べる", async () => {
    store.push(
      { label: "Malice", owner: BOB },
      { label: "alicia", owner: BOB },
    );
    const { searchNames } = await loadModule();
    const results = await searchNames("ali");
    expect(results.map((p) => p.name)).toEqual(["Alice", "alicia", "Malice"]);
  });

  it("空白のみのクエリは Namespace を叩かず空を返す", async () => {
    const { searchNames } = await loadModule();
    expect(await searchNames("   ")).toEqual([]);
    expect(getFilteredSubnames).not.toHaveBeenCalled();
  });

  it("全件インデックスは短期間キャッシュされ、連続検索で再取得しない", async () => {
    const { searchNames } = await loadModule();
    await searchNames("a");
    await searchNames("b");
    expect(getFilteredSubnames).toHaveBeenCalledTimes(1);
  });

  it("登録・削除後はインデックスを捨てて再取得する", async () => {
    const { searchNames, setName, deleteName } = await loadModule();
    expect(await searchNames("carol")).toEqual([]);

    await setName({ name: "carol", address: ALICE });
    expect((await searchNames("Carol")).map((p) => p.name)).toEqual(["carol"]);

    await deleteName("carol");
    expect(await searchNames("carol")).toEqual([]);
  });
});

describe("getNameByLabel", () => {
  it("完全一致はインデックスを使わず直接引く", async () => {
    const { getNameByLabel } = await loadModule();
    const profile = await getNameByLabel("Alice");
    expect(profile?.name).toBe("Alice");
    expect(profile?.address).toBe(ALICE);
    expect(getFilteredSubnames).not.toHaveBeenCalled();
  });

  it("表記揺れがあればインデックスから探す（alice → Alice）", async () => {
    const { getNameByLabel } = await loadModule();
    const profile = await getNameByLabel("alice");
    expect(profile?.name).toBe("Alice");
  });

  it("表記揺れがあればインデックスから探す（BOB → bob）", async () => {
    const { getNameByLabel } = await loadModule();
    const profile = await getNameByLabel("BOB");
    expect(profile?.name).toBe("bob");
  });

  it("存在しない名前は null", async () => {
    const { getNameByLabel } = await loadModule();
    expect(await getNameByLabel("nobody")).toBeNull();
    expect(await getNameByLabel("")).toBeNull();
  });
});

describe("isNameAvailable", () => {
  it("大文字で登録済みの名前は小文字でも使用中扱いになる", async () => {
    const { isNameAvailable } = await loadModule();
    expect(await isNameAvailable("alice")).toBe(false);
    expect(await isNameAvailable("ALICE")).toBe(false);
  });

  it("小文字で登録済みの名前は大文字でも使用中扱いになる", async () => {
    const { isNameAvailable } = await loadModule();
    expect(await isNameAvailable("Bob")).toBe(false);
  });

  it("未登録の名前は使用可能", async () => {
    const { isNameAvailable } = await loadModule();
    expect(await isNameAvailable("carol")).toBe(true);
  });
});
