import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import type { ReactNode } from "react";

import { currentChain } from "../lib/viem";

interface Props {
  children: ReactNode;
}

export function AppPrivyProvider({ children }: Props): ReactNode {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!appId) {
    throw new Error("VITE_PRIVY_APP_ID is not set");
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google", "email", "wallet"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          // Privy の署名 / 送金確認モーダル（英語固定・i18n 非対応）を非表示にし、
          // 確認 UI はアプリ側の日本語画面で担う
          showWalletUIs: false,
        },
        defaultChain: currentChain,
        supportedChains: [currentChain],
        appearance: {
          theme: "light",
        },
      }}
    >
      {/* Privy ネイティブの Smart Wallet（バンドラー/ペイマスターは Privy
          ダッシュボード側で設定）。embedded wallet を signer として AA を提供する */}
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </BasePrivyProvider>
  );
}
