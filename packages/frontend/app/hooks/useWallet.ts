import {
  type ConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import {
  type Account,
  type Address,
  type CustomTransport,
  createWalletClient,
  custom,
  type WalletClient,
} from "viem";

import { currentChain } from "../lib/viem";

export type EOAWalletClient = WalletClient<
  CustomTransport,
  typeof currentChain,
  Account
>;

/**
 * Parse Privy chainId format (e.g., "eip155:11155111") to number
 */
function parseChainId(chainId: string | undefined): number | null {
  if (!chainId) {
    return null;
  }
  return Number(chainId.replace("eip155:", ""));
}

const EMBEDDED_WALLET_CLIENT_TYPE = "privy";
const METAMASK_WALLET_CLIENT_TYPE = "metamask";

/**
 * Wallet client type helpers for Privy v3
 */
export function isEmbeddedWallet(wallet: ConnectedWallet): boolean {
  return wallet.walletClientType === EMBEDDED_WALLET_CLIENT_TYPE;
}

export function isMetaMaskWallet(wallet: ConnectedWallet): boolean {
  return wallet.walletClientType === METAMASK_WALLET_CLIENT_TYPE;
}

export function getEmbeddedWallet(
  wallets: ConnectedWallet[],
): ConnectedWallet | undefined {
  return wallets.find(isEmbeddedWallet);
}

export function getMetaMaskWallet(
  wallets: ConnectedWallet[],
): ConnectedWallet | undefined {
  return wallets.find(isMetaMaskWallet);
}

export function getExternalWallet(
  wallets: ConnectedWallet[],
): ConnectedWallet | undefined {
  return wallets.find((wallet) => !isEmbeddedWallet(wallet));
}

export function getPreferredExternalWallet(
  wallets: ConnectedWallet[],
): ConnectedWallet | undefined {
  return getMetaMaskWallet(wallets) ?? getExternalWallet(wallets);
}

interface AccountClientResult {
  client: EOAWalletClient | undefined;
  wallet: ConnectedWallet | undefined;
}

/**
 * Low-level hook: Create EOA WalletClient from wallets array
 * Compatible with toban's useAccountClient
 */
export function useAccountClient(
  wallets: ConnectedWallet[],
): AccountClientResult {
  const [client, setClient] = useState<EOAWalletClient>();

  const wallet = getPreferredExternalWallet(wallets);

  useEffect(() => {
    async function createClient(): Promise<void> {
      setClient(undefined);

      if (!wallet) {
        return;
      }

      try {
        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({
          chain: currentChain,
          transport: custom(provider),
          account: wallet.address as Address,
        });
        setClient(walletClient);
      } catch {
        // Silently fail - error handling at component level
      }
    }

    createClient();
  }, [wallet]);

  return { client, wallet };
}

interface WalletResult {
  address: Address | null;
  isConnected: boolean;
  chainId: number | null;
  walletClient: EOAWalletClient | undefined;
  connectedWallet: ConnectedWallet | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (targetChainId: number) => Promise<void>;
}

/**
 * Main wallet hook providing EOA wallet management with Privy
 */
export function useWallet(): WalletResult {
  const { connectOrCreateWallet, logout, ready, authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const { client: walletClient, wallet: connectedWallet } =
    useAccountClient(wallets);

  const address = (connectedWallet?.address as Address) ?? null;
  const isConnected =
    ready && walletsReady && authenticated && !!connectedWallet;
  const chainId = parseChainId(connectedWallet?.chainId);

  const connect = useCallback(async (): Promise<void> => {
    await connectOrCreateWallet();
  }, [connectOrCreateWallet]);

  const disconnect = useCallback(async (): Promise<void> => {
    await logout();
  }, [logout]);

  const switchChain = useCallback(
    async (targetChainId: number): Promise<void> => {
      if (!connectedWallet) {
        throw new Error("No wallet connected");
      }
      await connectedWallet.switchChain(targetChainId);
    },
    [connectedWallet],
  );

  return {
    address,
    isConnected,
    chainId,
    walletClient,
    connectedWallet,
    connect,
    disconnect,
    switchChain,
  };
}

/**
 * Check if user has an embedded Privy wallet
 * In Privy v3, use walletClientType === "privy" for embedded wallets
 */
export function useHasEmbeddedWallet(): boolean {
  const { wallets } = useWallets();
  return !!getEmbeddedWallet(wallets);
}

/**
 * Get the embedded wallet specifically
 */
export function useEmbeddedWallet(): ConnectedWallet | undefined {
  const { wallets } = useWallets();
  return getEmbeddedWallet(wallets);
}
