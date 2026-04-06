import * as React from "react";

import { cn } from "~/lib/utils";

const typographyVariantClasses = {
  // UI
  "ui-20": "font-ui text-ui-20",
  "ui-16": "font-ui text-ui-16",
  "ui-13": "font-ui text-ui-13",
  "ui-12": "font-ui text-ui-12",
  "ui-10": "font-ui text-ui-10",
  // Display
  "display-l": "font-ui text-content-display-l font-bold",
  "display-m": "font-ui text-content-display-m font-bold",
  "display-s": "font-ui text-content-display-s font-bold",
  // Headline
  "headline-l": "font-ui text-content-headline-l font-bold",
  "headline-m": "font-ui text-content-headline-m font-bold",
  "headline-s": "font-ui text-content-headline-s font-bold",
  // Number
  "number-l": "font-latin text-content-number-l font-bold",
  "number-m": "font-latin text-content-number-m font-bold",
  "number-s": "font-latin text-content-number-s font-bold",
  // Body
  "body-l": "font-ui text-content-body-l",
  "body-m": "font-ui text-content-body-m",
  "body-s": "font-ui text-content-body-s",
  // Caption
  caption: "font-ui text-content-caption",
} as const;

type TypographyVariant = keyof typeof typographyVariantClasses;

type TypographyWeight = "normal" | "bold";

const weightClasses: Record<TypographyWeight, string> = {
  normal: "font-normal",
  bold: "font-bold",
};

// Variants that only support bold
const boldOnlyVariants = new Set<TypographyVariant>([
  "display-l",
  "display-m",
  "display-s",
  "headline-l",
  "headline-m",
  "headline-s",
  "number-l",
  "number-m",
  "number-s",
]);

const defaultElementMap: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  "ui-20": "span",
  "ui-16": "span",
  "ui-13": "span",
  "ui-12": "span",
  "ui-10": "span",
  "display-l": "h1",
  "display-m": "h2",
  "display-s": "h3",
  "headline-l": "h2",
  "headline-m": "h3",
  "headline-s": "h4",
  "number-l": "span",
  "number-m": "span",
  "number-s": "span",
  "body-l": "p",
  "body-m": "p",
  "body-s": "p",
  caption: "p",
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant: TypographyVariant;
  weight?: TypographyWeight;
  as?: keyof React.JSX.IntrinsicElements;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ variant, weight, as, className, ...props }, ref) => {
    const Element = (as ?? defaultElementMap[variant]) as React.ElementType;

    const resolvedWeight = boldOnlyVariants.has(variant)
      ? undefined // already bold in variant class
      : weight
        ? weightClasses[weight]
        : undefined;

    return (
      <Element
        ref={ref}
        className={cn(
          typographyVariantClasses[variant],
          resolvedWeight,
          "text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);

Typography.displayName = "Typography";
