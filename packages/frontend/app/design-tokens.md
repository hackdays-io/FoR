# FoR Token Operation Rules

Latest adjustment source: Figma screenshots shared on 2026-02-16.

## 1) Semantic Color source of truth

Use `--for-*` variables as the source layer and map them to shadcn-compatible
variables in `app.css`.

- Text: `--for-text-*`
- Background: `--for-bg-*`
- Stroke: `--for-stroke-*`
- Button: `--for-button-*`
- Visual Accent: `--for-visual-*`

Key values reflected from screenshots:

- Text Default/Subtle/Hint: `rgba(0,0,0,0.8/0.6/0.3)`, Invert: `#ffffff`
- Background Default/Subtle: `#ffffff` / `#f2f3f0`
- Stroke Default: `rgba(0,0,0,0.05)`
- Primary Button Frame: `#454545` (hover `#1a1a1a`, disabled `#b4b4b4`)
- Danger Base: `#eb3d3d` (hover/pressed `#8b1d1d`, disabled `#fbbdbf`)

## 2) Component reference rule

Components should consume only the shadcn/Tailwind theme layer:

- `bg-background`, `text-foreground`, `border-border`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-destructive`, `text-destructive-foreground`

Do not reference `--for-*` values directly inside component files.

## 3) Typography rule

- `font-ui`: Zen Kaku Gothic New + Roboto (UI default)
- `font-latin`: Roboto
- `text-ui-*`: line-height fixed to `130%`
- `text-content-*`: content-oriented styles (130% or 160% depending on group)

Supported UI sizes:

- `text-ui-10`, `text-ui-12`, `text-ui-13`, `text-ui-16`, `text-ui-20`

Supported content styles:

- Display: `text-content-display-l/m/s` (130%)
- Headline: `text-content-headline-l/m/s` (130%)
- Number: `text-content-number-l/m/s` (130%)
- Body: `text-content-body-l/m/s` (160%)
- Caption: `text-content-caption` (160%)

## 4) Spacing rule

`--spacing: 1px` is used, so spacing utilities are pixel based.

Allowed spacing values:

- `0`, `2`, `4`, `6`, `8`, `12`, `16`, `20`, `24`, `28`, `32`, `40`

Allowed examples:

- `p-16`, `px-24`, `py-12`, `gap-8`, `mt-40`

Disallowed examples:

- `p-[14px]`, `m-[3px]`, `gap-[22px]`

## 5) Icon policy

Use `lucide-react` as temporary placeholder icons until FoR icon assets are
finalized.
