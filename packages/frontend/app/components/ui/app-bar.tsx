import { ArrowLeft } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

export interface AppBarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const AppBar = React.forwardRef<HTMLElement, AppBarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-10 flex h-48 w-full items-center bg-background px-16",
          className,
        )}
        {...props}
      >
        <div className="relative flex h-full w-full items-center">
          {children}
        </div>
      </header>
    );
  },
);
AppBar.displayName = "AppBar";

export interface AppBarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  position: "left" | "center" | "right";
}

export const AppBarItem = React.forwardRef<HTMLDivElement, AppBarItemProps>(
  ({ className, position, ...props }, ref) => {
    const positionClasses = {
      left: "absolute left-0 z-10 flex items-center",
      center: "flex w-full min-w-0 items-center justify-center px-40",
      right: "absolute right-0 z-10 flex items-center",
    } as const;

    return (
      <div
        ref={ref}
        className={cn(positionClasses[position], className)}
        {...props}
      />
    );
  },
);
AppBarItem.displayName = "AppBarItem";

export interface AppBarBackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label"?: string;
}

export const AppBarBackButton = React.forwardRef<
  HTMLButtonElement,
  AppBarBackButtonProps
>(({ className, "aria-label": ariaLabel = "戻る", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-32 items-center justify-center rounded-md text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <ArrowLeft size={20} />
    </button>
  );
});
AppBarBackButton.displayName = "AppBarBackButton";

export interface AppBarTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const AppBarTitle = React.forwardRef<
  HTMLHeadingElement,
  AppBarTitleProps
>(({ className, children, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn("truncate text-ui-16 font-bold text-foreground", className)}
      {...props}
    >
      {children}
    </h1>
  );
});
AppBarTitle.displayName = "AppBarTitle";
