import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NameProfile } from "~/lib/namespace.server";

const listAllNames = vi.fn();
const getNamesByAddress = vi.fn();

vi.mock("~/lib/namespace.server", () => ({
  listAllNames: (...args: unknown[]) => listAllNames(...args),
  getNamesByAddress: (...args: unknown[]) => getNamesByAddress(...args),
}));

// Pinata の環境変数が無い前提。ipfs2https は throw するので avatar はそのまま返るはず
vi.mock("~/lib/ipfs", () => ({
  ipfs2https: () => {
    throw new Error("VITE_PINATA_JWT is not defined");
  },
}));

const ALICE = "0x9284c1352b8c9a0b76d7adb58d99abbe475c76b4";
const BOB = "0xc69f53975884e1a9194c427a6d9abcce5f4bdd79";
const CAROL = "0x74d225dcb510d36582b4a7a116a9cfa071223663";

const profile = (
  name: string,
  address: string,
  texts: Record<string, string> = {},
): NameProfile => ({
  name,
  address,
  domain: "toban.eth",
  text_records: texts,
});

/** モジュールスコープのキャッシュを毎回捨てるため、都度読み込み直す */
async function loadModule() {
  vi.resetModules();
  return import("./profiles.server");
}

beforeEach(() => {
  listAllNames.mockReset();
  getNamesByAddress.mockReset();
});

describe("resolveProfiles - ディレクトリが全件取れている場合", () => {
  beforeEach(() => {
    listAllNames.mockResolvedValue({
      profiles: [profile("alice", ALICE, { display: "アリス" })],
      complete: true,
    });
  });

  it("載っているアドレスは名前に、載っていないアドレスは匿名になる", async () => {
    const { resolveProfiles } = await loadModule();
    const views = await resolveProfiles([ALICE, BOB]);

    expect(views.get(ALICE)).toMatchObject({
      name: "alice.toban.eth",
      label: "alice",
      display_name: "アリス",
      is_registered: true,
    });
    expect(views.get(BOB)).toMatchObject({
      name: null,
      display_name: "0xc69f…dd79",
      is_registered: false,
    });
  });

  it("未登録と分かるので個別問い合わせはしない", async () => {
    const { resolveProfiles } = await loadModule();
    await resolveProfiles([BOB, CAROL]);

    expect(getNamesByAddress).not.toHaveBeenCalled();
  });

  it("2 回呼んでもディレクトリの取得は 1 回だけ", async () => {
    const { resolveProfiles } = await loadModule();
    await resolveProfiles([ALICE]);
    await resolveProfiles([BOB]);

    expect(listAllNames).toHaveBeenCalledTimes(1);
  });

  it("同時に呼ばれてもディレクトリの取得は 1 回だけ", async () => {
    const { resolveProfiles } = await loadModule();
    await Promise.all([resolveProfiles([ALICE]), resolveProfiles([BOB])]);

    expect(listAllNames).toHaveBeenCalledTimes(1);
  });

  it("display が無ければラベルを表示名にする", async () => {
    listAllNames.mockResolvedValue({
      profiles: [profile("alice", ALICE)],
      complete: true,
    });

    const { resolveProfiles } = await loadModule();
    expect(views(await resolveProfiles([ALICE]), ALICE).display_name).toBe(
      "alice",
    );
  });

  it("ipfs:// の avatar は変換に失敗しても元の値を残す", async () => {
    listAllNames.mockResolvedValue({
      profiles: [profile("alice", ALICE, { avatar: "ipfs://cid" })],
      complete: true,
    });

    const { resolveProfiles } = await loadModule();
    expect(views(await resolveProfiles([ALICE]), ALICE).avatar).toBe(
      "ipfs://cid",
    );
  });
});

describe("resolveProfiles - ディレクトリが不完全な場合", () => {
  beforeEach(() => {
    listAllNames.mockResolvedValue({
      profiles: [profile("alice", ALICE)],
      complete: false,
    });
  });

  it("載っていないアドレスは個別に問い合わせる", async () => {
    getNamesByAddress.mockResolvedValue([profile("bob", BOB)]);

    const { resolveProfiles } = await loadModule();
    const result = await resolveProfiles([ALICE, BOB]);

    expect(getNamesByAddress).toHaveBeenCalledTimes(1);
    expect(getNamesByAddress).toHaveBeenCalledWith(BOB);
    expect(result.get(BOB)?.name).toBe("bob.toban.eth");
  });

  it("サブネーム無しの結果もキャッシュして二度は引かない", async () => {
    getNamesByAddress.mockResolvedValue([]);

    const { resolveProfiles } = await loadModule();
    await resolveProfiles([BOB]);
    await resolveProfiles([BOB]);

    expect(getNamesByAddress).toHaveBeenCalledTimes(1);
  });
});

describe("resolveProfiles - Namespace が落ちている場合", () => {
  it("全員匿名で返し、例外は投げない", async () => {
    listAllNames.mockRejectedValue(new Error("namespace down"));
    getNamesByAddress.mockRejectedValue(new Error("namespace down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { resolveProfiles } = await loadModule();
    const result = await resolveProfiles([ALICE]);

    expect(result.get(ALICE)).toMatchObject({ is_registered: false });
    errorSpy.mockRestore();
  });

  it("一度失敗したら冷却期間中は個別問い合わせを打ち切る", async () => {
    listAllNames.mockRejectedValue(new Error("namespace down"));
    getNamesByAddress.mockRejectedValue(new Error("namespace down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { resolveProfiles } = await loadModule();
    await resolveProfiles([ALICE]);
    const callsAfterFirst = getNamesByAddress.mock.calls.length;

    await resolveProfiles([BOB, CAROL]);

    // 2 回目は 1 件も叩かずに匿名で返す
    expect(getNamesByAddress.mock.calls.length).toBe(callsAfterFirst);
    errorSpy.mockRestore();
  });
});

function views(
  map: Map<string, { display_name: string; avatar: string | null }>,
  address: string,
) {
  const view = map.get(address);
  if (!view) throw new Error(`${address} が解決されていません`);
  return view;
}
