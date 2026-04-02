import type * as React from "react";
import { ExternalLink } from "lucide-react";

import "~/app.css";
import { Button, LinkedButton } from "~/components/ui/button";

export default {
  title: "Components/Buttons",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[512px] flex-col gap-24">
        {children}
      </div>
    </div>
  );
}

type VariantRowProps = {
  label: string;
  children: React.ReactNode;
};

function VariantRow({ label, children }: VariantRowProps) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-ui-12 text-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-12">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RoundedButton Stories                                              */
/* ------------------------------------------------------------------ */

export const Primary = () => (
  <StoryFrame>
    <VariantRow label="Primary">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </VariantRow>
  </StoryFrame>
);
Primary.storyName = "Rounded / Primary";

export const Secondary = () => (
  <StoryFrame>
    <VariantRow label="Secondary">
      <Button variant="secondary">Default</Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </VariantRow>
  </StoryFrame>
);
Secondary.storyName = "Rounded / Secondary";

export const Tertiary = () => (
  <StoryFrame>
    <VariantRow label="Tertiary">
      <Button variant="ghost">Default</Button>
      <Button variant="ghost" disabled>
        Disabled
      </Button>
    </VariantRow>
  </StoryFrame>
);
Tertiary.storyName = "Rounded / Tertiary";

export const Danger = () => (
  <StoryFrame>
    <VariantRow label="Danger">
      <Button variant="destructive">Default</Button>
      <Button variant="destructive" disabled>
        Disabled
      </Button>
    </VariantRow>
  </StoryFrame>
);
Danger.storyName = "Rounded / Danger";

export const AllVariants = () => (
  <StoryFrame>
    <VariantRow label="Primary">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </VariantRow>
    <VariantRow label="Secondary">
      <Button variant="secondary">Default</Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </VariantRow>
    <VariantRow label="Tertiary">
      <Button variant="ghost">Default</Button>
      <Button variant="ghost" disabled>
        Disabled
      </Button>
    </VariantRow>
    <VariantRow label="Danger">
      <Button variant="destructive">Default</Button>
      <Button variant="destructive" disabled>
        Disabled
      </Button>
    </VariantRow>
  </StoryFrame>
);
AllVariants.storyName = "Rounded / All Variants";

export const WithIcon = () => (
  <StoryFrame>
    <VariantRow label="Primary + Icon">
      <Button icon={<ExternalLink size={18} />}>ボタンサンプル</Button>
    </VariantRow>
    <VariantRow label="Secondary + Icon">
      <Button variant="secondary" icon={<ExternalLink size={18} />}>
        ボタンサンプル
      </Button>
    </VariantRow>
  </StoryFrame>
);
WithIcon.storyName = "Rounded / With Icon";

export const Sizes = () => (
  <StoryFrame>
    <VariantRow label="Small">
      <Button size="sm">Small</Button>
    </VariantRow>
    <VariantRow label="Default">
      <Button size="default">Default</Button>
    </VariantRow>
    <VariantRow label="Large">
      <Button size="lg">Large</Button>
    </VariantRow>
  </StoryFrame>
);
Sizes.storyName = "Rounded / Sizes";

/* ------------------------------------------------------------------ */
/*  LinkedButton Stories                                               */
/* ------------------------------------------------------------------ */

export const LinkedDefault = () => (
  <StoryFrame>
    <VariantRow label="Default">
      <LinkedButton>リンクボタン</LinkedButton>
      <LinkedButton disabled>Disabled</LinkedButton>
    </VariantRow>
  </StoryFrame>
);
LinkedDefault.storyName = "Linked / Default";

export const LinkedDanger = () => (
  <StoryFrame>
    <VariantRow label="Danger">
      <LinkedButton variant="danger">削除する</LinkedButton>
      <LinkedButton variant="danger" disabled>
        Disabled
      </LinkedButton>
    </VariantRow>
  </StoryFrame>
);
LinkedDanger.storyName = "Linked / Danger";

export const LinkedWithIcon = () => (
  <StoryFrame>
    <VariantRow label="With External Icon">
      <LinkedButton>
        外部リンク
        <ExternalLink size={14} />
      </LinkedButton>
    </VariantRow>
  </StoryFrame>
);
LinkedWithIcon.storyName = "Linked / With Icon";
