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
    forToken: "0x473beaaDFaA7c7DB856cb1D368a27a238819179A",
    router: "0x53ad3cD165Aff7aBEb6eE14Bd74c5C652eF06a77",
  },
};

export const addresses: ContractAddresses | undefined = ADDRESSES[chainId];
