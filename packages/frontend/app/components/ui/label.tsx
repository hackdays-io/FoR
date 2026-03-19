import * as React from "react";

import { cn } from "~/lib/utils";

const labelBaseClassName =
  "inline-flex shrink-0 items-center whitespace-nowrap";

const labelVariantClasses = {
  new: {
    primary: "font-latin text-right text-ui-10 font-bold text-foreground",
    root: "h-15 w-32 justify-end rounded-[10px] bg-visual-green-3 px-6 py-px",
  },
  date: {
    primary:
      "font-latin text-right text-ui-12 font-bold text-primary-foreground",
    root: "h-20 w-73 justify-end rounded-[10px] bg-button-tertiary-frame/90 px-8 py-2",
  },
  tag: {
    primary: "font-ui text-center text-ui-13 font-normal text-foreground",
    rootInteractive:
      "cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    root: "h-32 min-w-45 items-center justify-center rounded-[8px] border border-black/30 bg-card px-16 py-6",
    rootSelected: "border-black/30 bg-[#A5FFE1]",
  },
} as const;

type StaticLabelProps = React.ComponentPropsWithoutRef<"span"> & {
  selected?: never;
  variant: "new" | "date";
};

type TagLabelProps = Omit<React.ComponentPropsWithoutRef<"button">, "type"> & {
  selected?: boolean;
  variant?: "tag";
  type?: "button" | "reset" | "submit";
};

export type LabelProps = StaticLabelProps | TagLabelProps;

export const Label = React.forwardRef<
  HTMLSpanElement | HTMLButtonElement,
  LabelProps
>((props, ref) => {
  const variant = props.variant ?? "tag";
  const variantClasses = labelVariantClasses[variant];

  if (variant === "tag") {
    const {
      children,
      className,
      selected = false,
      type = "button",
      ...buttonProps
    } = props as TagLabelProps;

    return (
      <button
        aria-pressed={selected}
        className={cn(
          labelBaseClassName,
          labelVariantClasses.tag.rootInteractive,
          variantClasses.root,
          selected && labelVariantClasses.tag.rootSelected,
          className,
        )}
        data-slot="label"
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={type}
        {...buttonProps}
      >
        <span className={variantClasses.primary}>{children}</span>
      </button>
    );
  }

  const { children, className, ...spanProps } = props as StaticLabelProps;

  return (
    <span
      className={cn(labelBaseClassName, variantClasses.root, className)}
      data-slot="label"
      ref={ref as React.ForwardedRef<HTMLSpanElement>}
      {...spanProps}
    >
      <span className={variantClasses.primary}>{children}</span>
    </span>
  );
});

Label.displayName = "Label";
