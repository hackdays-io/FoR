import { useCallback } from "react";
import type { Address } from "viem";
import { forTokenAbi } from "~/lib/abis/forTokenAbi";
import { addresses } from "~/lib/contracts";
import { publicClient, currentChain } from "~/lib/viem";
import { useActiveWallet } from "./useActiveWallet";

const TOKEN_NAME = "FoR";
const TOKEN_VERSION = "1";

const PERMIT_TYPES = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
} as const;

export interface PermitSignature {
	v: number;
	r: `0x${string}`;
	s: `0x${string}`;
	deadline: bigint;
}

export function usePermitSignature() {
	const { wallet } = useActiveWallet();

	const signPermit = useCallback(
		async (
			spender: Address,
			value: bigint,
			deadlineMinutes = 5,
		): Promise<PermitSignature> => {
			if (!wallet?.account) throw new Error("Wallet not connected");
			if (!addresses) throw new Error("Contract addresses not configured");

			const owner = wallet.account.address;
			const deadline = BigInt(
				Math.floor(Date.now() / 1000) + deadlineMinutes * 60,
			);

			const nonce = await publicClient.readContract({
				address: addresses.forToken,
				abi: forTokenAbi,
				functionName: "nonces",
				args: [owner],
			});

			const domain = {
				name: TOKEN_NAME,
				version: TOKEN_VERSION,
				chainId: BigInt(currentChain.id),
				verifyingContract: addresses.forToken,
			};

			const message = {
				owner,
				spender,
				value,
				nonce,
				deadline,
			};

			const signature = await wallet.signTypedData({
				account: wallet.account,
				domain,
				types: PERMIT_TYPES,
				primaryType: "Permit",
				message,
			});

			const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
			const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
			const v = Number.parseInt(signature.slice(130, 132), 16);

			return { v, r, s, deadline };
		},
		[wallet],
	);

	return { signPermit, isReady: !!wallet?.account && !!addresses };
}
