import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, disabled = false, ...props }, ref) => {
    /* checked 状態は peer 経由の CSS で描画するため、disabled のみ JS で切替える */
    const boxColorClasses = disabled
      ? "border-checkbox-disabled peer-checked:border-checkbox-disabled peer-checked:bg-checkbox-disabled"
      : "border-checkbox-stroke peer-checked:border-checkbox-frame-checked peer-checked:bg-checkbox-frame-checked";

    return (
      <label
        className={cn(
          "inline-flex items-center",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        {/* 42x42 のインタラクティブ領域 */}
        <span className="relative flex size-42 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={cn(
              "peer absolute inset-0 z-10 m-0 opacity-0",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
            {...props}
          />
          {/* ホバー時の円形背景 */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full transition-colors",
              !disabled && "peer-hover:bg-checkbox-frame-hover",
            )}
          />
          {/* 18x18 のボックス */}
          <span
            aria-hidden
            className={cn(
              "size-18 rounded-[3px] border-2 bg-transparent transition-colors",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
              boxColorClasses,
            )}
          />
          {/* チェックマーク */}
          <Check
            aria-hidden
            strokeWidth={3}
            className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-checkbox-check-invert opacity-0 transition-opacity peer-checked:opacity-100"
          />
        </span>
        {label != null && (
          <span
            className={cn(
              "text-ui-13 font-bold",
              disabled ? "text-checkbox-disabled" : "text-foreground",
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
