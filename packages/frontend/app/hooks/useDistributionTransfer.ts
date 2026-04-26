import { useCallback, useState } from "react";
import type { Address } from "viem";
import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { routerAbi } from "~/lib/abis/routerAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";
import { useActiveWallet } from "./useActiveWallet";
import { usePermitSignature } from "./usePermitSignature";

export type TransferStatus =
  | "idle"
  | "signing"
  | "pending"
  | "success"
  | "error";

export interface DistributionBreakdown {
  fundAmount: bigint;
  burnAmount: bigint;
  recipientAmount: bigint;
}

export function calculateDistribution(
  amount: bigint,
  fundRatio: bigint,
  burnRatio: bigint,
): DistributionBreakdown {
  const fundAmount = (amount * fundRatio) / 10000n;
  const burnAmount = (amount * burnRatio) / 10000n;
  const recipientAmount = amount - fundAmount - burnAmount;
  return { fundAmount, burnAmount, recipientAmount };
}

/**
 * 受取人が受け取る額から、Router に渡すべき総額を逆算する。
 * 総額 * (10000 - fund - burn) / 10000 = recipientAmount を満たす total を返す。
 */
export function grossUpFromRecipient(
  recipientAmount: bigint,
  fundRatio: bigint,
  burnRatio: bigint,
): bigint {
  const recipientRatio = 10000n - fundRatio - burnRatio;
  if (recipientRatio <= 0n) return recipientAmount;
  return (recipientAmount * 10000n) / recipientRatio;
}

export function useDistributionTransfer() {
  const { wallet, address, isSmartWallet } = useActiveWallet();
  const { signPermit } = usePermitSignature();
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const executeTransfer = useCallback(
    async (recipient: Address, amount: bigint, message = "") => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!address) throw new Error("Wallet address not available");
      if (!addresses) throw new Error("Contract addresses not configured");

      console.log("[FoR/transfer] start", {
        isSmartWallet,
        from: address,
        recipient,
        amount: amount.toString(),
        router: addresses.router,
        forToken: addresses.forToken,
        walletAccount: wallet.account?.address,
      });

      setError(null);
      setTxHash(null);

      try {
        let hash: `0x${string}`;

        if (isSmartWallet) {
          // AA wallet flow: approve → transferWithDistribution
          setStatus("signing");

          const currentAllowance = await publicClient.readContract({
            address: addresses.forToken,
            abi: forTokenAbi,
            functionName: "allowance",
            args: [address, addresses.router],
          });

          console.log("[FoR/transfer] AA allowance", {
            current: currentAllowance.toString(),
            required: amount.toString(),
          });

          if (currentAllowance < amount) {
            console.log("[FoR/transfer] AA approve start");
            const approveHash = await wallet.writeContract({
              address: addresses.forToken,
              abi: forTokenAbi,
              functionName: "approve",
              args: [addresses.router, amount],
              chain: publicClient.chain,
              account: wallet.account!,
            });
            console.log("[FoR/transfer] AA approve sent", { approveHash });
            const approveReceipt = await publicClient.waitForTransactionReceipt(
              {
                hash: approveHash,
              },
            );
            if (approveReceipt.status !== "success") {
              throw new Error("Approve transaction reverted");
            }
            console.log("[FoR/transfer] AA approve confirmed");
          }

          setStatus("pending");

          console.log("[FoR/transfer] AA transferWithDistribution start");
          hash = await wallet.writeContract({
            address: addresses.router,
            abi: routerAbi,
            functionName: "transferWithDistribution",
            args: [address, recipient, amount, message],
            chain: publicClient.chain,
            account: wallet.account!,
          });
          console.log("[FoR/transfer] AA transferWithDistribution sent", {
            hash,
          });
        } else {
          // EOA wallet flow: permit signature → transferWithPermit
          setStatus("signing");
          console.log("[FoR/transfer] EOA signPermit start");
          const { v, r, s, deadline } = await signPermit(
            addresses.router,
            amount,
          );
          console.log("[FoR/transfer] EOA signPermit done", {
            deadline: deadline.toString(),
          });

          setStatus("pending");

          hash = await wallet.writeContract({
            address: addresses.router,
            abi: routerAbi,
            functionName: "transferWithPermit",
            args: [address, recipient, amount, deadline, v, r, s, message],
            chain: publicClient.chain,
            account: wallet.account!,
          });
          console.log("[FoR/transfer] EOA transferWithPermit sent", { hash });
        }

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });
        if (receipt.status !== "success") {
          throw new Error("Transfer transaction reverted");
        }
        setTxHash(hash);
        setStatus("success");
        return hash;
      } catch (err) {
        console.error("[FoR/transfer] failed", err);
        const error = err instanceof Error ? err : new Error("Transfer failed");
        setError(error);
        setStatus("error");
        throw error;
      }
    },
    [wallet, address, isSmartWallet, signPermit],
  );

  return {
    executeTransfer,
    calculateDistribution,
    status,
    txHash,
    error,
    reset,
    isReady: !!wallet && !!address && !!addresses,
  };
}
