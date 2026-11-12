import { describe, expect, it } from "vitest";
import { foldLabel, isSameLabel, normalizeLabel } from "./label";

describe("normalizeLabel", () => {
  it("小文字化と前後の空白除去を行う", () => {
    expect(normalizeLabel("Alice")).toBe("alice");
    expect(normalizeLabel("  RickyAigbe  ")).toBe("rickyaigbe");
  });

  it("全角英字も ASCII 小文字に寄せる", () => {
    expect(normalizeLabel("Ａｌｉｃｅ")).toBe("alice");
  });

  it("日本語やドット入りラベルはそのまま通す", () => {
    expect(normalizeLabel("尾石光")).toBe("尾石光");
    expect(normalizeLabel("Taishi.K")).toBe("taishi.k");
  });

  it("使用できない文字を含む場合は throw する", () => {
    expect(() => normalizeLabel("Uchida na")).toThrow();
  });
});

describe("foldLabel", () => {
  it("ENS 正規化できるものは normalizeLabel と同じ結果になる", () => {
    expect(foldLabel("Alice")).toBe("alice");
    expect(foldLabel("Ａｌｉｃｅ")).toBe("alice");
  });

  it("ENS 正規化できないラベルは NFKC + 小文字化で代用し throw しない", () => {
    expect(foldLabel("Uchida na")).toBe("uchida na");
    expect(foldLabel("Ｕｃｈｉｄａ na")).toBe("uchida na");
  });

  it("空白のみは空文字になる", () => {
    expect(foldLabel("   ")).toBe("");
  });
});

describe("isSameLabel", () => {
  it("大文字小文字の違いを無視して比較する", () => {
    expect(isSameLabel("Alice", "alice")).toBe(true);
    expect(isSameLabel("RYU", "ryu")).toBe(true);
    expect(isSameLabel("alice", "alicia")).toBe(false);
  });
});
