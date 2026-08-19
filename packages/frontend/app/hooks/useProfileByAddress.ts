import { useQuery } from "@tanstack/react-query";
import type { NameProfile } from "~/lib/namespace.server";

interface ProfileResponse {
  profile: NameProfile | null;
}

/** プロフィールキャッシュの queryKey。invalidate 時にもこれを使う */
export function profileQueryKey(address: string | undefined | null) {
  return ["ensProfile", address?.toLowerCase()] as const;
}

export function useProfileByAddress(address: string | undefined | null) {
  return useQuery({
    queryKey: profileQueryKey(address),
    queryFn: async (): Promise<NameProfile | null> => {
      const res = await fetch(`/api/profile/${address}`);
      if (!res.ok) return null;
      const data = (await res.json()) as ProfileResponse;
      return data.profile;
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}
