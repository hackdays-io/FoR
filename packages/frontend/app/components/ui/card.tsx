import * as React from "react";
import { Link, type To } from "react-router";

import promoCardBackground from "~/assets/images/cards/promo-card-background.jpg";
import walletCardBackground from "~/assets/images/cards/wallet-card-background.png";
import { Label } from "~/components/ui/label";
import { formatAmount } from "~/lib/format";
import { cn } from "~/lib/utils";

const CURRENCY_LABEL = "KUU";
const QR_CODE_IMAGE_ALT = "QRコード";
const BADGE_IMAGE_ALT = "バッジ";

const cardVariantConfig = {
  wallet: {
    amountTextClassName: "text-content-number-l text-foreground",
    bottomInnerClassName: "px-16",
    bottomSurfaceClassName: "bg-alpha-white-60",
    currencyTextClassName: "text-ui-20 text-foreground",
    defaultBackgroundImage: walletCardBackground,
    gridRowsClassName: "grid-rows-[7fr_3fr]",
    surfaceOverlayColor: undefined,
    surfaceClassName: "h-[214px] shadow-elevation-1",
  },
  promo: {
    bottomInnerClassName: "px-12",
    bottomSurfaceClassName: "bg-card",
    defaultBackgroundImage: promoCardBackground,
    // 上部 100px（背景画像 + New バッジ）/ 下部 残り 80px（白背景・タイトル + 価格）
    gridRowsClassName: "grid-rows-[100px_1fr]",
    surfaceOverlayColor: "var(--color-alpha-black-25)",
    surfaceClassName: "h-[180px]",
  },
} as const;

type CardVariant = keyof typeof cardVariantConfig;
type CardVariantConfig = (typeof cardVariantConfig)[CardVariant];

type WalletCardTopInput = {
  badgeImage?: string;
  qrCodeImage?: string;
};

type CardBaseProps = {
  amount: number | string;
  backgroundImage?: string;
  bottomClassName?: string;
  className?: string;
  topClassName?: string;
  to?: To;
};

type WalletCardProps = CardBaseProps & {
  isNew?: never;
  title?: never;
  topProps: WalletCardTopInput;
  variant: "wallet";
};

type PromoCardProps = CardBaseProps & {
  isNew?: boolean;
  title: string;
  variant: "promo";
};

type WalletCardTopProps = WalletCardTopInput & {
  className?: string;
};

type PromoCardTopProps = {
  className?: string;
  isNew?: boolean;
};

type CardBottomProps = {
  amount: number | string;
  className?: string;
  title?: string;
  variant: CardVariant;
  variantConfig: CardVariantConfig;
};

type CardSurfaceProps = {
  amount: number | string;
  backgroundImage?: string;
  bottomClassName?: string;
  className?: string;
  surfaceRef: React.ForwardedRef<HTMLDivElement>;
  title?: string;
  to?: To;
  topContent: React.ReactNode;
  variant: CardVariant;
  variantConfig: CardVariantConfig;
};

function WalletCardTop({
  badgeImage,
  className,
  qrCodeImage,
}: WalletCardTopProps) {
  return (
    <div className={cn("min-h-0 p-16", className)}>
      <div className="relative h-full w-full">
        {qrCodeImage && (
          <div className="absolute bottom-0 left-0 h-80 w-80 bg-card">
            <img
              alt={QR_CODE_IMAGE_ALT}
              className="h-full w-full object-contain"
              src={qrCodeImage}
            />
          </div>
        )}
        {badgeImage && (
          <img
            alt={BADGE_IMAGE_ALT}
            className="absolute right-0 top-0 h-48 w-48 bg-card object-contain"
            src={badgeImage}
          />
        )}
      </div>
    </div>
  );
}

// promo カードの上部: 背景画像の上に New バッジのみを表示する
function PromoCardTop({ className, isNew = false }: PromoCardTopProps) {
  return (
    <div className={cn("min-h-0 px-12 pt-12", className)}>
      {isNew && <Label variant="new">New</Label>}
    </div>
  );
}

function CardBottom({
  amount,
  className,
  title,
  variant,
  variantConfig,
}: CardBottomProps) {
  // promo カードの下部: 白背景にタイトル（2 行 ellipsis）と価格を縦並びで表示
  if (variant === "promo") {
    return (
      <div className={cn(variantConfig.bottomSurfaceClassName, className)}>
        <div
          className={cn(
            "flex h-full flex-col justify-center gap-4",
            variantConfig.bottomInnerClassName,
          )}
        >
          <p className="line-clamp-2 font-ui text-ui-14 font-bold text-foreground">
            {title}
          </p>
          <div className="flex items-end justify-end gap-4">
            <span
              className={cn(
                "font-latin font-bold text-ui-16"
              )}
            >
              {formatAmount(amount)}
            </span>
            <span
              className={cn(
                "font-latin font-bold text-ui-13"
              )}
            >
              {CURRENCY_LABEL}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(variantConfig.bottomSurfaceClassName, className)}>
      <div
        className={cn(
          "flex h-full items-center gap-16",
          variantConfig.bottomInnerClassName,
        )}
      >
        <span className="font-ui text-ui-16 font-bold text-foreground">
          残高
        </span>
        <div className="flex h-full min-w-0 flex-1 items-center justify-end">
          <div className="flex h-2/3 w-full items-stretch justify-end gap-4">
            <span
              className={cn(
                "flex h-full items-center font-latin font-bold text-ui-16",
              )}
            >
              {formatAmount(amount)}
            </span>
            <span
              className={cn(
                "flex h-full items-end font-latin font-bold text-ui-13",
              )}
            >
              {CURRENCY_LABEL}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type CardProps = WalletCardProps | PromoCardProps;

function renderCardTop(props: CardProps) {
  if (props.variant === "wallet") {
    return <WalletCardTop className={props.topClassName} {...props.topProps} />;
  }

  return <PromoCardTop className={props.topClassName} isNew={props.isNew} />;
}

function CardSurface({
  amount,
  backgroundImage,
  bottomClassName,
  className,
  surfaceRef,
  title,
  to,
  topContent,
  variant,
  variantConfig,
}: CardSurfaceProps) {
  const resolvedBackgroundImage =
    backgroundImage ?? variantConfig.defaultBackgroundImage;

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "w-full overflow-hidden rounded-lg bg-card bg-cover bg-center bg-no-repeat",
        to && "cursor-pointer",
        variantConfig.surfaceClassName,
        className,
      )}
      style={{
        backgroundColor: variantConfig.surfaceOverlayColor,
        backgroundBlendMode: "multiply",
        backgroundImage: `url(${resolvedBackgroundImage})`,
      }}
    >
      <div className={cn("grid h-full", variantConfig.gridRowsClassName)}>
        {topContent}
        <CardBottom
          amount={amount}
          className={bottomClassName}
          title={title}
          variant={variant}
          variantConfig={variantConfig}
        />
      </div>
    </div>
  );
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    const variantConfig = cardVariantConfig[props.variant];
    const cardContent = (
      <CardSurface
        amount={props.amount}
        backgroundImage={props.backgroundImage}
        bottomClassName={props.bottomClassName}
        className={props.className}
        surfaceRef={ref}
        title={props.variant === "promo" ? props.title : undefined}
        to={props.to}
        topContent={renderCardTop(props)}
        variant={props.variant}
        variantConfig={variantConfig}
      />
    );

    if (props.to) {
      return (
        <Link className="block" to={props.to}>
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  },
);
Card.displayName = "Card";
