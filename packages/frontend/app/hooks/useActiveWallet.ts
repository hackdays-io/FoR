import { useContext } from "react";

import {
  ActiveWalletContext,
  type ActiveWalletContextValue,
  type WalletType,
} from "~/providers/ActiveWalletProvider";

export type { WalletType };

export function useActiveWallet(): ActiveWalletContextValue {
  const ctx = useContext(ActiveWalletContext);
  if (!ctx) {
    throw new Error(
      "useActiveWallet must be used within ActiveWalletProvider",
    );
  }
  return ctx;
}
