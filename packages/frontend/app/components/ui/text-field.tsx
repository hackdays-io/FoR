import * as React from "react";

import { cn } from "~/lib/utils";

const textFieldVariantClasses = {
  default: {
    input: "text-foreground placeholder:text-foreground/30",
    label: "text-foreground",
    message: "text-muted-foreground",
    root: "border-border bg-card hover:border-foreground/10 focus-within:border-foreground/10",
  },
  error: {
    input: "text-foreground placeholder:text-foreground/30",
    label: "text-foreground",
    message: "text-text-danger-default",
    root: "border-destructive bg-card hover:border-text-danger-strong focus-within:border-text-danger-strong",
  },
} as const;

const textFieldSizeClasses = {
  sm: {
    adornment: "size-16",
    input: "text-ui-13",
    label: "text-ui-13",
    message: "text-ui-10",
    root: "h-40 px-12 gap-8",
  },
  md: {
    adornment: "size-20",
    input: "text-ui-16",
    label: "text-ui-16",
    message: "text-ui-12",
    root: "h-48 px-16 gap-8",
  },
} as const;

type TextFieldVariant = keyof typeof textFieldVariantClasses;
type TextFieldSize = keyof typeof textFieldSizeClasses;

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  errorText?: React.ReactNode;
  helperText?: React.ReactNode;
  label?: React.ReactNode;
  leadingAdornment?: React.ReactNode;
  size?: TextFieldSize;
  trailingAdornment?: React.ReactNode;
  variant?: TextFieldVariant;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      disabled = false,
      errorText,
      helperText,
      id,
      label,
      leadingAdornment,
      readOnly = false,
      size = "md",
      trailingAdornment,
      type = "text",
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = errorText
      ? `${inputId}-error`
      : helperText
        ? `${inputId}-helper`
        : undefined;
    const resolvedVariant = errorText ? "error" : variant;
    const variantClasses = textFieldVariantClasses[resolvedVariant];
    const sizeClasses = textFieldSizeClasses[size];

    return (
      <div
        className={cn("flex w-full flex-col gap-8", className)}
        data-slot="text-field"
      >
        {label ? (
          <label
            className={cn(
              "font-medium",
              sizeClasses.label,
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
            "flex w-full items-center rounded-md border transition-colors",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
            variantClasses.root,
            sizeClasses.root,
            disabled && "border-border bg-muted text-muted-foreground",
            readOnly && !disabled && "bg-background text-muted-foreground",
          )}
        >
          {leadingAdornment ? (
            <div
              aria-hidden="true"
              className={cn(
                "flex shrink-0 items-center justify-center text-muted-foreground",
                sizeClasses.adornment,
                disabled && "text-foreground/30",
              )}
            >
              {leadingAdornment}
            </div>
          ) : null}
          <input
            aria-describedby={messageId}
            aria-invalid={errorText ? true : undefined}
            className={cn(
              "w-full min-w-0 border-0 bg-transparent font-ui outline-none",
              "selection:bg-primary selection:text-primary-foreground",
              "disabled:cursor-not-allowed disabled:text-muted-foreground",
              "read-only:cursor-default",
              sizeClasses.input,
              variantClasses.input,
            )}
            disabled={disabled}
            id={inputId}
            readOnly={readOnly}
            ref={ref}
            type={type}
            {...props}
          />
          {trailingAdornment ? (
            <div
              aria-hidden="true"
              className={cn(
                "flex shrink-0 items-center justify-center text-muted-foreground",
                sizeClasses.adornment,
                disabled && "text-foreground/30",
              )}
            >
              {trailingAdornment}
            </div>
          ) : null}
        </div>
        {errorText ? (
          <p
            className={cn(
              "font-medium",
              sizeClasses.message,
              variantClasses.message,
            )}
            id={messageId}
          >
            {errorText}
          </p>
        ) : helperText ? (
          <p
            className={cn(sizeClasses.message, variantClasses.message)}
            id={messageId}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
