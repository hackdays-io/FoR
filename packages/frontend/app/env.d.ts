/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 通貨単位ラベル（未指定時は "FoR"）。 */
  readonly VITE_CURRENCY_LABEL?: string;
  /** ユーザー情報入力用 Google フォームの URL。{address} はウォレットアドレスに置換される。 */
  readonly VITE_ALLOWLIST_FORM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
