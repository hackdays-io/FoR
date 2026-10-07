import { ens_normalize } from "@adraffy/ens-normalize";

/**
 * ENS サブネームのラベル（ユーザー名）の正規化。
 *
 * Namespace のラベル検索・完全一致・空き確認はすべて大文字小文字を区別する
 * （実測: `Ryoma` で引くと `ryoma` は 404、空き確認も「利用可能」と返る）。
 * 登録時は ENS 正規化した文字列を書き込み、突合時は登録済みラベルと
 * クエリの両方を同じ規則で畳み込んでから比べることで、表記揺れを吸収する。
 */

/**
 * 登録用の正規化。ENSIP-15 に従い小文字化・NFC 化する。
 * 使用できない文字（スペースなど）を含む場合は ens_normalize がそのまま throw する。
 */
export function normalizeLabel(input: string): string {
  return ens_normalize(input.trim());
}

/**
 * 検索・突合用の畳み込み。
 *
 * 基本は ENS 正規化だが、親名を共有する toban 側には `Uchida na` のように
 * ENS 正規化できないラベルも登録されているため、失敗時は NFKC + 小文字化で代用する。
 * 戻り値は比較専用で、登録や表示には使わない。
 */
export function foldLabel(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    return ens_normalize(trimmed);
  } catch {
    return trimmed.normalize("NFKC").toLowerCase();
  }
}

/** 2 つのラベルが表記揺れを無視して同じ名前を指すか */
export function isSameLabel(a: string, b: string): boolean {
  return foldLabel(a) === foldLabel(b);
}
