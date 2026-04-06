import { Eye, LockKeyhole, Search, X } from "lucide-react";
import * as React from "react";

import "~/app.css";
import { TextField } from "~/components/ui/text-field";

export default {
  title: "Components/TextField",
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

function FocusPreviewField() {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <TextField
      ref={inputRef}
      helperText="初期表示でフォーカスされた状態です"
      label="フォーカス"
      placeholder="フォーカスリングを確認"
      trailingAdornment={<Search className="size-20" strokeWidth={1.75} />}
    />
  );
}

export const States = () => {
  return (
    <StoryFrame>
      <TextField
        helperText="サポートテキスト"
        label="タイトル"
        placeholder="プレイスホルダーテキスト"
        trailingAdornment={<X className="size-20" strokeWidth={1.75} />}
      />
      <TextField
        errorText="エラーテキスト"
        label="タイトル"
        placeholder="プレイスホルダーテキスト"
        trailingAdornment={<X className="size-20" strokeWidth={1.75} />}
        value="入力値"
        onChange={() => {}}
      />
      <TextField
        disabled
        helperText="サポートテキスト"
        label="タイトル"
        placeholder="プレイスホルダーテキスト"
        trailingAdornment={<X className="size-20" strokeWidth={1.75} />}
      />
    </StoryFrame>
  );
};

States.storyName = "Default / Error / Disabled";

export const HoverAndFocus = () => {
  return (
    <StoryFrame>
      <TextField
        helperText="カーソルを乗せてボーダー変化を確認"
        label="ホバー"
        placeholder="この入力欄にマウスオーバー"
        trailingAdornment={<Search className="size-20" strokeWidth={1.75} />}
      />
      <FocusPreviewField />
    </StoryFrame>
  );
};

HoverAndFocus.storyName = "Hover / Focus";

export const LongLabel = () => {
  return (
    <StoryFrame>
      <TextField
        helperText="複数行ラベルでも入力欄との関係が崩れないことを確認"
        label="コミュニティで利用する寄付先の名称を正式名称で入力してください"
        placeholder="寄付先名称"
      />
      <TextField
        errorText="入力内容が長すぎます。指定文字数内に収めてください。"
        label="イベント名と補足説明をあわせて表示したときの長文ラベル"
        placeholder="入力してください"
        value="非常に長い入力例"
        onChange={() => {}}
      />
    </StoryFrame>
  );
};

LongLabel.storyName = "Long Label";

export const PasswordAndReadOnly = () => {
  return (
    <StoryFrame>
      <TextField
        helperText="パスワード入力の例"
        label="パスワード"
        leadingAdornment={
          <LockKeyhole className="size-16" strokeWidth={1.75} />
        }
        placeholder="••••••••"
        trailingAdornment={<Eye className="size-20" strokeWidth={1.75} />}
        type="password"
      />
      <TextField
        helperText="値は選択できますが編集できません"
        label="読み取り専用"
        readOnly
        value="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      />
    </StoryFrame>
  );
};

PasswordAndReadOnly.storyName = "Password / ReadOnly";

export const Sizes = () => {
  return (
    <StoryFrame>
      <TextField
        helperText="sm size"
        label="コンパクト"
        placeholder="小さい入力欄"
        size="sm"
        trailingAdornment={<Search className="size-16" strokeWidth={1.75} />}
      />
      <TextField
        helperText="md size"
        label="標準"
        placeholder="標準サイズの入力欄"
        size="md"
        trailingAdornment={<Search className="size-20" strokeWidth={1.75} />}
      />
    </StoryFrame>
  );
};

Sizes.storyName = "Sizes";
