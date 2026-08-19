import { data } from "react-router";
import { getNamesByAddress } from "~/lib/namespace.server";
import type { Route } from "./+types/api.profile.$address";

export async function loader({ params }: Route.LoaderArgs) {
  const { address } = params;

  try {
    const profiles = await getNamesByAddress(address);
    const profile = profiles.length > 0 ? profiles[0] : null;
    return data({ profile });
  } catch {
    return data({ profile: null }, { status: 500 });
  }
}
