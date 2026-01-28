import { type Chain, createPublicClient, fallback, http } from "viem";
import { base, mainnet, optimism, sepolia } from "viem/chains";

const CHAIN_MAP: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [optimism.id]: optimism,
  [base.id]: base,
  [sepolia.id]: sepolia,
};

const ALCHEMY_RPC_HOSTS: Record<number, string> = {
  [mainnet.id]: "eth-mainnet",
  [optimism.id]: "opt-mainnet",
  [base.id]: "base-mainnet",
  [sepolia.id]: "eth-sepolia",
};

function buildAlchemyRpcUrl(id: number, apiKey: string): string {
  const host = ALCHEMY_RPC_HOSTS[id] ?? ALCHEMY_RPC_HOSTS[sepolia.id];
  return `https://${host}.g.alchemy.com/v2/${apiKey}`;
}

export const chainId: number =
  Number(import.meta.env.VITE_CHAIN_ID) || sepolia.id;

export const currentChain: Chain = CHAIN_MAP[chainId] ?? sepolia;

const alchemyKey: string | undefined = import.meta.env.VITE_ALCHEMY_KEY;

const alchemyTransports = alchemyKey
  ? [http(buildAlchemyRpcUrl(chainId, alchemyKey))]
  : [];

export const publicClient = createPublicClient({
  chain: currentChain,
  transport: fallback([http(), ...alchemyTransports]),
});
