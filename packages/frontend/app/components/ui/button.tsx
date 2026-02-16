import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariantClasses = {
  default:
    "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
} as const;

const buttonSizeClasses = {
  default: "h-40 px-16",
  sm: "h-32 px-12 text-ui-12",
  lg: "h-40 px-20 text-ui-16",
  icon: "size-40 p-0",
} as const;

type ButtonVariant = keyof typeof buttonVariantClasses;
type ButtonSize = keyof typeof buttonSizeClasses;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-8 whitespace-nowrap rounded-md border text-ui-14 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-transparent disabled:bg-button-disabled-bg disabled:text-button-disabled-fg",
          buttonVariantClasses[variant],
          buttonSizeClasses[size],
          className,
        )}
        type={type}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
