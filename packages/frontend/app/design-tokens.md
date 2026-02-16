# FoR Token Operation Rules

## 1) Semantic Color source of truth

Use `--for-*` variables as the source layer and map them to shadcn-compatible
variables in `app.css`.

- Text: `--for-text-*`
- Background: `--for-bg-*`
- Stroke: `--for-stroke-*`
- Button: `--for-button-*`
- Visual Accent: `--for-accent-*`

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

Supported UI sizes:

- `text-ui-10`, `text-ui-12`, `text-ui-14`, `text-ui-16`, `text-ui-18`
- `text-ui-20`, `text-ui-24`, `text-ui-28`, `text-ui-32`

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
