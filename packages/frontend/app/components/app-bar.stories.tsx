import { Share } from "lucide-react";
import type * as React from "react";

import "~/app.css";
import {
  AppBar,
  AppBarAvatar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";

export default {
  title: "Components/AppBar",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[512px]">{children}</div>
    </div>
  );
}

export const WithAvatar = () => {
  return (
    <StoryFrame>
      <AppBar>
        <AppBarItem position="left">
          <AppBarAvatar
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='32' fill='%23E5E7EB'/%3E%3Ccircle cx='32' cy='26' r='10' fill='%239CA3AF'/%3E%3Cpath d='M16 50c2.667-8 8-12 16-12s13.333 4 16 12' fill='%239CA3AF'/%3E%3C/svg%3E"
            alt="ユーザーアバター"
          />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>ニックネーム</AppBarTitle>
        </AppBarItem>
      </AppBar>
    </StoryFrame>
  );
};

WithAvatar.storyName = "Avatar + Title";

export const WithBackButton = () => {
  return (
    <StoryFrame>
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => console.log("back")} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール入力</AppBarTitle>
        </AppBarItem>
      </AppBar>
    </StoryFrame>
  );
};

WithBackButton.storyName = "Back + Title";

export const WithBackAndAction = () => {
  return (
    <StoryFrame>
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => console.log("back")} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール入力</AppBarTitle>
        </AppBarItem>
        <AppBarItem position="right">
          <button
            type="button"
            aria-label="共有"
            className="inline-flex size-32 items-center justify-center rounded-md text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share size={20} />
          </button>
        </AppBarItem>
      </AppBar>
    </StoryFrame>
  );
};

WithBackAndAction.storyName = "Back + Title + Action";

export const LongTitle = () => {
  return (
    <StoryFrame>
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => console.log("back")} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>
            テキストが入り切らない場合それ以降の文字を省略すること確認用の長いタイトルテキストです
          </AppBarTitle>
        </AppBarItem>
        <AppBarItem position="right">
          <button
            type="button"
            aria-label="共有"
            className="inline-flex size-32 items-center justify-center rounded-md text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share size={20} />
          </button>
        </AppBarItem>
      </AppBar>
    </StoryFrame>
  );
};

LongTitle.storyName = "Long Title (Truncated)";
