import { type Address, isAddress } from "viem";
import { chainId } from "./viem";

interface ContractAddresses {
  forToken: Address;
  router: Address;
}

const ADDRESSES: Record<number, ContractAddresses> = {
  // Hardhat local (chain 31337)
  31337: {
    forToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    router: "0x320fCda3FE9a5d6010e35242B550f8ef8b0748D2",
  },
  // Sepolia
  11155111: {
    forToken: "0xa747Df53d79805eB05Bc970729c5B61478173b3b",
    router: "0x4cd440C31a990185759499e6026EB5278D61cCB6",
  },
};

function pickAddress(
  envValue: unknown,
  fallback?: Address,
): Address | undefined {
  if (typeof envValue === "string" && isAddress(envValue)) {
    return envValue as Address;
  }
  return fallback;
}

function resolveAddresses(id: number): ContractAddresses | undefined {
  const fallback = ADDRESSES[id];
  const forToken = pickAddress(
    import.meta.env.VITE_FOR_TOKEN_ADDRESS,
    fallback?.forToken,
  );
  const router = pickAddress(
    import.meta.env.VITE_ROUTER_ADDRESS,
    fallback?.router,
  );
  if (!forToken || !router) return undefined;
  return { forToken, router };
}

export const addresses: ContractAddresses | undefined =
  resolveAddresses(chainId);
