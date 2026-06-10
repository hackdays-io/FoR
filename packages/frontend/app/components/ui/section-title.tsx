import * as React from "react";

import { cn } from "~/lib/utils";

const titleVariantClasses = {
  large: "font-ui text-ui-20 font-normal",
  small: "font-ui text-ui-16 font-normal",
} as const;

export type SectionTitleProps = React.ComponentPropsWithoutRef<"div"> & {
  variant?: "large" | "small";
  moreLabel?: string;
  onMoreClick?: () => void;
};

export const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  (
    {
      children,
      className,
      variant = "large",
      moreLabel,
      onMoreClick,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-8 py-8",
          className,
        )}
        data-slot="section-title"
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            titleVariantClasses[variant],
            "line-clamp-1 min-w-0 shrink",
          )}
        >
          {children}
        </span>
        {moreLabel && (
          <button
            className="shrink-0 font-ui text-ui-13 font-normal text-foreground"
            onClick={onMoreClick}
            type="button"
          >
            {moreLabel}
          </button>
        )}
      </div>
    );
  },
);

SectionTitle.displayName = "SectionTitle";
