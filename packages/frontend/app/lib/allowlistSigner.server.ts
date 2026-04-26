import type { Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { forTokenAbi } from "./abis/forTokenAbi";
import { addresses } from "./contracts";
import { chainId, publicClient } from "./viem";

const TOKEN_VERSION = "1";
const DEFAULT_DEADLINE_SECONDS = 15 * 60;

let cachedTokenName: string | undefined;

async function getTokenName(): Promise<string> {
  if (cachedTokenName) return cachedTokenName;
  if (!addresses) throw new Error("Contract addresses not configured");
  const name = await publicClient.readContract({
    address: addresses.forToken,
    abi: forTokenAbi,
    functionName: "name",
  });
  cachedTokenName = name;
  return name;
}

export interface AllowListSignature {
  deadline: string;
  signature: `0x${string}`;
}

export async function signAllowListAddition(
  account: Address,
): Promise<AllowListSignature> {
  const pk = process.env.ADMIN_PRIVATE_KEY;
  if (!pk) throw new Error("ADMIN_PRIVATE_KEY is not set");
  if (!addresses) throw new Error("Contract addresses not configured");

  const privateKey = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  const signer = privateKeyToAccount(privateKey);

  const tokenName = await getTokenName();

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS,
  );

  const signature = await signer.signTypedData({
    domain: {
      name: tokenName,
      version: TOKEN_VERSION,
      chainId,
      verifyingContract: addresses.forToken,
    },
    types: {
      AddToAllowList: [
        { name: "account", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "AddToAllowList",
    message: { account, deadline },
  });

  return { deadline: deadline.toString(), signature };
}
