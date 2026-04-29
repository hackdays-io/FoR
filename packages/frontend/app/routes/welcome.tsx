import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import type { Address } from "viem";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useAddToAllowList, useIsAllowListed } from "~/hooks/useAllowList";
import type { Route } from "./+types/welcome";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "はじめに | FoR" }];
}

async function hasProfile(address: Address): Promise<boolean> {
  try {
    const res = await fetch(`/api/profile/${address}`);
    console.log("[FoR/welcome] hasProfile fetch", {
      address,
      ok: res.ok,
      status: res.status,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { profile: unknown | null };
    console.log("[FoR/welcome] hasProfile data", {
      address,
      hasProfile: !!data.profile,
    });
    return !!data.profile;
  } catch (err) {
    console.error("[FoR/welcome] hasProfile error", err);
    return false;
  }
}

export default function Welcome() {
  const navigate = useNavigate();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: isListed, isLoading: isCheckingList } =
    useIsAllowListed(address);
  const { addToAllowList, status, error } = useAddToAllowList();

  const goNext = useCallback(
    async (account: Address) => {
      const exists = await hasProfile(account);
      const dest = exists ? "/" : "/profile/create";
      console.log("[FoR/welcome] goNext navigate", { account, dest });
      navigate(dest, { replace: true });
    },
    [navigate],
  );

  // 既に allowlist 済み（別経路で登録済みなど）の場合も profile 有無で遷移先を振り分ける
  useEffect(() => {
    console.log("[FoR/welcome] isListed effect", { isListed, address });
    if (isListed !== true || !address) return;
    void goNext(address);
  }, [isListed, address, goNext]);

  const handleAccept = async () => {
    if (!address) return;
    try {
      console.log("[FoR/welcome] handleAccept start");
      await addToAllowList();
      console.log("[FoR/welcome] addToAllowList done");
      await goNext(address);
    } catch (err) {
      console.error("[FoR/welcome] handleAccept failed", err);
    }
  };

  const isSubmitting = status === "signing" || status === "pending";
  const buttonLabel = isSubmitting ? "読み込み中..." : "利用を開始する";

  const showLoading = isWalletLoading || isCheckingList;

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>はじめに</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="px-20 pt-20 pb-[140px]">
        <Typography variant="body-m" className="text-text-default">
          kuu walletの利用を開始する
        </Typography>
      </div>

      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        {error && (
          <Typography
            variant="ui-13"
            className="mb-8 text-center text-destructive"
          >
            {error.message}
          </Typography>
        )}

        <Button
          className="w-full"
          disabled={isSubmitting || showLoading || !address}
          onClick={handleAccept}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
