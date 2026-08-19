import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Link, type To } from "react-router";

import logoBlack from "~/assets/images/logo/logo-black.png";
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
          "sticky top-0 z-10 flex h-56 w-full items-center bg-bg-default px-16 py-8",
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
        // タップ領域を 44px 確保しつつ、負マージンで矢印の見た目の位置は
        // 従来の 32px ボタンと揃える（判定がシビアな問題への対応）
        "-ml-6 inline-flex size-44 items-center justify-center rounded-md text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <ArrowLeft size={20} />
    </button>
  );
});
AppBarBackButton.displayName = "AppBarBackButton";

export type AppBarLogoProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** 指定するとロゴがタップ可能になり、その宛先へ遷移する（例: ホーム "/"） */
  to?: To;
};

/**
 * 戻るボタンを持たないヘッダーの左側に表示するロゴ。
 * `to` を指定するとタップで遷移するリンクになる。
 */
export const AppBarLogo = React.forwardRef<HTMLImageElement, AppBarLogoProps>(
  ({ className, alt = "FoR", to, ...props }, ref) => {
    const image = (
      <img
        ref={ref}
        src={logoBlack}
        alt={alt}
        className={cn("h-28 w-auto object-contain", className)}
        {...props}
      />
    );

    if (!to) return image;

    return (
      <Link
        to={to}
        aria-label="ホームへ"
        // タップ領域を確保しつつロゴの見た目の高さは維持する
        className="-my-8 inline-flex items-center py-8"
      >
        {image}
      </Link>
    );
  },
);
AppBarLogo.displayName = "AppBarLogo";

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
