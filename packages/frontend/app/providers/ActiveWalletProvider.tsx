import {
  type ConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import {
  type SmartWalletClientType,
  useSmartWallets,
} from "@privy-io/react-auth/smart-wallets";
import { createContext, type ReactNode } from "react";
import type { Address } from "viem";

import {
  type EOAWalletClient,
  useHasEmbeddedWallet,
  useWallet,
} from "~/hooks/useWallet";

export type WalletType = SmartWalletClientType | EOAWalletClient | undefined;

export interface ActiveWalletContextValue {
  wallet: WalletType;
  address: Address | null;
  connectedWallet: ConnectedWallet | undefined;
  isSmartWallet: boolean;
  isConnectingEmbeddedWallet: boolean;
  isLoading: boolean;
}

export const ActiveWalletContext =
  createContext<ActiveWalletContextValue | null>(null);

function useHasEmbeddedWalletFromUser(): boolean {
  const { user } = usePrivy();
  return user?.wallet?.walletClientType === "privy";
}

export function ActiveWalletProvider({ children }: { children: ReactNode }) {
  const { walletClient, connectedWallet, address: eoaAddress } = useWallet();
  // Privy ネイティブの Smart Wallet クライアント。embedded wallet が signer の
  // とき Privy が AA をプロビジョニングし、ここから client が得られる。
  const { client: smartWalletClient } = useSmartWallets();
  const { ready: walletsReady } = useWallets();
  const hasEmbeddedFromWallets = useHasEmbeddedWallet();
  const hasEmbeddedFromUser = useHasEmbeddedWalletFromUser();

  const isConnectingEmbeddedWallet =
    hasEmbeddedFromWallets || hasEmbeddedFromUser;

  const wallet = isConnectingEmbeddedWallet ? smartWalletClient : walletClient;
  const address = isConnectingEmbeddedWallet
    ? ((smartWalletClient?.account?.address as Address | undefined) ?? null)
    : eoaAddress;

  // embedded wallet は接続済みだが Smart Wallet client が未プロビジョニングの
  // 間は読み込み中扱いにする。
  const isLoading =
    !walletsReady || (isConnectingEmbeddedWallet && !smartWalletClient);

  const isSmartWallet = !!smartWalletClient;

  const value: ActiveWalletContextValue = {
    wallet,
    address,
    connectedWallet,
    isSmartWallet,
    isConnectingEmbeddedWallet,
    isLoading,
  };

  return (
    <ActiveWalletContext.Provider value={value}>
      {children}
    </ActiveWalletContext.Provider>
  );
}
