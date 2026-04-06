import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Address } from "viem";
import { routerAbi } from "~/lib/abis/routerAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";
import { useActiveWallet } from "./useActiveWallet";

export function useDistributionRatios() {
  return useQuery({
    queryKey: ["router", "ratios"],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      const [fundRatio, burnRatio] = await Promise.all([
        publicClient.readContract({
          address: addresses.router,
          abi: routerAbi,
          functionName: "fundRatio",
        }),
        publicClient.readContract({
          address: addresses.router,
          abi: routerAbi,
          functionName: "burnRatio",
        }),
      ]);
      const recipientRatio = 10000n - fundRatio - burnRatio;
      return { fundRatio, burnRatio, recipientRatio };
    },
    enabled: !!addresses,
  });
}

export function useTransferWithDistribution() {
  const { wallet } = useActiveWallet();

  const transfer = useCallback(
    async (from: Address, recipient: Address, amount: bigint) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!addresses) throw new Error("Contract addresses not configured");

      const hash = await wallet.writeContract({
        address: addresses.router,
        abi: routerAbi,
        functionName: "transferWithDistribution",
        args: [from, recipient, amount],
        chain: publicClient.chain,
        account: wallet.account!,
      });
      return publicClient.waitForTransactionReceipt({ hash });
    },
    [wallet],
  );

  return { transfer, isReady: !!wallet && !!addresses };
}

export function useTransferWithPermit() {
  const { wallet } = useActiveWallet();

  const transfer = useCallback(
    async (
      from: Address,
      recipient: Address,
      amount: bigint,
      deadline: bigint,
      v: number,
      r: `0x${string}`,
      s: `0x${string}`,
    ) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!addresses) throw new Error("Contract addresses not configured");

      const hash = await wallet.writeContract({
        address: addresses.router,
        abi: routerAbi,
        functionName: "transferWithPermit",
        args: [from, recipient, amount, deadline, v, r, s],
        chain: publicClient.chain,
        account: wallet.account!,
      });
      return publicClient.waitForTransactionReceipt({ hash });
    },
    [wallet],
  );

  return { transfer, isReady: !!wallet && !!addresses };
}
