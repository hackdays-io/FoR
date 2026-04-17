import { chainId } from "./viem";

const SUBGRAPH_URLS: Record<number, string> = {
  31337: "http://localhost:8000/subgraphs/name/for/localhost",
  11155111:
    "https://api.goldsky.com/api/public/project_cm5nv64onnxxz01wf8smdgk1e/subgraphs/for-sepolia/0.0.0/gn",
};

export const subgraphUrl: string | undefined =
  import.meta.env.VITE_SUBGRAPH_URL || SUBGRAPH_URLS[chainId];
