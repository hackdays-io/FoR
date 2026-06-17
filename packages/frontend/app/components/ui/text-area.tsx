import * as React from "react";

import { cn } from "~/lib/utils";

const textAreaVariantClasses = {
  default: {
    textarea: "text-foreground placeholder:text-foreground/30",
    label: "text-foreground",
    message: "text-muted-foreground",
    root: "border-text-hint bg-card focus-within:border-foreground",
  },
  error: {
    textarea: "text-foreground placeholder:text-foreground/30",
    label: "text-foreground",
    message: "text-text-danger-default",
    root: "border-destructive bg-card hover:border-text-danger-strong focus-within:border-text-danger-strong",
  },
} as const;

// SSR では useLayoutEffect が警告を出すため、クライアントでのみ layout effect を使う
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type TextAreaVariant = keyof typeof textAreaVariantClasses;

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  errorText?: React.ReactNode;
  helperText?: React.ReactNode;
  label?: React.ReactNode;
  /** 自動拡張時の最小行数 */
  minRows?: number;
  variant?: TextAreaVariant;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      disabled = false,
      errorText,
      helperText,
      id,
      label,
      minRows = 3,
      readOnly = false,
      value,
      variant = "default",
      onChange,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(
      ref,
      () => innerRef.current as HTMLTextAreaElement,
    );

    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = errorText
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;
    const resolvedVariant = errorText ? "error" : variant;
    const variantClasses = textAreaVariantClasses[resolvedVariant];

    // 入力内容に合わせて高さを自動拡張する
    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    // value が外部から変化した場合にも高さを再計算する
    useIsomorphicLayoutEffect(() => {
      resize();
    }, [resize, value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      resize();
    };

    return (
      <div
        className={cn("flex w-full flex-col gap-8", className)}
        data-slot="text-area"
      >
        {label ? (
          <label
            className={cn(
              "font-medium text-ui-16",
              variantClasses.label,
              disabled && "text-muted-foreground",
            )}
            htmlFor={inputId}
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "flex w-full rounded-[4px] border px-10 py-12 transition-colors",
            variantClasses.root,
            disabled && "border-border bg-muted text-muted-foreground",
            readOnly && !disabled && "bg-background text-muted-foreground",
          )}
        >
          <textarea
            aria-describedby={messageId}
            aria-invalid={errorText ? true : undefined}
            className={cn(
              "w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent font-ui text-ui-16 outline-none",
              "selection:bg-primary selection:text-primary-foreground",
              "disabled:cursor-not-allowed disabled:text-muted-foreground",
              "read-only:cursor-default",
              variantClasses.textarea,
            )}
            disabled={disabled}
            id={inputId}
            onChange={handleChange}
            readOnly={readOnly}
            ref={innerRef}
            rows={minRows}
            value={value}
            {...props}
          />
        </div>
        {errorText ? (
          <p
            className={cn("font-medium text-ui-12", variantClasses.message)}
            id={messageId}
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            className={cn("text-ui-12", variantClasses.message)}
            id={messageId}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
