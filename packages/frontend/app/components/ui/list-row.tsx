import { ExternalLink } from "lucide-react";
import * as React from "react";

import { formatAmount } from "~/lib/format";
import { cn } from "~/lib/utils";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** アバター画像URL */
  avatarSrc?: string;
  /** アバターのalt */
  avatarAlt?: string;
  /** 名前（1行目左） */
  name: string;
  /** メッセージ（2行目左） */
  message?: string;
  /** 日付テキスト（1行目右、例: "10/29 (水)"） */
  date?: string;
  /** 金額（2行目右、例: 50 or -50） */
  amount?: number;
  /** 金額の単位（デフォルト: "FoR"） */
  unit?: string;
  /** 下部のdividerを表示するか（デフォルト: true） */
  divider?: boolean;
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
      name,
      message,
      date,
      amount,
      unit = "FoR",
      divider = true,
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
          "flex items-center gap-12 py-12",
          divider && "border-b border-border",
          className,
        )}
        data-slot="list-row"
        {...props}
      >
        {/* Avatar */}
        <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={avatarAlt}
              className="size-40 rounded-full object-cover"
            />
          ) : (
            <div className="size-40 rounded-full bg-foreground/10" />
          )}
        </div>

        {/* Left content: name + message */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-ui-16 font-medium text-foreground">
            {name}
          </span>
          {message ? (
            <span className="truncate text-ui-13 text-muted-foreground">
              {message}
            </span>
          ) : null}
        </div>

        {/* Right content: date + amount */}
        {date != null || amount != null ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {date ? (
              <span className="text-ui-13 text-muted-foreground">{date}</span>
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
