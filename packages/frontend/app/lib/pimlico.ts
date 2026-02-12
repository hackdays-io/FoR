import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";

import { currentChain } from "./viem";

const pimlicoApiKey: string | undefined =
  import.meta.env.VITE_PIMLICO_API_KEY?.trim();

function buildPimlicoRpcUrl(chainId: number, apiKey: string): string {
  return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;
}

export const pimlicoConfigError: string | undefined = pimlicoApiKey
  ? undefined
  : "VITE_PIMLICO_API_KEY is not set. Pimlico bundler/paymaster is disabled.";

export const pimlicoUrl: string | undefined = pimlicoApiKey
  ? buildPimlicoRpcUrl(currentChain.id, pimlicoApiKey)
  : undefined;

export const pimlicoClient = pimlicoUrl
  ? createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
    })
  : undefined;
