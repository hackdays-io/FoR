import { useNavigate } from "react-router";

import { LoadingScreen } from "~/components/loading-screen";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { SectionTitle } from "~/components/ui/section-title";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useForStatus } from "~/hooks/useForStatus";
import { getBadgeImage, getStaticBadgeImage } from "~/lib/for-status-badges";
import { getTierContent, TIER_CONTENT_LIST } from "~/lib/for-status-content";
import type { Route } from "./+types/status";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "あなたのFoRステータス | FoR" }];
}

export default function Status() {
  const navigate = useNavigate();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { status: forStatus, isLoading: isStatusLoading } =
    useForStatus(address);

  if (isWalletLoading || !address || (isStatusLoading && !forStatus)) {
    return <LoadingScreen />;
  }

  // ここに来た時点で address は確定。決済 0 件でも computeForStatus が Tier 1 を返すため
  // forStatus は基本 null にならないが、型ガードとして保険を入れる。
  if (!forStatus) return null;

  const content = getTierContent(forStatus.tier);
  const badgeImage = getBadgeImage(forStatus.tier, forStatus.progress);

  return (
    <div className="min-h-dvh bg-bg-default pb-40">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>あなたのFoRステータス</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col gap-24 px-20 pt-12">
        {/* 現在ステータスのヒーローカード */}
        <div className="flex flex-col items-center gap-8 rounded-lg bg-muted px-20 py-32">
          {badgeImage && (
            <img
              src={badgeImage}
              alt={content.nameEn}
              className="h-[136px] w-[136px] object-contain"
            />
          )}
          <Typography as="h2" variant="display-m" className="text-text-default">
            {content.nameEn}
          </Typography>
          <Typography variant="ui-16" className="text-text-default">
            {content.nameJa}
          </Typography>
          {forStatus.upgradeMessage && (
            <Typography
              variant="ui-16"
              weight="bold"
              className="mt-8 text-visual-green-5"
            >
              {forStatus.upgradeMessage}
            </Typography>
          )}
        </div>

        {/* 現在ティアの説明文 + 減衰アラート */}
        <div className="flex flex-col gap-8">
          <Typography
            variant="body-l"
            className="leading-relaxed text-text-default"
          >
            {content.description} {forStatus.alertMessage && forStatus.alertMessage}
          </Typography>
        </div>

        {/* ステータスの種類（一覧グリッド） */}
        <div>
          <SectionTitle>FoRステータスの種類</SectionTitle>
          <div className="mt-12 grid grid-cols-2 gap-12">
            {TIER_CONTENT_LIST.map((tier) => {
              const staticBadge = getStaticBadgeImage(tier.tier);
              return (
                <div
                  key={tier.tier}
                  className="flex flex-col items-center gap-8 rounded-lg border bg-card px-16 py-20 border-border"
                >
                  {staticBadge && (
                    <img
                      src={staticBadge}
                      alt={tier.nameEn}
                      className="h-64 w-64 object-contain"
                    />
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <Typography
                      variant="ui-16"
                      weight="bold"
                      className="text-text-default"
                    >
                      {tier.nameEn}
                    </Typography>
                    <Typography variant="ui-13"
                      weight="bold"
                      className="text-text-default">
                      {tier.nameJa}
                    </Typography>
                  </div>
                  <Typography
                    variant="body-s"
                    className="self-stretch font-medium leading-relaxed text-text-default"
                  >
                    {tier.tagline}
                  </Typography>
                </div>
              );
            })}
          </div>
        </div>

        {/* FoRステータスとは？ → 説明ページへ */}
        <div className="flex justify-center pt-8">
          <Button onClick={() => navigate("/status/about")} className="w-full">
            FoRステータスとは？
          </Button>
        </div>
      </div>
    </div>
  );
}
