import { ArrowRight, Leaf, ShieldAlert, Wallet } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function Welcome() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-screen-lg flex-col gap-32 px-24 py-32">
      <header className="flex flex-col gap-12">
        <p className="text-ui-12 font-medium text-muted-foreground">
          FoR Frontend Foundation
        </p>
        <h1 className="text-ui-32 font-semibold">
          Design Tokens mapped to shadcn/ui theme variables
        </h1>
        <p className="max-w-screen-md text-ui-16 text-muted-foreground">
          Semantic Color, Typography, and Spacing are centralized as tokens.
          Components consume the shadcn-compatible layer so global theme tuning
          can be done in one place.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-ui-20 font-semibold">Button Theme Preview</h2>
        <p className="mt-8 text-ui-14 text-muted-foreground">
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
        <h2 className="text-ui-20 font-semibold">Semantic Color Mapping</h2>
        <p className="mt-8 text-ui-14 text-muted-foreground">
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
            label="VisualAccent / Brand"
            swatchClass="bg-accent-brand"
          />
          <ColorChip
            label="VisualAccent / Success"
            swatchClass="bg-accent-success"
          />
          <ColorChip
            label="VisualAccent / Warning"
            swatchClass="bg-accent-warning"
          />
          <ColorChip
            label="VisualAccent / Danger"
            swatchClass="bg-accent-danger"
          />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-ui-20 font-semibold">Typography Utilities</h2>
        <p className="mt-8 text-ui-14 text-muted-foreground">
          <code>font-ui</code> uses Zen Kaku Gothic New + Roboto, and every{" "}
          <code>text-ui-*</code> token enforces line-height 130%.
        </p>
        <div className="mt-16 flex flex-col gap-8">
          {typographyRows.map(({ className, label }) => (
            <p key={label} className={cn("font-ui text-foreground", className)}>
              {label} / line-height 130%
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-24">
        <h2 className="text-ui-20 font-semibold">Spacing Scale Rule</h2>
        <p className="mt-8 text-ui-14 text-muted-foreground">
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

const typographyRows = [
  { className: "text-ui-10", label: "UI 10" },
  { className: "text-ui-12", label: "UI 12" },
  { className: "text-ui-14", label: "UI 14" },
  { className: "text-ui-16", label: "UI 16" },
  { className: "text-ui-18", label: "UI 18" },
  { className: "text-ui-20", label: "UI 20" },
  { className: "text-ui-24", label: "UI 24" },
  { className: "text-ui-28", label: "UI 28" },
  { className: "text-ui-32", label: "UI 32" },
];

const spacingScale = [0, 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 40];
