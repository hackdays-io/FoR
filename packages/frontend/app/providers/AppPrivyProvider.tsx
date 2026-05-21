import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
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
      {children}
    </BasePrivyProvider>
  );
}
