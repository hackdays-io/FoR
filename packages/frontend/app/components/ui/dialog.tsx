import * as React from "react";

import { cn } from "~/lib/utils";

export interface DialogProps {
  open: boolean;
  /** 背景クリック・Esc キーで閉じるときに呼ばれる。未指定なら閉じられない。 */
  onClose?: () => void;
  /** 見出し。aria-labelledby に使う。 */
  title: React.ReactNode;
  /** 本文。aria-describedby に使う。 */
  description?: React.ReactNode;
  /** フッターに並べるボタンなど */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 画面中央に出すモーダルダイアログ。
 * 開いている間は背景のスクロールを止め、Esc キーと背景クリックで onClose を呼ぶ。
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  actions,
  className,
}: DialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-20">
      {/* 背景 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-alpha-black-25"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative flex w-full max-w-[400px] flex-col gap-16 rounded-xl bg-bg-default p-24 shadow-elevation-1",
          className,
        )}
      >
        <h2
          id={titleId}
          className="font-ui text-content-headline-s font-bold text-foreground"
        >
          {title}
        </h2>
        {description && (
          <div
            id={descriptionId}
            className="font-ui text-content-body-m leading-relaxed text-foreground"
          >
            {description}
          </div>
        )}
        {actions && <div className="flex flex-col gap-8 pt-8">{actions}</div>}
      </div>
    </div>
  );
}
