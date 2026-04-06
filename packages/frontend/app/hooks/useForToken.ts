import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { type Address, formatUnits } from "viem";
import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";
import { useActiveWallet } from "./useActiveWallet";

export function useForTokenBalance(account: Address | null | undefined) {
  return useQuery({
    queryKey: ["forToken", "balanceOf", account],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      const balance = await publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "balanceOf",
        args: [account!],
      });
      return {
        raw: balance,
        formatted: formatUnits(balance, 18),
      };
    },
    enabled: !!account && !!addresses,
    refetchInterval: 10_000,
  });
}

export function useForTokenAllowance(
  owner: Address | null | undefined,
  spender: Address | undefined,
) {
  return useQuery({
    queryKey: ["forToken", "allowance", owner, spender],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      return publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "allowance",
        args: [owner!, spender!],
      });
    },
    enabled: !!owner && !!spender && !!addresses,
    refetchInterval: 10_000,
  });
}

export function useForTokenApprove() {
  const { wallet } = useActiveWallet();

  const approve = useCallback(
    async (spender: Address, amount: bigint) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!addresses) throw new Error("Contract addresses not configured");

      const hash = await wallet.writeContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "approve",
        args: [spender, amount],
        chain: publicClient.chain,
        account: wallet.account!,
      });
      return publicClient.waitForTransactionReceipt({ hash });
    },
    [wallet],
  );

  return { approve, isReady: !!wallet && !!addresses };
}
