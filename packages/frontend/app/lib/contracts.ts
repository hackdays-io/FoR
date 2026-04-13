import type { Address } from "viem";
import { chainId } from "./viem";

interface ContractAddresses {
  forToken: Address;
  router: Address;
}

const ADDRESSES: Record<number, ContractAddresses> = {
  // Hardhat local (chain 31337)
  31337: {
    forToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    router: "0x3855b44011B599c506B464a7d91629A11AB930aA",
  },
  // Sepolia
  11155111: {
    forToken: "0xa747Df53d79805eB05Bc970729c5B61478173b3b",
    router: "0x4cd440C31a990185759499e6026EB5278D61cCB6",
  },
};

export const addresses: ContractAddresses | undefined = ADDRESSES[chainId];
