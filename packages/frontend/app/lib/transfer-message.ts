export interface TransferMessagePayload {
  usecase: string | null;
  memo: string;
}

/**
 * 送金時にオンチェーンへ乗せる message を構築する。
 * usecase / memo のいずれかがあれば JSON、両方空なら空文字。
 */
export function buildMessagePayload(payload: {
  usecase: string | null;
  memo: string;
}): string {
  const usecase = payload.usecase?.trim() || null;
  const memo = payload.memo?.trim() ?? "";
  if (!usecase && !memo) return "";

  const obj: { usecase?: string; memo?: string } = {};
  if (usecase) obj.usecase = usecase;
  if (memo) obj.memo = memo;
  return JSON.stringify(obj);
}

/**
 * subgraph から取れた message 文字列をパースする。
 * JSON でない場合は memo として扱い (後方互換)、両方空なら null を返す。
 */
export function parseMessagePayload(
  raw: string | null | undefined,
): TransferMessagePayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const usecase =
        typeof parsed.usecase === "string" && parsed.usecase.trim() !== ""
          ? parsed.usecase
          : null;
      const memo =
        typeof parsed.memo === "string" ? parsed.memo : "";
      if (!usecase && !memo) return null;
      return { usecase, memo };
    }
  } catch {
    // JSON ではない旧フォーマット
  }

  return { usecase: null, memo: raw };
}
