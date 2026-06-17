import * as React from "react";

import "~/app.css";
import { TextArea } from "~/components/ui/text-area";

export default {
  title: "Components/TextArea",
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

function AutoGrowField() {
  const [value, setValue] = React.useState("");
  return (
    <TextArea
      helperText="入力に合わせて高さが自動拡張されます"
      label="自己紹介"
      placeholder="自己紹介を入力"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

export const States = () => {
  return (
    <StoryFrame>
      <TextArea
        helperText="サポートテキスト"
        label="自己紹介"
        placeholder="自己紹介を入力"
      />
      <TextArea
        errorText="200文字以内にしてください"
        label="自己紹介"
        placeholder="自己紹介を入力"
        value={"入力値\n複数行も折り返しと高さ拡張に対応します"}
        onChange={() => {}}
      />
      <TextArea
        disabled
        helperText="サポートテキスト"
        label="自己紹介"
        placeholder="自己紹介を入力"
      />
    </StoryFrame>
  );
};

States.storyName = "Default / Error / Disabled";

export const AutoGrow = () => {
  return (
    <StoryFrame>
      <AutoGrowField />
    </StoryFrame>
  );
};

AutoGrow.storyName = "Auto Grow";
