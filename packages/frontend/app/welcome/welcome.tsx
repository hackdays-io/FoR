import { ArrowRight, Leaf, ShieldAlert, Wallet } from "lucide-react";

import promoCardBackground from "~/assets/images/cards/promo-card-background.jpg";
import walletCardBackground from "~/assets/images/cards/wallet-card-background.png";
import walletCardBadgePlaceholder from "~/assets/images/cards/wallet-card-badge-placeholder.svg";
import walletCardQrPlaceholder from "~/assets/images/cards/wallet-card-qr-placeholder.svg";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function Welcome() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-lg flex-col gap-32 px-24 py-32">
      <header className="flex flex-col gap-12">
        <p className="text-ui-12 font-medium text-muted-foreground">
          FoR Frontend Foundation
        </p>
        <h1 className="text-content-display-l font-semibold">
          Design Tokens mapped to shadcn/ui theme variables
        </h1>
        <p className="max-w-screen-md text-content-body-m text-muted-foreground">
          Semantic Color, Typography, and Spacing are centralized as tokens.
          Components consume the shadcn-compatible layer so global theme tuning
          can be done in one place.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-content-headline-l font-semibold">
          Card Theme Preview
        </h2>
        <p className="mt-8 text-content-body-s text-muted-foreground"></p>
        <div className="mt-16 flex flex-col gap-12">
          <Card
            variant="wallet"
            backgroundImage={walletCardBackground}
            amount={34393}
            topProps={{
              badgeImage: walletCardBadgePlaceholder,
              qrCodeImage: walletCardQrPlaceholder,
            }}
          ></Card>
          <div className="grid gap-16 grid-cols-2">
            <Card
              variant="promo"
              backgroundImage={promoCardBackground}
              amount={500}
              to="/promo-demo-1"
              topProps={{
                title: "森のお茶会",
              }}
            ></Card>
            <Card
              isNew
              variant="promo"
              backgroundImage={promoCardBackground}
              amount={500}
              to="/promo-demo-2"
              topProps={{
                title: "風のテラスでひらくコミュニティマーケット",
              }}
            ></Card>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-content-headline-l font-semibold">
          Button Theme Preview
        </h2>
        <p className="mt-8 text-content-body-s text-muted-foreground">
          Placeholder icons use lucide-react. Variants read only mapped theme
          tokens.
        </p>
        <div className="mt-16 flex flex-wrap items-center gap-12">
          <Button>
            <Wallet className="size-16" />
            Primary
          </Button>
          <Button variant="secondary">
            <Leaf className="size-16" />
            Secondary
          </Button>
          <Button variant="destructive">
            <ShieldAlert className="size-16" />
            Destructive
          </Button>
          <Button variant="ghost">
            <ArrowRight className="size-16" />
            Ghost
          </Button>
          <Button size="icon" aria-label="Arrow icon button">
            <ArrowRight className="size-16" />
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-content-headline-l font-semibold">
          Semantic Color Mapping
        </h2>
        <p className="mt-8 text-content-body-s text-muted-foreground">
          Reference rule: component styles use shadcn tokens such as{" "}
          <code>bg-background</code>, <code>text-foreground</code>, and{" "}
          <code>border-border</code>. Raw FoR variables remain source-only.
        </p>
        <div className="mt-16 grid gap-12 sm:grid-cols-2">
          <ColorChip
            label="Text / Primary -> foreground"
            swatchClass="bg-foreground"
          />
          <ColorChip
            label="Background / Canvas -> background"
            swatchClass="bg-background"
          />
          <ColorChip
            label="Background / Surface -> card"
            swatchClass="bg-card"
          />
          <ColorChip
            label="Stroke / Default -> border"
            swatchClass="bg-border"
          />
          <ColorChip
            label="Button / Primary -> primary"
            swatchClass="bg-primary"
          />
          <ColorChip
            label="Button / Secondary -> secondary"
            swatchClass="bg-secondary"
          />
          <ColorChip
            label="Text / Danger Default"
            swatchClass="bg-text-danger-default"
          />
          <ColorChip
            label="VisualAccent / Natural-3"
            swatchClass="bg-visual-natural-3"
          />
          <ColorChip
            label="VisualAccent / Green-3"
            swatchClass="bg-visual-green-3"
          />
          <ColorChip
            label="VisualAccent / Red-3"
            swatchClass="bg-visual-red-3"
          />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-content-headline-l font-semibold">
          Typography Utilities
        </h2>
        <p className="mt-8 text-content-body-s text-muted-foreground">
          <code>font-ui</code> uses Zen Kaku Gothic New + Roboto, and every{" "}
          <code>text-ui-*</code> token enforces line-height 130%. Content styles
          are exposed as <code>text-content-*</code>.
        </p>
        <div className="mt-16 flex flex-col gap-8">
          {uiTypographyRows.map(({ className, label }) => (
            <p key={label} className={cn("font-ui text-foreground", className)}>
              {label} / line-height 130%
            </p>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-8">
          {contentTypographyRows.map(({ className, label }) => (
            <p key={label} className={cn("font-ui text-foreground", className)}>
              {label}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-content-headline-l font-semibold">
          Spacing Scale Rule
        </h2>
        <p className="mt-8 text-content-body-s text-muted-foreground">
          Allowed spacing values are 0, 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, and
          40px. Avoid arbitrary spacing classes such as <code>p-[14px]</code>.
        </p>
        <div className="mt-16 flex flex-wrap items-end gap-12">
          {spacingScale.map((space) => (
            <div key={space} className="flex flex-col items-center gap-4">
              <div
                className="w-16 rounded-sm bg-primary/80"
                style={{ height: `${Math.max(space, 2)}px` }}
              />
              <span className="text-ui-10 text-muted-foreground">
                {space}px
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ColorChip({
  label,
  swatchClass,
}: {
  label: string;
  swatchClass: string;
}) {
  return (
    <div className="flex items-center gap-8 rounded-md border bg-background p-12">
      <span
        className={cn("size-20 rounded-sm border border-border", swatchClass)}
      />
      <span className="text-ui-12 text-muted-foreground">{label}</span>
    </div>
  );
}

const uiTypographyRows = [
  { className: "text-ui-10", label: "UI 10" },
  { className: "text-ui-12", label: "UI 12" },
  { className: "text-ui-13", label: "UI 13" },
  { className: "text-ui-16", label: "UI 16" },
  { className: "text-ui-20", label: "UI 20" },
];

const contentTypographyRows = [
  {
    className: "text-content-display-l",
    label: "Display/L 28px 130%",
  },
  {
    className: "text-content-display-m",
    label: "Display/M 24px 130%",
  },
  {
    className: "text-content-display-s",
    label: "Display/S 20px 130%",
  },
  {
    className: "text-content-headline-l",
    label: "Headline/L 20px 130%",
  },
  {
    className: "text-content-headline-m",
    label: "Headline/M 17px 130%",
  },
  {
    className: "text-content-body-l",
    label: "Body/L 15px 160%",
  },
  {
    className: "text-content-body-m",
    label: "Body/M 14px 160%",
  },
  {
    className: "text-content-body-s",
    label: "Body/S 13px 160%",
  },
  {
    className: "text-content-caption",
    label: "Caption 12px 160%",
  },
];

const spacingScale = [0, 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 40];
