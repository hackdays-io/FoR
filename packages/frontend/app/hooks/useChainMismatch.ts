import { useState } from "react";

import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useWallet } from "~/hooks/useWallet";
import { currentChain } from "~/lib/viem";

interface ChainMismatchResult {
  /** Smart Account / Embedded wallet では常に false。外部ウォレットで想定チェーン外のとき true */
  isMismatched: boolean;
  /** 外部ウォレットの現在チェーンID。embedded wallet または未接続時は null */
  walletChainId: number | null;
  /** アプリが想定しているチェーンID（VITE_CHAIN_ID） */
  expectedChainId: number;
  /** 想定チェーンの表示名 */
  expectedChainName: string;
  /** 切替リクエスト中かどうか */
  isSwitching: boolean;
  /** 直近の switch 失敗エラー */
  switchError: string | null;
  /** 想定チェーンへ切替を要求する */
  switchToExpected: () => Promise<void>;
}

export function useChainMismatch(): ChainMismatchResult {
  const { isSmartWallet, isConnectingEmbeddedWallet } = useActiveWallet();
  const { chainId, switchChain, connectedWallet } = useWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const expectedChainId = currentChain.id;
  const expectedChainName = currentChain.name;

  // Smart Account / Embedded wallet は Privy の defaultChain に固定されているため検出しない
  const usesEmbedded = isSmartWallet || isConnectingEmbeddedWallet;
  const hasExternalWallet = !!connectedWallet && !usesEmbedded;
  const isMismatched =
    hasExternalWallet && chainId !== null && chainId !== expectedChainId;

  const switchToExpected = async (): Promise<void> => {
    setSwitchError(null);
    setIsSwitching(true);
    try {
      await switchChain(expectedChainId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "チェーンの切替に失敗しました";
      setSwitchError(message);
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    isMismatched,
    walletChainId: hasExternalWallet ? chainId : null,
    expectedChainId,
    expectedChainName,
    isSwitching,
    switchError,
    switchToExpected,
  };
}
