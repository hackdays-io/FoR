import type { ConnectedWallet } from "@privy-io/react-auth";
import {
  createSmartAccountClient,
  type SmartAccountClient,
} from "permissionless";
import { toThirdwebSmartAccount } from "permissionless/accounts";
import { useEffect, useState } from "react";
import { type Address, http, type Transport } from "viem";
import {
  entryPoint07Address,
  type SmartAccount,
  type SmartAccountImplementation,
} from "viem/account-abstraction";

import { pimlicoClient, pimlicoConfigError, pimlicoUrl } from "../lib/pimlico";
import { currentChain, publicClient } from "../lib/viem";
import { getEmbeddedWallet, useEmbeddedWallet } from "./useWallet";

export type SmartAccountClientType = SmartAccountClient<
  Transport,
  typeof currentChain,
  SmartAccount<SmartAccountImplementation>
>;

/**
 * Create SmartAccountClient from an embedded wallet
 */
async function createSmartAccountClientFromWallet(
  embeddedWallet: ConnectedWallet,
): Promise<SmartAccountClientType | undefined> {
  console.log("[FoR/smart-account] init", {
    embeddedWalletAddress: embeddedWallet.address,
    embeddedWalletChainId: embeddedWallet.chainId,
    walletClientType: embeddedWallet.walletClientType,
    chain: currentChain.name,
    chainId: currentChain.id,
    pimlicoUrl,
  });

  const owner = await embeddedWallet.getEthereumProvider();
  if (!owner) {
    console.warn("[FoR/smart-account] no provider from embedded wallet");
    return undefined;
  }

  if (!pimlicoUrl || !pimlicoClient) {
    throw new Error(
      pimlicoConfigError ?? "Pimlico bundler/paymaster is not configured.",
    );
  }

  const client = pimlicoClient;

  const smartAccount = await toThirdwebSmartAccount({
    owner: owner as Parameters<typeof toThirdwebSmartAccount>[0]["owner"],
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  });

  console.log("[FoR/smart-account] smartAccount created", {
    address: smartAccount.address,
  });

  return createSmartAccountClient({
    account: smartAccount,
    chain: currentChain,
    bundlerTransport: http(pimlicoUrl),
    paymaster: client,
    userOperation: {
      estimateFeesPerGas: async () =>
        (await client.getUserOperationGasPrice()).standard,
    },
  });
}

/**
 * Low-level hook: Create SmartAccountClient from wallets array
 * Compatible with toban's useSmartAccountClient
 */
export function useSmartAccountClient(
  wallets: ConnectedWallet[],
): SmartAccountClientType | undefined {
  const [client, setClient] = useState<SmartAccountClientType>();

  const embeddedWallet = getEmbeddedWallet(wallets);

  useEffect(() => {
    async function initSmartAccount(): Promise<void> {
      if (!embeddedWallet) {
        setClient(undefined);
        return;
      }

      setClient(undefined);

      try {
        const smartAccountClient =
          await createSmartAccountClientFromWallet(embeddedWallet);
        setClient(smartAccountClient);
      } catch (err) {
        console.error("[FoR/smart-account] useSmartAccountClient failed", err);
      }
    }

    initSmartAccount();
  }, [embeddedWallet]);

  return client;
}

interface SmartAccountResult {
  smartAccountClient: SmartAccountClientType | undefined;
  smartAccountAddress: Address | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * High-level hook for creating Smart Account client using Pimlico bundler/paymaster
 * Provides additional convenience properties (address, isLoading)
 */
export function useSmartAccount(): SmartAccountResult {
  const embeddedWallet = useEmbeddedWallet();

  const [smartAccountClient, setSmartAccountClient] =
    useState<SmartAccountClientType>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSmartAccount(): Promise<void> {
      if (!embeddedWallet) {
        setSmartAccountClient(undefined);
        setIsLoading(false);
        setError(null);
        return;
      }

      setSmartAccountClient(undefined);
      setIsLoading(true);
      setError(null);

      try {
        const client = await createSmartAccountClientFromWallet(embeddedWallet);
        setSmartAccountClient(client);
        console.log("[FoR/smart-account] useSmartAccount ready", {
          address: client?.account?.address,
        });
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to initialize smart account.";
        console.error(
          "[FoR/smart-account] useSmartAccount failed",
          caughtError,
        );
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    initSmartAccount();
  }, [embeddedWallet]);

  const smartAccountAddress: Address | null =
    smartAccountClient?.account?.address ?? null;

  return {
    smartAccountClient,
    smartAccountAddress,
    isLoading,
    error,
  };
}
