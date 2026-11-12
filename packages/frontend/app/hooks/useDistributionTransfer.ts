import type { SmartWalletClientType } from "@privy-io/react-auth/smart-wallets";
import { useCallback, useState } from "react";
import { type Address, encodeFunctionData, parseUnits } from "viem";
import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { routerAbi } from "~/lib/abis/routerAbi";
import { addresses } from "~/lib/contracts";
import { publicClient } from "~/lib/viem";
import { useActiveWallet, type WalletType } from "./useActiveWallet";

export type TransferStatus =
  | "idle"
  | "signing"
  | "pending"
  | "success"
  | "error";

// 送金のたびに approve するのを避けるため、一度にまとめて承認しておく既定額（1,000,000 FOR）。
// 既存 allowance がこの額を下回り、かつ必要額に満たない場合のみ再承認する。
const DEFAULT_APPROVE_AMOUNT = parseUnits("1000000", 18);

export interface DistributionBreakdown {
  fundAmount: bigint;
  burnAmount: bigint;
  recipientAmount: bigint;
  /** from が支払う合計（= recipientAmount + fundAmount + burnAmount） */
  totalAmount: bigint;
}

/**
 * 上乗せ方式の分配額を計算する。
 *
 * 入力の `recipientAmount` は「受取人が受け取る額（送る額）」。基金・Burn はこの額に対して
 * 計算して合計へ上乗せする（合計 = recipientAmount + fund + burn）。Router の
 * transferWithDistribution / transferWithPermit へ渡す `amount` は recipientAmount で、
 * 受取人はそれを満額受け取る。allowance / permit は totalAmount を対象にする必要がある。
 */
export function calculateDistribution(
  recipientAmount: bigint,
  fundRatio: bigint,
  burnRatio: bigint,
): DistributionBreakdown {
  const fundAmount = (recipientAmount * fundRatio) / 10000n;
  const burnAmount = (recipientAmount * burnRatio) / 10000n;
  const totalAmount = recipientAmount + fundAmount + burnAmount;
  return { fundAmount, burnAmount, recipientAmount, totalAmount };
}

/**
 * Privy の Smart Wallet クライアント（AA）かどうかを判定する。
 * EOA の WalletClient にはバンドラー由来の sendUserOperation が生えていない。
 */
function isSmartWalletClient(
  wallet: NonNullable<WalletType>,
): wallet is SmartWalletClientType {
  return "sendUserOperation" in wallet;
}

export function useDistributionTransfer() {
  const { wallet, address, isSmartWallet } = useActiveWallet();
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const executeTransfer = useCallback(
    async (
      recipient: Address,
      recipientAmount: bigint,
      totalAmount: bigint,
      message = "",
    ) => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!address) throw new Error("Wallet address not available");
      if (!addresses) throw new Error("Contract addresses not configured");

      console.log("[FoR/transfer] start", {
        isSmartWallet,
        from: address,
        recipient,
        recipientAmount: recipientAmount.toString(),
        totalAmount: totalAmount.toString(),
        router: addresses.router,
        forToken: addresses.forToken,
        walletAccount: wallet.account?.address,
      });

      setError(null);
      setTxHash(null);

      try {
        // EOA / AA 共通フロー: 事前 approve（不足時のみ）→ transferWithDistribution。
        // permit は使わず allowance を使い回すことで、EOA でも 2 回目以降は
        // 送金トランザクションの署名 1 回だけで完結する（permit 署名が不要）。
        // approve / allowance は「合計（受取額 + 上乗せ分）」を対象にする。
        setStatus("signing");

        const currentAllowance = await publicClient.readContract({
          address: addresses.forToken,
          abi: forTokenAbi,
          functionName: "allowance",
          args: [address, addresses.router],
        });

        console.log("[FoR/transfer] allowance", {
          current: currentAllowance.toString(),
          required: totalAmount.toString(),
        });

        const needsApprove = currentAllowance < totalAmount;
        // 毎回の approve を避けるため既定額をまとめて承認する。
        // 合計が既定額を超える場合のみ、その必要額を承認する。
        const approveAmount =
          totalAmount > DEFAULT_APPROVE_AMOUNT
            ? totalAmount
            : DEFAULT_APPROVE_AMOUNT;

        // 契約の amount は「受取人が受け取る額」。基金・Burn は契約側で上乗せされる。
        const transferArgs = [
          address,
          recipient,
          recipientAmount,
          message,
        ] as const;

        let hash: `0x${string}`;

        if (isSmartWalletClient(wallet)) {
          // AA: approve と送金を 1 つの UserOperation にまとめる。
          // 別々の UserOperation に分けると、approve が取り込まれた直後でも
          // バンドラーが送金側をまだ古い state でシミュレートすることがあり、
          // ERC20InsufficientAllowance(allowance=0) で revert していた。
          const calls = [
            ...(needsApprove
              ? [
                  {
                    to: addresses.forToken,
                    data: encodeFunctionData({
                      abi: forTokenAbi,
                      functionName: "approve",
                      args: [addresses.router, approveAmount],
                    }),
                  },
                ]
              : []),
            {
              to: addresses.router,
              data: encodeFunctionData({
                abi: routerAbi,
                functionName: "transferWithDistribution",
                args: transferArgs,
              }),
            },
          ];

          console.log("[FoR/transfer] batched userOp start", {
            needsApprove,
            approveAmount: approveAmount.toString(),
            callCount: calls.length,
          });

          setStatus("pending");
          hash = await wallet.sendTransaction({ calls });
          console.log("[FoR/transfer] batched userOp sent", { hash });
        } else {
          // EOA: バッチできないので approve → 送金の 2 トランザクションに分ける。
          if (needsApprove) {
            console.log("[FoR/transfer] approve start", {
              approveAmount: approveAmount.toString(),
            });
            const approveHash = await wallet.writeContract({
              address: addresses.forToken,
              abi: forTokenAbi,
              functionName: "approve",
              args: [addresses.router, approveAmount],
              chain: publicClient.chain,
              account: wallet.account,
            });
            console.log("[FoR/transfer] approve sent", { approveHash });
            const approveReceipt = await publicClient.waitForTransactionReceipt(
              { hash: approveHash },
            );
            if (approveReceipt.status !== "success") {
              throw new Error("Approve transaction reverted");
            }
            console.log("[FoR/transfer] approve confirmed");
          }

          setStatus("pending");

          console.log("[FoR/transfer] transferWithDistribution start");
          hash = await wallet.writeContract({
            address: addresses.router,
            abi: routerAbi,
            functionName: "transferWithDistribution",
            args: transferArgs,
            chain: publicClient.chain,
            account: wallet.account,
          });
          console.log("[FoR/transfer] transferWithDistribution sent", { hash });
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
    [wallet, address, isSmartWallet],
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
