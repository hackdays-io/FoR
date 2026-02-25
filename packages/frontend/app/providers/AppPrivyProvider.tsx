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
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
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
