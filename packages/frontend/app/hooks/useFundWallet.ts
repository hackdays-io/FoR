import { useQuery } from "@tanstack/react-query";
import { type Address, formatUnits } from "viem";

import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { routerAbi } from "~/lib/abis/routerAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";

export function useFundWallet() {
  return useQuery({
    queryKey: ["router", "fundWallet"],
    queryFn: async (): Promise<Address> => {
      if (!addresses) throw new Error("Contract addresses not configured");
      const fundWallet = await publicClient.readContract({
        address: addresses.router,
        abi: routerAbi,
        functionName: "fundWallet",
      });
      return fundWallet as Address;
    },
    enabled: !!addresses,
  });
}

export function useFundWalletBalance() {
  const { data: fundWallet } = useFundWallet();

  return useQuery({
    queryKey: ["forToken", "balanceOf", fundWallet],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      if (!fundWallet) throw new Error("Fund wallet not yet resolved");
      const balance = await publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "balanceOf",
        args: [fundWallet],
      });
      return {
        raw: balance,
        formatted: formatUnits(balance, 18),
      };
    },
    enabled: !!fundWallet && !!addresses,
    refetchInterval: 10_000,
  });
}
