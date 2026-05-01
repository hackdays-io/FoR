import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useHasAdminRole(account: Address | null | undefined) {
  return useQuery({
    queryKey: ["forToken", "hasAdminRole", account],
    queryFn: async () => {
      if (!addresses) throw new Error("Contract addresses not configured");
      if (!account) throw new Error("account is required");
      const role = await publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "ADMIN_ROLE",
      });
      return publicClient.readContract({
        address: addresses.forToken,
        abi: forTokenAbi,
        functionName: "hasRole",
        args: [role, account],
      });
    },
    enabled: !!account && !!addresses,
  });
}

function useAdminAllowListMutation(action: "add" | "remove") {
  const { wallet } = useActiveWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AllowListStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const submit = useCallback(
    async (account: Address) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!wallet.account) throw new Error("Wallet account not available");
      if (!addresses) throw new Error("Contract addresses not configured");

      setError(null);
      setTxHash(null);
      setStatus("pending");

      try {
        const hash = await wallet.writeContract({
          address: addresses.forToken,
          abi: forTokenAbi,
          functionName:
            action === "add" ? "addToAllowList" : "removeFromAllowList",
          args: [account],
          chain: publicClient.chain,
          account: wallet.account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error(
            action === "add"
              ? "AllowList addition transaction reverted"
              : "AllowList removal transaction reverted",
          );
        }

        queryClient.setQueryData(
          ["forToken", "isAllowListed", account],
          action === "add",
        );
        setTxHash(hash);
        setStatus("success");
        return hash;
      } catch (err) {
        const normalized =
          err instanceof Error
            ? err
            : new Error(
                action === "add"
                  ? "AllowList addition failed"
                  : "AllowList removal failed",
              );
        setError(normalized);
        setStatus("error");
        throw normalized;
      }
    },
    [wallet, queryClient, action],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return { submit, status, error, txHash, reset, isReady: !!wallet };
}

export function useAddToAllowListByAdmin() {
  const { submit, ...rest } = useAdminAllowListMutation("add");
  return { addToAllowList: submit, ...rest };
}

export function useRemoveFromAllowListByAdmin() {
  const { submit, ...rest } = useAdminAllowListMutation("remove");
  return { removeFromAllowList: submit, ...rest };
}

export function useAddToAllowList() {
  const { wallet, address } = useActiveWallet();
  const queryClient = useQueryClient();
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
      // tx 成功直後に publicClient で readContract すると RPC ラグで stale な false が返り
      // AuthGate が /welcome に戻してしまうため、ここで真実 (true) を直接書き込む
      queryClient.setQueryData(["forToken", "isAllowListed", address], true);
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
  }, [wallet, address, queryClient]);

  return {
    addToAllowList,
    status,
    error,
    txHash,
    isReady: !!wallet && !!address && !!addresses,
  };
}
