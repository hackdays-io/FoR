import { ChevronRight, ExternalLink } from "lucide-react";
import * as React from "react";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

export interface NavListRowProps {
  /** 行ラベル */
  label: string;
  /** 内部遷移先（React Router の Link として描画） */
  to?: string;
  /** 外部リンク先（新規タブで開き、末尾に外部リンクアイコンを表示） */
  href?: string;
  /** ボタンとして使う場合のクリックハンドラ */
  onClick?: () => void;
  className?: string;
}

const rowClassName =
  "flex w-full items-center justify-between gap-12 border-b border-border py-16 text-left transition-colors hover:bg-secondary/40";

/**
 * 設定メニューなどの遷移リスト 1 行。
 * - `to` を渡すと内部遷移リンク（末尾にシェブロン）
 * - `href` を渡すと外部リンク（新規タブ・末尾に外部リンクアイコン）
 * - `onClick` のみ渡すとボタン
 */
export const NavListRow = React.forwardRef<HTMLElement, NavListRowProps>(
  ({ label, to, href, onClick, className }, ref) => {
    const isExternal = href != null;
    const TrailingIcon = isExternal ? ExternalLink : ChevronRight;

    const content = (
      <>
        <span className="min-w-0 flex-1 truncate text-ui-13 font-bold text-text-default">
          {label}
        </span>
        <TrailingIcon
          size={20}
          aria-hidden="true"
          className="shrink-0 text-text-default"
        />
      </>
    );

    if (isExternal) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(rowClassName, className)}
          data-slot="nav-list-row"
        >
          {content}
        </a>
      );
    }

    if (to != null) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={cn(rowClassName, className)}
          data-slot="nav-list-row"
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={cn(rowClassName, className)}
        data-slot="nav-list-row"
      >
        {content}
      </button>
    );
  },
);

NavListRow.displayName = "NavListRow";
