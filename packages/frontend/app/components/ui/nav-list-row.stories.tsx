import type * as React from "react";

import "~/app.css";
import { NavListRow } from "~/components/ui/nav-list-row";
import { SectionTitle } from "~/components/ui/section-title";

export default {
  title: "Components/NavListRow",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen p-24">
      <div className="mx-auto flex max-w-[480px] flex-col">{children}</div>
    </div>
  );
}

export const Internal = () => (
  <StoryFrame>
    <NavListRow label="言語設定" to="/settings/language" />
  </StoryFrame>
);

Internal.storyName = "Internal Link";

export const External = () => (
  <StoryFrame>
    <NavListRow label="コミュニティ" href="https://example.com" />
  </StoryFrame>
);

External.storyName = "External Link";

export const ButtonRow = () => (
  <StoryFrame>
    <NavListRow label="ログアウト" onClick={() => {}} />
  </StoryFrame>
);

ButtonRow.storyName = "Button";

export const Sections = () => (
  <StoryFrame>
    <SectionTitle>設定</SectionTitle>
    <NavListRow label="言語設定" to="/settings/language" />

    <SectionTitle className="mt-16">その他</SectionTitle>
    <NavListRow label="プライバシーポリシー" to="/privacy" />
    <NavListRow label="利用規約" to="/terms" />
    <NavListRow label="コミュニティ" href="https://example.com" />
    <NavListRow label="お問い合わせ" href="https://example.com/contact" />
  </StoryFrame>
);

Sections.storyName = "Settings Sections";
