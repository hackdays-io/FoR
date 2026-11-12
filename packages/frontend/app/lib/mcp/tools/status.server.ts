import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { MCP_GET_INDEX_STATUS } from "~/graphql/mcp-queries";
import { routerAbi } from "~/lib/abis/routerAbi";
import { addresses } from "~/lib/contracts";
import { directoryStatus } from "~/lib/mcp/core/profiles.server";
import {
  getMcpSubgraphUrl,
  isSubgraphUrlOverridden,
  querySubgraph,
} from "~/lib/mcp/core/subgraph.server";
import { chainId, currentChain, publicClient } from "~/lib/viem";
import { toolResult } from "./result";

/** Router の分配比率は 10000 = 100% の bps で保持されている */
const BPS = 10000n;

/**
 * 分配比率。基金と burn は「受取額に対する上乗せ」なので、
 * 送金者の総支払額 = 受取額 ×（1 + fund + burn）になる。
 * 総額に対する取り分ではない点を取り違えやすいので percent_of_recipient と明示する。
 */
interface DistributionRatio {
  fund_percent_of_recipient: number;
  burn_percent_of_recipient: number;
  /** 受取額 1 に対して送金者が支払う総額 */
  total_multiplier: number;
  source: "contract" | "subgraph";
  updated_at: string | null;
}

function toPercent(bps: bigint): number {
  return Number((bps * 10000n) / BPS) / 100;
}

/**
 * 分配比率はコントラクトから読むのが正。
 * 初期比率は Router のデプロイ時に設定されており DistributionRatioUpdated が出ないため、
 * サブグラフの DistributionRatio エンティティは（比率変更が一度も無ければ）空になる。
 */
async function readRatioFromContract(): Promise<DistributionRatio | null> {
  if (!addresses) return null;

  try {
    const [fundRatio, burnRatio] = await Promise.all([
      publicClient.readContract({
        address: addresses.router,
        abi: routerAbi,
        functionName: "fundRatio",
      }),
      publicClient.readContract({
        address: addresses.router,
        abi: routerAbi,
        functionName: "burnRatio",
      }),
    ]);

    return {
      fund_percent_of_recipient: toPercent(fundRatio),
      burn_percent_of_recipient: toPercent(burnRatio),
      total_multiplier: Number(BPS + fundRatio + burnRatio) / Number(BPS),
      source: "contract",
      updated_at: null,
    };
  } catch (error) {
    console.error("[mcp] failed to read distribution ratio", error);
    return null;
  }
}

export function registerStatusTools(server: McpServer): void {
  server.registerTool(
    "get_index_status",
    {
      title: "インデックスの状態",
      description: [
        "サブグラフがどのブロックまで取り込めているか、現在の分配比率、対象チェーンとコントラクトを返す。",
        "取引データが古くないかを判断したいときに使う。",
      ].join("\n"),
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => {
      const [result, contractRatio] = await Promise.all([
        querySubgraph(MCP_GET_INDEX_STATUS, {}),
        readRatioFromContract(),
      ]);

      const meta = result._meta;
      const indexedAt = meta?.block.timestamp ?? null;
      const lagSeconds =
        indexedAt === null
          ? null
          : Math.max(0, Math.floor(Date.now() / 1000) - indexedAt);

      // 比率変更が記録されていればそちらの方が「いつ変わったか」まで分かる
      const logged = result.distributionRatios[0];
      const ratio: DistributionRatio | null =
        contractRatio ??
        (logged
          ? {
              fund_percent_of_recipient: toPercent(BigInt(logged.fundRatio)),
              burn_percent_of_recipient: toPercent(BigInt(logged.burnRatio)),
              total_multiplier:
                Number(
                  BPS + BigInt(logged.fundRatio) + BigInt(logged.burnRatio),
                ) / Number(BPS),
              source: "subgraph",
              updated_at: new Date(
                Number(logged.timestamp) * 1000,
              ).toISOString(),
            }
          : null);

      if (ratio && logged && ratio.source === "contract") {
        ratio.updated_at = new Date(
          Number(logged.timestamp) * 1000,
        ).toISOString();
      }

      const structured = {
        chain: { id: chainId, name: currentChain.name },
        contracts: {
          for_token: addresses?.forToken ?? null,
          router: addresses?.router ?? null,
        },
        subgraph: {
          url: getMcpSubgraphUrl(),
          // チェーン・コントラクト・エクスプローラー URL はアプリのビルド設定に従うため、
          // 上書きした URL が別チェーンを指していると表示がずれる
          url_overridden: isSubgraphUrlOverridden(),
          indexed_block: meta?.block.number ?? null,
          indexed_at:
            indexedAt === null
              ? null
              : new Date(indexedAt * 1000).toISOString(),
          lag_seconds: lagSeconds,
          has_indexing_errors: meta?.hasIndexingErrors ?? null,
        },
        // fund / burn は受取額に「上乗せ」される分（total = recipient + fund + burn）
        distribution_ratio: ratio,
        profile_directory: directoryStatus(),
      };

      const lines = [
        `チェーン: ${currentChain.name} (${chainId})`,
        `インデックス済みブロック: ${structured.subgraph.indexed_block ?? "不明"}（${
          lagSeconds === null ? "遅延不明" : `約 ${lagSeconds} 秒前`
        }）`,
        `インデックスエラー: ${meta?.hasIndexingErrors ? "あり" : "なし"}`,
        ratio
          ? `分配比率: 受取額に対して 基金 ${ratio.fund_percent_of_recipient}% / burn ${ratio.burn_percent_of_recipient}% を上乗せ（受取額 100 FoR なら送金者の支払いは ${Math.round(100 * ratio.total_multiplier * 100) / 100} FoR）`
          : "分配比率: 取得できませんでした",
      ];

      if (isSubgraphUrlOverridden()) {
        lines.push(
          "注意: サブグラフ URL が MCP_SUBGRAPH_URL で上書きされています。チェーン名・コントラクト・エクスプローラー URL はアプリのビルド設定に従うため、別チェーンを指している場合は表示が一致しません。",
        );
      }

      return toolResult(lines, structured);
    },
  );
}
