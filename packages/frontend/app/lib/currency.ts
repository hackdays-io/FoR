/**
 * 通貨単位ラベルの一元管理。
 *
 * デフォルトは "FoR"。環境変数 VITE_CURRENCY_LABEL が指定されていれば
 * それを優先する（例: テスト環境で別表記にしたい場合）。
 * アプリ内で単位を表示する箇所はすべてこの定数を参照すること。
 */
export const CURRENCY_LABEL = import.meta.env.VITE_CURRENCY_LABEL ?? "FoR";
