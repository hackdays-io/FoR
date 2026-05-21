import type * as React from "react";

import "~/app.css";
import { ErrorMessage } from "~/components/ui/error-message";

export default {
  title: "Components/ErrorMessage",
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

// viem のコントラクト実行エラーを模した複数行メッセージ
const viemError = new Error(
  [
    'The contract function "addToAllowListWithSignature" reverted with the following reason:',
    "AllowList: signature expired",
    "",
    "Contract Call:",
    "  address:   0x1234567890abcdef1234567890abcdef12345678",
    "  function:  addToAllowListWithSignature(address account, uint256 deadline, bytes signature)",
    "",
    "Version: viem@2.21.0",
  ].join("\n"),
);

export const Default = () => (
  <StoryFrame>
    <ErrorMessage error={viemError} />
  </StoryFrame>
);

export const WithCustomTitle = () => (
  <StoryFrame>
    <ErrorMessage error={viemError} title="送金に失敗しました" />
  </StoryFrame>
);

WithCustomTitle.storyName = "Custom title";

export const ShortError = () => (
  <StoryFrame>
    <ErrorMessage error={new Error("Wallet not connected")} />
  </StoryFrame>
);

ShortError.storyName = "Short error";

export const StringError = () => (
  <StoryFrame>
    <ErrorMessage error="Failed to fetch allowlist signature" />
  </StoryFrame>
);

StringError.storyName = "String error";
