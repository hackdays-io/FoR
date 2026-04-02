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
  default: "h-48 w-[320px] px-16",
  sm: "h-32 px-12 text-ui-10",
  lg: "h-48 px-20",
  icon: "size-48 p-0",
} as const;

type ButtonVariant = keyof typeof buttonVariantClasses;
type ButtonSize = keyof typeof buttonSizeClasses;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
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
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-8 whitespace-nowrap rounded-full border font-ui text-ui-16 font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
          buttonVariantClasses[variant],
          buttonSizeClasses[size],
          className,
        )}
        type={type}
        ref={ref}
        {...props}
      >
        {children}
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
      </button>
    );
  },
);
Button.displayName = "Button";

/* ------------------------------------------------------------------ */
/*  LinkedButton – リンク風のテキストボタン                              */
/* ------------------------------------------------------------------ */

const linkedButtonVariantClasses = {
  default: "text-button-primary-frame hover:text-button-primary-frame-hover",
  danger:
    "text-button-danger-text hover:text-button-danger-text-hover active:text-button-danger-text-pressed",
} as const;

type LinkedButtonVariant = keyof typeof linkedButtonVariantClasses;

export interface LinkedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LinkedButtonVariant;
}

export const LinkedButton = React.forwardRef<
  HTMLButtonElement,
  LinkedButtonProps
>(({ className, variant = "default", type = "button", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-4 text-ui-13 font-medium underline underline-offset-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
        linkedButtonVariantClasses[variant],
        className,
      )}
      type={type}
      ref={ref}
      {...props}
    />
  );
});
LinkedButton.displayName = "LinkedButton";
