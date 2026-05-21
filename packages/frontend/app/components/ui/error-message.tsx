import { Check, ChevronDown, Copy, TriangleAlert } from "lucide-react";
import * as React from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

/**
 * 例外オブジェクトからデバッグ用の技術的な詳細文字列を取り出す。
 * viem のエラーは `message` に複数行の内訳を持つため、そのまま利用する。
 */
function extractErrorDetail(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 表示対象のエラー。null / undefined のときは何も描画しない */
  error: unknown;
  /** ユーザー向けの見出し */
  title?: string;
  /** 見出しの下に表示する補足文。空文字を渡すと非表示になる */
  description?: string;
}

/**
 * エラーをユーザーに分かりやすく伝えつつ、開発者向けに生エラーを
 * 折りたたみで確認・コピーできるようにするコンポーネント。
 */
export function ErrorMessage({
  error,
  title = "エラーが発生しました",
  description = "もう一度お試しください。",
  className,
  ...props
}: ErrorMessageProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const detail = extractErrorDetail(error);

  if (error == null) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(detail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボード API が使えない環境では何もしない
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-text-danger-default/30 bg-text-danger-default/5 p-12",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-8">
        <TriangleAlert
          aria-hidden
          className="mt-2 size-16 shrink-0 text-text-danger-default"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Typography
            variant="ui-13"
            weight="bold"
            className="text-text-danger-default"
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="ui-12" className="text-foreground">
              {description}
            </Typography>
          )}

          {detail && (
            <div className="mt-6">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 text-ui-12 text-text-hint"
              >
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-14 transition-transform",
                    expanded && "rotate-180",
                  )}
                />
                {expanded ? "詳細を隠す" : "詳細を表示"}
              </button>

              {expanded && (
                <div className="mt-6 rounded-md bg-muted p-8">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-2 text-ui-10 text-text-hint"
                    >
                      {copied ? (
                        <Check aria-hidden className="size-12" />
                      ) : (
                        <Copy aria-hidden className="size-12" />
                      )}
                      {copied ? "コピーしました" : "コピー"}
                    </button>
                  </div>
                  <pre className="mt-4 max-h-[160px] overflow-auto whitespace-pre-wrap break-words text-ui-10 text-foreground">
                    {detail}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
