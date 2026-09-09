import { mcpHandler } from "~/lib/mcp/server.server";
import type { Route } from "./+types/api.mcp";

/**
 * MCP (Model Context Protocol) エンドポイント。
 *
 * mcp-handler は Web 標準の (Request) => Response をそのまま返すので、
 * ルーティングは React Router に任せてここでは受け渡すだけにしている。
 * GET は Streamable HTTP のストリーム取得、POST が実際の JSON-RPC。
 */
export function loader({ request }: Route.LoaderArgs) {
  return mcpHandler(request);
}

export function action({ request }: Route.ActionArgs) {
  return mcpHandler(request);
}
