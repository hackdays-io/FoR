// オリジナル SVG アイコンの barrel。
// app/assets/icons/*.svg を React コンポーネントとして再エクスポートする。
// 使い方は lucide-react と同じ:
//   import { SendIcon } from "~/components/icons";
//   <SendIcon width={20} height={20} />
//
// SVG 側で fill/stroke を currentColor にしておくと、
// 親の text-* クラスで色を制御できる（lucide と同じ挙動）。
export { default as SendIcon } from "~/assets/icons/send.svg?react";
export { default as QRIcon} from "~/assets/icons/qr.svg?react";
export { default as PresentIcon} from "~/assets/icons/present.svg?react";
export { default as ScanIcon} from "~/assets/icons/scan.svg?react";