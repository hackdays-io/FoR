import { data } from "react-router";
import { type Address, isAddress } from "viem";
import { signAllowListAddition } from "~/lib/allowlistSigner.server";
import type { Route } from "./+types/api.allowlist.sign";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return data({ error: "Invalid JSON body" }, { status: 400 });
  }

  const account = (body as { account?: unknown } | null)?.account;
  if (typeof account !== "string" || !isAddress(account)) {
    return data({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const result = await signAllowListAddition(account as Address);
    return data(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign";
    return data({ error: message }, { status: 500 });
  }
}
