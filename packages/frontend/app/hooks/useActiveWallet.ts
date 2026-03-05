import type { ConnectedWallet } from "@privy-io/react-auth";
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
  const isConnectingEmbeddedWallet = useHasEmbeddedWallet();

  const wallet = isConnectingEmbeddedWallet ? smartAccountClient : walletClient;
  const address = isConnectingEmbeddedWallet ? smartAccountAddress : eoaAddress;

  return {
    wallet,
    address,
    connectedWallet,
    isSmartWallet: !!smartAccountClient,
    isConnectingEmbeddedWallet,
    isLoading: isConnectingEmbeddedWallet && isSmartAccountLoading,
  };
}
