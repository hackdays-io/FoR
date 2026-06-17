import { PresentIcon, QRIcon, ScanIcon, SendIcon } from "~/components/icons";
import {
  BottomNavigation,
  BottomNavigationItem,
} from "~/components/ui/bottom-navigation";

const ICON_SIZE = 32;

/**
 * 全ページ共通のボトムナビゲーション。
 * アイコン 32px・ラベル 12px Bold で統一し、ページごとに崩れないよう一箇所で管理する。
 */
export function MainBottomNavigation() {
  return (
    <BottomNavigation>
      <BottomNavigationItem
        icon={<SendIcon width={ICON_SIZE} height={ICON_SIZE} />}
        label="送る"
        to="/transactions"
      />
      <BottomNavigationItem
        icon={<ScanIcon width={ICON_SIZE} height={ICON_SIZE} />}
        label="スキャン"
        to="/scan"
      />
      <BottomNavigationItem
        icon={<QRIcon width={ICON_SIZE} height={ICON_SIZE} />}
        label="マイコード"
        to="/receive"
      />
      <BottomNavigationItem
        icon={<PresentIcon width={ICON_SIZE} height={ICON_SIZE} />}
        label="おすそわけ"
        to="/osusowake"
      />
    </BottomNavigation>
  );
}
