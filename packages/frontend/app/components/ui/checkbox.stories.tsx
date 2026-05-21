import * as React from "react";

import "~/app.css";
import { Checkbox } from "~/components/ui/checkbox";

export default {
  title: "Components/Checkbox",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[480px] flex-col gap-12">
        {children}
      </div>
    </div>
  );
}

export const States = () => (
  <StoryFrame>
    <Checkbox label="未選択" />
    <Checkbox label="選択済み" defaultChecked />
    <Checkbox label="無効" disabled />
    <Checkbox label="無効（選択済み）" disabled defaultChecked />
  </StoryFrame>
);
States.storyName = "States";

export const WithoutLabel = () => (
  <StoryFrame>
    <Checkbox aria-label="ラベルなし" />
  </StoryFrame>
);
WithoutLabel.storyName = "Without Label";

function ControlledPreview() {
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="flex flex-col gap-8">
      <Checkbox
        label="利用規約に同意する"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
      <p className="text-ui-12 text-muted-foreground">
        Current: {String(checked)}
      </p>
    </div>
  );
}

export const Controlled = () => (
  <StoryFrame>
    <ControlledPreview />
  </StoryFrame>
);
Controlled.storyName = "Controlled";
