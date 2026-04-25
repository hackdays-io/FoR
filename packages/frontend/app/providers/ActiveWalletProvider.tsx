import { type ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { createContext, type ReactNode } from "react";
import type { Address } from "viem";

import {
  type SmartAccountClientType,
  useSmartAccount,
} from "~/hooks/useSmartAccount";
import {
  type EOAWalletClient,
  useHasEmbeddedWallet,
  useWallet,
} from "~/hooks/useWallet";

export type WalletType = SmartAccountClientType | EOAWalletClient | undefined;

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
  const {
    smartAccountClient,
    smartAccountAddress,
    isLoading: isSmartAccountLoading,
  } = useSmartAccount();
  const { ready: walletsReady } = useWallets();
  const hasEmbeddedFromWallets = useHasEmbeddedWallet();
  const hasEmbeddedFromUser = useHasEmbeddedWalletFromUser();

  const isConnectingEmbeddedWallet =
    hasEmbeddedFromWallets || hasEmbeddedFromUser;

  const wallet = isConnectingEmbeddedWallet ? smartAccountClient : walletClient;
  const address = isConnectingEmbeddedWallet ? smartAccountAddress : eoaAddress;

  const isLoading =
    !walletsReady || (isConnectingEmbeddedWallet && isSmartAccountLoading);

  const isSmartWallet = !!smartAccountClient;

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
