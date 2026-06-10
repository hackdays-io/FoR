/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 通貨単位ラベル（未指定時は "FoR"）。 */
  readonly VITE_CURRENCY_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
