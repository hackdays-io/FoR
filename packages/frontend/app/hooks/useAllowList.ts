import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Address } from "viem";
import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";
import { useActiveWallet } from "./useActiveWallet";

export type AllowListStatus =
  | "idle"
  | "signing"
  | "pending"
  | "success"
  | "error";

export function useIsAllowListed(account: Address | null | undefined) {
  return useQuery({
    queryKey: ["forToken", "isAllowListed", account],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      return publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "isAllowListed",
        args: [account!],
      });
    },
    enabled: !!account && !!addresses,
  });
}

export function useAddToAllowList() {
  const { wallet, address } = useActiveWallet();
  const [status, setStatus] = useState<AllowListStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const addToAllowList = useCallback(async () => {
    if (!wallet) throw new Error("Wallet not connected");
    if (!address) throw new Error("Wallet address not available");
    if (!addresses) throw new Error("Contract addresses not configured");

    setError(null);
    setTxHash(null);
    setStatus("signing");

    try {
      const res = await fetch("/api/allowlist/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: address }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to fetch allowlist signature");
      }

      const { deadline, signature } = (await res.json()) as {
        deadline: string;
        signature: `0x${string}`;
      };

      setStatus("pending");

      const hash = await wallet.writeContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "addToAllowListWithSignature",
        args: [address, BigInt(deadline), signature],
        chain: publicClient.chain,
        account: wallet.account!,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("AllowList addition transaction reverted");
      }
      setTxHash(hash);
      setStatus("success");
      return hash;
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error("AllowList addition failed");
      setError(normalized);
      setStatus("error");
      throw normalized;
    }
  }, [wallet, address]);

  return {
    addToAllowList,
    status,
    error,
    txHash,
    isReady: !!wallet && !!address && !!addresses,
  };
}
