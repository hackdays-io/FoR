import { useState } from "react";
import { useNavigate } from "react-router";
import { type Address, isAddress } from "viem";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { ErrorMessage } from "~/components/ui/error-message";
import { TextField } from "~/components/ui/text-field";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import {
  useAddToAllowListByAdmin,
  useHasAdminRole,
  useIsAllowListed,
  useRemoveFromAllowListByAdmin,
} from "~/hooks/useAllowList";
import { getExplorerName, getExplorerTxUrl } from "~/lib/explorer";
import type { Route } from "./+types/admin.allowlist";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Allow List 管理 | FoR" }];
}

export default function AdminAllowList() {
  const navigate = useNavigate();
  const { address: caller } = useActiveWallet();
  const { data: isAdmin, isLoading: isAdminLoading } = useHasAdminRole(caller);

  const [input, setInput] = useState("");
  const trimmed = input.trim();
  const isValid = isAddress(trimmed);
  const target = (isValid ? (trimmed as Address) : null) ?? null;

  const { data: isListed, isLoading: isCheckingList } =
    useIsAllowListed(target);

  const addMutation = useAddToAllowListByAdmin();
  const removeMutation = useRemoveFromAllowListByAdmin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    addMutation.reset();
    removeMutation.reset();
  };

  const isAdding = addMutation.status === "pending";
  const isRemoving = removeMutation.status === "pending";
  const isBusy = isAdding || isRemoving;

  const handleAdd = async () => {
    if (!target) return;
    try {
      await addMutation.addToAllowList(target);
    } catch {
      // status/error はフックで管理
    }
  };

  const handleRemove = async () => {
    if (!target) return;
    try {
      await removeMutation.removeFromAllowList(target);
    } catch {
      // status/error はフックで管理
    }
  };

  const lastTxHash = addMutation.txHash ?? removeMutation.txHash;
  const lastError = addMutation.error ?? removeMutation.error;
  const lastSuccess =
    addMutation.status === "success" || removeMutation.status === "success";
  const explorerUrl = getExplorerTxUrl(lastTxHash);

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-bg-default">
        <AppBar>
          <AppBarItem position="left">
            <AppBarBackButton onClick={() => navigate(-1)} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>Allow List 管理</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="flex items-center justify-center py-32">
          <Typography variant="ui-13" className="text-text-hint">
            読み込み中...
          </Typography>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-bg-default">
        <AppBar>
          <AppBarItem position="left">
            <AppBarBackButton onClick={() => navigate(-1)} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>Allow List 管理</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="px-20 py-32">
          <Typography variant="body-m" className="text-text-default">
            このウォレットには管理者権限がありません。
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>Allow List 管理</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col gap-20 px-20 pt-20 pb-32">
        <TextField
          label="アドレス"
          placeholder="0x..."
          value={input}
          onChange={handleInputChange}
          autoComplete="off"
          spellCheck={false}
          errorText={
            input && !isValid ? "有効なアドレスを入力してください" : undefined
          }
          helperText={
            isValid
              ? isCheckingList
                ? "確認中..."
                : isListed
                  ? "現在: Allow List 登録済み"
                  : "現在: 未登録"
              : "Allow List に追加 / 削除するアドレス"
          }
          disabled={isBusy}
        />

        <div className="flex flex-col gap-12">
          <Button
            className="w-full"
            disabled={!isValid || isBusy || isListed === true}
            onClick={handleAdd}
          >
            {isAdding ? "送信中..." : "Allow List に追加"}
          </Button>
          <Button
            className="w-full"
            variant="destructive"
            disabled={!isValid || isBusy || isListed === false}
            onClick={handleRemove}
          >
            {isRemoving ? "送信中..." : "Allow List から削除"}
          </Button>
        </div>

        {lastError && <ErrorMessage error={lastError} />}

        {lastSuccess && (
          <Typography variant="ui-13" className="text-text-default">
            送信に成功しました。
            {explorerUrl && (
              <>
                {" "}
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {getExplorerName()} で確認
                </a>
              </>
            )}
          </Typography>
        )}
      </div>
    </div>
  );
}
