import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
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
import termsContent from "~/content/terms.md?raw";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useAddToAllowList, useIsAllowListed } from "~/hooks/useAllowList";
import type { Route } from "./+types/welcome";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "はじめに | FoR" }];
}

async function hasProfile(address: Address): Promise<boolean> {
  try {
    const res = await fetch(`/api/profile/${address}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { profile: unknown | null };
    return !!data.profile;
  } catch {
    return false;
  }
}

export default function Welcome() {
  const navigate = useNavigate();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: isListed, isLoading: isCheckingList, refetch } =
    useIsAllowListed(address);
  const { addToAllowList, status, error } = useAddToAllowList();

  const [agreed, setAgreed] = useState(false);

  const goNext = useCallback(
    async (account: Address) => {
      const exists = await hasProfile(account);
      navigate(exists ? "/" : "/profile/create", { replace: true });
    },
    [navigate],
  );

  // 既に allowlist 済み（別経路で登録済みなど）の場合も profile 有無で遷移先を振り分ける
  useEffect(() => {
    if (isListed !== true || !address) return;
    void goNext(address);
  }, [isListed, address, goNext]);

  const handleAccept = async () => {
    if (!address) return;
    try {
      await addToAllowList();
      await refetch();
      await goNext(address);
    } catch {
      // error は hook の error に保持
    }
  };

  const isSubmitting = status === "signing" || status === "pending";
  const buttonLabel = isSubmitting ? "読み込み中..." : "同意して使い始める";

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
        <Typography variant="ui-13" className="mb-16 text-text-default">
          ご利用には以下の利用規約への同意が必要です。
        </Typography>

        <div className="rounded-lg bg-background p-16">
          <Markdown
            components={{
              h2: ({ children }) => (
                <Typography
                  variant="headline-m"
                  as="h2"
                  className="mt-24 mb-8 text-text-default"
                >
                  {children}
                </Typography>
              ),
              p: ({ children }) => (
                <Typography
                  variant="body-m"
                  as="p"
                  className="mb-8 leading-relaxed text-text-default"
                >
                  {children}
                </Typography>
              ),
              ul: ({ children }) => (
                <ul className="mb-8 list-disc pl-20 text-content-body-m leading-relaxed text-text-default">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-8 list-decimal pl-20 text-content-body-m leading-relaxed text-text-default">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="mb-4">{children}</li>,
            }}
          >
            {termsContent}
          </Markdown>
        </div>
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

        <label className="mb-16 flex cursor-pointer items-center gap-8 text-ui-13 text-text-default">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isSubmitting}
            className="size-20 cursor-pointer rounded accent-button-primary-frame"
          />
          利用規約に同意する
        </label>

        <Button
          className="w-full"
          disabled={!agreed || isSubmitting || showLoading || !address}
          onClick={handleAccept}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
