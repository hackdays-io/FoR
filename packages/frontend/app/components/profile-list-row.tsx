import { ListRow } from "~/components/ui/list-row";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { shortenAddress } from "~/lib/utils";

export interface ProfileListRowProps {
  /** 表示対象のアドレス（プロフィールの名前・サムネイルを解決する） */
  address: string;
  /** メッセージ・コメント（2行目左） */
  message?: string;
  /** 日付テキスト（1行目右） */
  date?: string;
  /** 金額（2行目右） */
  amount?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * アドレスからプロフィール（表示名・サムネイル）を解決して {@link ListRow} を描画する共通行コンポーネント。
 * あなたのウォレットの履歴・みんなの貢献履歴など、ユーザーの行を表示する画面で共有する。
 */
export function ProfileListRow({
  address,
  message,
  date,
  amount,
  onClick,
  className,
}: ProfileListRowProps) {
  const { data: profile } = useProfileByAddress(address);
  const displayName =
    profile?.text_records?.display || profile?.name || shortenAddress(address);

  return (
    <ListRow
      name={displayName}
      avatarSrc={profile?.text_records?.avatar}
      message={message}
      date={date}
      amount={amount}
      onClick={onClick}
      className={className}
    />
  );
}
