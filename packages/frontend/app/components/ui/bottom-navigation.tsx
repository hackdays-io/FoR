import * as React from "react";
import { NavLink, type To } from "react-router";

import { cn } from "~/lib/utils";

export interface BottomNavigationProps
  extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const BottomNavigation = React.forwardRef<
  HTMLElement,
  BottomNavigationProps
>(({ className, children, ...props }, ref) => {
  return (
    <nav
      ref={ref}
      aria-label="メインナビゲーション"
      className={cn(
        "fixed bottom-0 left-0 z-20 flex w-full justify-center pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      {...props}
    >
      <div className="mb-12 flex items-center gap-4 rounded-full bg-primary px-8 py-8 shadow-elevation-1">
        {children}
      </div>
    </nav>
  );
});
BottomNavigation.displayName = "BottomNavigation";

export interface BottomNavigationItemProps {
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  to: To;
}

export const BottomNavigationItem = React.forwardRef<
  HTMLAnchorElement,
  BottomNavigationItemProps
>(
  (
    {
      "aria-label": ariaLabel,
      className,
      disabled = false,
      icon,
      label,
      to,
      ...props
    },
    ref,
  ) => {
    if (disabled) {
      return (
        <span
          aria-disabled="true"
          className={cn(
            "flex w-[72px] flex-col items-center gap-2 rounded-full px-8 py-6 text-primary-foreground opacity-40",
            className,
          )}
        >
          {icon}
          <span className="text-ui-10 font-medium">{label}</span>
        </span>
      );
    }

    return (
      <NavLink
        ref={ref}
        to={to}
        aria-label={ariaLabel}
        className={({ isActive }) =>
          cn(
            "flex w-[72px] flex-col items-center gap-2 rounded-full px-8 py-6 text-primary-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isActive && "bg-alpha-black-25",
            className,
          )
        }
        {...props}
      >
        {({ isActive }) => (
          <>
            {icon}
            <span
              aria-current={isActive ? "page" : undefined}
              className="text-ui-10 font-medium"
            >
              {label}
            </span>
          </>
        )}
      </NavLink>
    );
  },
);
BottomNavigationItem.displayName = "BottomNavigationItem";
