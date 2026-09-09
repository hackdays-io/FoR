import { describe, expect, it } from "vitest";
import {
  anonymousProfile,
  type ProfileView,
  type RawTransfer,
  shortAddress,
  toDecimal,
  toTransferView,
  transferLine,
} from "./present";

const ALICE = "0x9284c1352b8c9a0b76d7adb58d99abbe475c76b4";
const BOB = "0xc69f53975884e1a9194c427a6d9abcce5f4bdd79";

const aliceProfile: ProfileView = {
  address: ALICE,
  name: "alice.toban.eth",
  label: "alice",
  display_name: "アリス",
  avatar: null,
  description: null,
  is_registered: true,
  explorer_url: null,
};

const rawTransfer: RawTransfer = {
  id: "0xhash-335",
  sender: { id: ALICE },
  from: { id: ALICE },
  to: { id: BOB },
  totalAmount: "33000000000000000000",
  recipientAmount: "30000000000000000000",
  fundAmount: "3000000000000000000",
  burnAmount: "0",
  message: '{"usecase":"コミュニティ","memo":"ありがとうございました！"}',
  timestamp: "1788656819",
  blockNumber: "50933736",
  transactionHash: "0xhash",
};

const resolve = (address: string): ProfileView =>
  address.toLowerCase() === ALICE ? aliceProfile : anonymousProfile(address);

describe("toDecimal", () => {
  it("18 decimals の wei を小数に直す", () => {
    expect(toDecimal("30000000000000000000")).toBe("30");
    expect(toDecimal("3000000000000000000")).toBe("3");
    expect(toDecimal("1500000000000000000")).toBe("1.5");
    expect(toDecimal("0")).toBe("0");
  });

  it("数値でない値はそのまま返す", () => {
    expect(toDecimal("abc")).toBe("abc");
  });
});

describe("shortAddress", () => {
  it("先頭 6 文字と末尾 4 文字を残す", () => {
    expect(shortAddress(ALICE)).toBe("0x9284…76b4");
  });
});

describe("anonymousProfile", () => {
  it("未登録アドレスは短縮アドレスが表示名になる", () => {
    const profile = anonymousProfile(BOB.toUpperCase());
    expect(profile.address).toBe(BOB);
    expect(profile.is_registered).toBe(false);
    expect(profile.name).toBeNull();
    expect(profile.display_name).toBe("0xc69f…dd79");
  });
});

describe("toTransferView", () => {
  it("金額を分解し、message から usecase と memo を取り出す", () => {
    const view = toTransferView(rawTransfer, resolve);

    expect(view.amount).toMatchObject({
      total: "33",
      recipient: "30",
      fund: "3",
      burn: "0",
    });
    expect(view.amount.raw.total).toBe("33000000000000000000");
    expect(view.usecase).toBe("コミュニティ");
    expect(view.memo).toBe("ありがとうございました！");
    expect(view.from.display_name).toBe("アリス");
    expect(view.to.is_registered).toBe(false);
    expect(view.datetime).toBe("2026-09-06T01:06:59.000Z");
    expect(view.block_number).toBe(50933736);
  });

  it("JSON でない旧フォーマットの message は memo として扱う", () => {
    const view = toTransferView(
      { ...rawTransfer, message: "ありがとう" },
      resolve,
    );
    expect(view.usecase).toBeNull();
    expect(view.memo).toBe("ありがとう");
  });

  it("message が空なら usecase も memo も null", () => {
    const view = toTransferView({ ...rawTransfer, message: "" }, resolve);
    expect(view.usecase).toBeNull();
    expect(view.memo).toBeNull();
  });
});

describe("transferLine", () => {
  it("そのままユーザーに見せられる 1 行になる", () => {
    const line = transferLine(toTransferView(rawTransfer, resolve));

    expect(line).toContain("アリス → 0xc69f…dd79");
    expect(line).toContain("30 FoR");
    expect(line).toContain("基金 3 / burn 0");
    expect(line).toContain("[コミュニティ]");
    expect(line).toContain("「ありがとうございました！」");
    // JST 表示（UTC 01:06 = JST 10:06）
    expect(line).toContain("2026/09/06 10:06");
  });

  it("長いメモは切り詰める", () => {
    const line = transferLine(
      toTransferView(
        { ...rawTransfer, message: JSON.stringify({ memo: "あ".repeat(80) }) },
        resolve,
      ),
    );
    expect(line).toContain("…」");
    expect(line.length).toBeLessThan(140);
  });
});
