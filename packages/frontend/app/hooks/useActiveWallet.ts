import { type ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import type { Address } from "viem";

import {
  type SmartAccountClientType,
  useSmartAccount,
} from "./useSmartAccount";
import {
  type EOAWalletClient,
  useHasEmbeddedWallet,
  useWallet,
} from "./useWallet";

/**
 * Unified wallet type for SmartAccountClient and EOA WalletClient
 * Compatible with toban's WalletType
 * Use wallet.account?.address for generalized address access
 */
export type WalletType = SmartAccountClientType | EOAWalletClient | undefined;

interface ActiveWalletResult {
  wallet: WalletType;
  address: Address | null;
  connectedWallet: ConnectedWallet | undefined;
  isSmartWallet: boolean;
  isConnectingEmbeddedWallet: boolean;
  isLoading: boolean;
}

/**
 * Check if the Privy user has an embedded wallet via user object.
 * This is available immediately on reload, unlike useWallets().
 */
function useHasEmbeddedWalletFromUser(): boolean {
  const { user } = usePrivy();
  return user?.wallet?.walletClientType === "privy";
}

/**
 * Unified wallet interface hook
 * Selects Smart Account for embedded wallets, EOA otherwise
 */
export function useActiveWallet(): ActiveWalletResult {
  const { walletClient, connectedWallet, address: eoaAddress } = useWallet();
  const {
    smartAccountClient,
    smartAccountAddress,
    isLoading: isSmartAccountLoading,
  } = useSmartAccount();
  const { ready: walletsReady } = useWallets();
  const hasEmbeddedFromWallets = useHasEmbeddedWallet();
  const hasEmbeddedFromUser = useHasEmbeddedWalletFromUser();

  // Use user object for immediate detection, wallets hook as fallback
  const isConnectingEmbeddedWallet = hasEmbeddedFromWallets || hasEmbeddedFromUser;

  const wallet = isConnectingEmbeddedWallet ? smartAccountClient : walletClient;
  const address = isConnectingEmbeddedWallet ? smartAccountAddress : eoaAddress;

  // Loading if: wallets SDK not ready, or embedded wallet detected but smart account still initializing
  const isLoading =
    !walletsReady || (isConnectingEmbeddedWallet && isSmartAccountLoading);

  return {
    wallet,
    address,
    connectedWallet,
    isSmartWallet: !!smartAccountClient,
    isConnectingEmbeddedWallet,
    isLoading,
  };
}
