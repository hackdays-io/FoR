import type { Chain } from "viem";

import { currentChain } from "./viem";

function explorerBaseUrl(chain: Chain): string | null {
  return chain.blockExplorers?.default.url ?? null;
}

export function getExplorerTxUrl(
  txHash: string | null | undefined,
  chain: Chain = currentChain,
): string | null {
  if (!txHash) return null;
  const base = explorerBaseUrl(chain);
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
}

export function getExplorerAddressUrl(
  address: string | null | undefined,
  chain: Chain = currentChain,
): string | null {
  if (!address) return null;
  const base = explorerBaseUrl(chain);
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/address/${address}`;
}

export function getExplorerName(chain: Chain = currentChain): string {
  return chain.blockExplorers?.default.name ?? "Explorer";
}
