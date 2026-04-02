import type * as React from "react";

import "~/app.css";
import { SectionTitle } from "~/components/ui/section-title";

export default {
  title: "Components/SectionTitle",
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
      <div className="flex flex-col gap-24">
        <SectionTitle variant="large">タイトル (Large)</SectionTitle>
        <SectionTitle variant="small">タイトル (Small)</SectionTitle>
        <SectionTitle
          moreLabel="もっとみる"
          onMoreClick={() => alert("もっとみる clicked")}
          variant="large"
        >
          タイトル (Large)
        </SectionTitle>
        <SectionTitle
          moreLabel="もっとみる"
          onMoreClick={() => alert("もっとみる clicked")}
          variant="small"
        >
          タイトル (Small)
        </SectionTitle>
        <SectionTitle
          moreLabel="もっとみる"
          onMoreClick={() => alert("もっとみる clicked")}
          variant="large"
        >
          とても長いタイトルがここに入りますがクランプされます
        </SectionTitle>
      </div>
    </StoryFrame>
  );
};

Variants.storyName = "Large / Small / With More";
