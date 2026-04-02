import type * as React from "react";

import "~/app.css";
import { ListRow } from "~/components/ui/list-row";

export default {
  title: "Components/ListRow",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto flex max-w-[480px] flex-col">{children}</div>
    </div>
  );
}

const SAMPLE_AVATAR =
  "https://api.dicebear.com/9.x/shapes/svg?seed=ryoma&backgroundColor=0e7490";

export const Default = () => {
  return (
    <StoryFrame>
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="りょうま"
        message="草刈りありがとう！"
        date="10/29 (水)"
        amount={50}
      />
    </StoryFrame>
  );
};

Default.storyName = "Default / Positive Amount";

export const NegativeAmount = () => {
  return (
    <StoryFrame>
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="りょうま"
        message="草刈りありがとう！"
        date="10/29 (水)"
        amount={-50}
      />
    </StoryFrame>
  );
};

NegativeAmount.storyName = "Negative Amount";

export const WithoutDivider = () => {
  return (
    <StoryFrame>
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="りょうま"
        message="草刈りありがとう！"
        date="10/29 (水)"
        amount={50}
        divider={false}
      />
    </StoryFrame>
  );
};

WithoutDivider.storyName = "Without Divider";

export const LongText = () => {
  return (
    <StoryFrame>
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="とても長い名前のユーザーさんですがちゃんと省略されますか"
        message="これはとても長いメッセージです。草刈りの他にも色々お手伝いしてくれてありがとうございました！"
        date="10/29 (水)"
        amount={1500}
      />
    </StoryFrame>
  );
};

LongText.storyName = "Long Text";

export const List = () => {
  return (
    <StoryFrame>
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="りょうま"
        message="草刈りありがとう！"
        date="10/29 (水)"
        amount={50}
      />
      <ListRow
        avatarSrc={SAMPLE_AVATAR}
        name="りょうま"
        message="草刈りありがとう！"
        date="10/29 (水)"
        amount={-50}
      />
      <ListRow
        avatarSrc="https://api.dicebear.com/9.x/shapes/svg?seed=taro&backgroundColor=059669"
        name="たろう"
        message="お祭りの準備手伝い"
        date="10/28 (火)"
        amount={100}
      />
      <ListRow
        name="名前のみ"
        message="アバターなし"
        date="10/27 (月)"
        amount={-30}
        divider={false}
      />
    </StoryFrame>
  );
};

List.storyName = "List View";
