import { useState } from "react";
import Markdown from "react-markdown";
import { useNavigate } from "react-router";
import type { Address } from "viem";
import { AppBar, AppBarItem, AppBarTitle } from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import termsContent from "~/content/terms.md?raw";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import type { Route } from "./+types/welcome";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "利用規約 | FoR" }];
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 同意の記録は持たない。プロフィールの有無で遷移先を振り分ける。
  // allowlist への登録は、ホームのモーダルから Google フォームへ誘導して運営が行う（#185）
  const handleAccept = async () => {
    if (!address) return;
    setIsSubmitting(true);
    const exists = await hasProfile(address);
    navigate(exists ? "/" : "/profile/create", { replace: true });
  };

  const buttonLabel = isSubmitting
    ? "読み込み中..."
    : "利用規約に同意して利用を開始する";

  return (
    <div className="min-h-dvh bg-bg-default">
      <AppBar>
        <AppBarItem position="center">
          <AppBarTitle>利用規約</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="px-20 pt-20 pb-[140px]">
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

      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button
          className="w-full"
          disabled={isSubmitting || isWalletLoading || !address}
          onClick={handleAccept}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
