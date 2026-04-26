import { useQuery } from "@tanstack/react-query";
import type { NameStoneProfile } from "~/lib/namestone.server";

interface ProfileResponse {
  profile: NameStoneProfile | null;
}

export function useProfileByAddress(address: string | undefined | null) {
  return useQuery({
    queryKey: ["namestoneProfile", address?.toLowerCase()],
    queryFn: async (): Promise<NameStoneProfile | null> => {
      const res = await fetch(`/api/profile/${address}`);
      if (!res.ok) return null;
      const data = (await res.json()) as ProfileResponse;
      return data.profile;
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}
