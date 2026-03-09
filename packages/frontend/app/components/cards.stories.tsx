import type * as React from "react";

import "~/app.css";
import walletCardBadgePlaceholder from "~/assets/images/cards/wallet-card-badge-placeholder.svg";
import walletCardQrPlaceholder from "~/assets/images/cards/wallet-card-qr-placeholder.svg";
import { Card } from "~/components/ui/card";

export default {
  title: "Components/Cards",
};

type StoryFrameProps = {
  children: React.ReactNode;
};

function StoryFrame({ children }: StoryFrameProps) {
  return (
    <div className="min-h-screen bg-background p-24">
      <div className="mx-auto max-w-[512px]">{children}</div>
    </div>
  );
}

export const WalletDefault = () => {
  return (
    <StoryFrame>
      <Card
        amount={34393}
        topProps={{
          badgeImage: walletCardBadgePlaceholder,
          qrCodeImage: walletCardQrPlaceholder,
        }}
        variant="wallet"
      />
    </StoryFrame>
  );
};

WalletDefault.storyName = "Wallet / Default";

export const WalletWithoutQr = () => {
  return (
    <StoryFrame>
      <Card
        amount={34393}
        topProps={{
          badgeImage: walletCardBadgePlaceholder,
        }}
        variant="wallet"
      />
    </StoryFrame>
  );
};

WalletWithoutQr.storyName = "Wallet / QR Hidden";

export const PromoDefault = () => {
  return (
    <StoryFrame>
      <Card
        amount={500}
        topProps={{
          title: "森のお茶会",
        }}
        variant="promo"
      />
    </StoryFrame>
  );
};

PromoDefault.storyName = "Promo / Default";

export const PromoNewLongTitle = () => {
  return (
    <StoryFrame>
      <Card
        amount={500}
        isNew
        topProps={{
          title:
            "風のテラスでひらくコミュニティマーケットと森の手しごと市のお知らせ",
        }}
        variant="promo"
      />
    </StoryFrame>
  );
};

PromoNewLongTitle.storyName = "Promo / New + Ellipsis";
