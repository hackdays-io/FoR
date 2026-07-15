import { ExternalLink } from "lucide-react";
import * as React from "react";

import { Avatar } from "~/components/ui/avatar";
import { CURRENCY_LABEL } from "~/lib/currency";
import { formatAmount } from "~/lib/format";
import { cn } from "~/lib/utils";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アバター画像URL */
  avatarSrc?: string;
  /** アバターのalt */
  avatarAlt?: string;
  /** アバターを非表示にする（例: 集計値の行など人物に紐づかない行） */
  hideAvatar?: boolean;
  /** アバタークリック時のハンドラ（指定時はアバターをボタン化し、行の onClick へは伝播させない） */
  onAvatarClick?: () => void;
  /** 名前（1行目左） */
  name: string;
  /** メッセージ（2行目左） */
  message?: string;
  /** ユースケースのタグ（右上に濃色バッジで表示、例: "コミュニティ"） */
  tag?: string;
  /** 日付テキスト（1行目右、例: "10/29 (水)"） */
  date?: string;
  /** 金額（2行目右、例: 50 or -50） */
  amount?: number;
  /** 金額の単位（デフォルト: CURRENCY_LABEL） */
  unit?: string;
  /** 行末に外部リンク（例: ブロックエクスプローラ）を表示する */
  externalUrl?: string;
  /** 外部リンクの aria-label */
  externalUrlLabel?: string;
}

function formatSignedAmount(amount: number): string {
  const formatted = formatAmount(amount);
  return amount >= 0 ? `+${formatted}` : formatted;
}

export const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(
  (
    {
      avatarSrc,
      avatarAlt = "",
      hideAvatar = false,
      onAvatarClick,
      name,
      message,
      tag,
      date,
      amount,
      unit = CURRENCY_LABEL,
      externalUrl,
      externalUrlLabel = "ブロックエクスプローラで開く",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center gap-12 px-16 py-18 bg-background rounded-[10px]",
          className,
        )}
        data-slot="list-row"
        {...props}
      >
        {tag ? (
          <span className="absolute top-0 right-0 rounded-tr-[10px] rounded-bl-[14px] bg-primary px-12 py-3 text-ui-10 font-bold text-primary-foreground">
            {tag}
          </span>
        ) : null}
        {hideAvatar ? null : onAvatarClick ? (
          <button
            type="button"
            aria-label={`${name}のプロフィール`}
            onClick={(event) => {
              event.stopPropagation();
              onAvatarClick();
            }}
            className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar src={avatarSrc} alt={avatarAlt} size="sm" />
          </button>
        ) : (
          <Avatar src={avatarSrc} alt={avatarAlt} size="sm" />
        )}

        {/* Left content: name + message */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <span className="truncate text-ui-13 font-bold text-foreground">
            {name}
          </span>
          {message ? (
            <span className="truncate text-ui-13 text-foreground">
              {message}
            </span>
          ) : null}
        </div>

        {/* Right content: date + amount */}
        {date != null || amount != null ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {date ? (
              <span className="text-ui-13 text-foreground">{date}</span>
            ) : null}
            {amount != null ? (
              <span
                className={cn(
                  "font-latin text-ui-16 font-bold",
                  amount >= 0 ? "text-foreground" : "text-text-danger-default",
                )}
              >
                {formatSignedAmount(amount)}{" "}
                <span className="text-ui-13 font-medium">{unit}</span>
              </span>
            ) : null}
          </div>
        ) : null}

        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={externalUrlLabel}
            className="shrink-0 rounded-md p-4 text-muted-foreground hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    );
  },
);

ListRow.displayName = "ListRow";
