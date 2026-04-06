import type * as React from "react";

import "~/app.css";
import { Label } from "~/components/ui/label";

export default {
  title: "Components/Label",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[480px] flex-col gap-24">
        {children}
      </div>
    </div>
  );
}

export const Variants = () => {
  return (
    <StoryFrame>
      <div className="flex flex-col items-start gap-24">
        <div className="flex flex-wrap items-center gap-12">
          <Label variant="new">New</Label>
          <Label variant="date">10/29 (水)</Label>
        </div>
        <div className="flex flex-wrap items-center gap-12">
          <Label variant="tag">森</Label>
          <Label selected variant="tag">
            川
          </Label>
          <Label variant="tag">コミュニティ</Label>
        </div>
      </div>
    </StoryFrame>
  );
};

Variants.storyName = "New / Date / Tag";
