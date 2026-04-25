import { AlertTriangle } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { useChainMismatch } from "~/hooks/useChainMismatch";

export function ChainMismatchBanner() {
  const {
    isMismatched,
    walletChainId,
    expectedChainName,
    isSwitching,
    switchError,
    switchToExpected,
  } = useChainMismatch();

  if (!isMismatched) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-8 border-b border-text-danger-default bg-button-danger-frame px-16 py-12 text-button-danger-text-invert"
    >
      <div className="flex items-start gap-8">
        <AlertTriangle size={20} className="mt-2 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-4">
          <Typography variant="ui-13" weight="bold">
            ネットワークが {expectedChainName} ではありません
          </Typography>
          <Typography variant="ui-13">
            {walletChainId
              ? `現在のチェーンID: ${walletChainId}`
              : "ウォレットのチェーンを確認してください"}
            。送金前にネットワークを切り替えてください。
          </Typography>
          {switchError ? (
            <Typography variant="ui-13" weight="bold">
              切替に失敗: {switchError}
            </Typography>
          ) : null}
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={isSwitching}
        onClick={() => {
          void switchToExpected();
        }}
        className="self-end"
      >
        {isSwitching ? "切替中..." : `${expectedChainName} に切り替える`}
      </Button>
    </div>
  );
}
