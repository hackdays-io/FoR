import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariantClasses = {
  default:
    "border-transparent bg-button-primary-frame text-button-primary-text hover:bg-button-primary-frame-hover active:bg-button-primary-frame-hover disabled:bg-button-primary-frame-disabled disabled:text-button-primary-text-disabled",
  secondary:
    "border-button-secondary-stroke bg-button-secondary-frame text-button-secondary-text hover:border-button-secondary-stroke-hover hover:bg-button-secondary-frame-hover hover:text-button-secondary-text-hover active:border-button-secondary-stroke-hover active:bg-button-secondary-frame-hover active:text-button-secondary-text-hover disabled:border-button-secondary-stroke-disabled disabled:bg-button-secondary-frame-disabled disabled:text-button-secondary-text-disabled",
  ghost:
    "border-transparent bg-button-tertiary-frame text-button-tertiary-text hover:bg-button-tertiary-frame-hover hover:text-button-tertiary-text-hover active:bg-button-tertiary-frame-hover active:text-button-tertiary-text-hover disabled:bg-button-tertiary-frame-disabled disabled:text-button-tertiary-text-disabled",
  destructive:
    "border-transparent bg-button-danger-frame text-button-danger-text-invert hover:bg-button-danger-frame-hover active:bg-button-danger-frame-pressed disabled:bg-button-danger-frame-disabled disabled:text-button-danger-text-disabled",
} as const;

const buttonSizeClasses = {
  default: "h-40 px-16",
  sm: "h-32 px-12 text-ui-10",
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
          "inline-flex shrink-0 items-center justify-center gap-8 whitespace-nowrap rounded-md border text-ui-13 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
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
