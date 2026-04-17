import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import { formatUnits } from "viem";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { TextField } from "~/components/ui/text-field";
import { Typography } from "~/components/ui/typography";
import { useTransfers } from "~/hooks/useTransfers";
import { searchNames, type NameStoneProfile } from "~/lib/namestone.server";
import { formatTimestamp, shortenAddress } from "~/lib/utils";
import type { Route } from "./+types/transactions";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "送る・受け取る | FoR" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length === 0) {
    return { results: null };
  }

  try {
    const results = await searchNames(query);
    return { results };
  } catch {
    return { results: [] };
  }
}

export default function Transactions() {
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof loader>();
  const [query, setQuery] = useState("");
  const { data: transfers, isLoading: isTransfersLoading } = useTransfers(20);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSearching = query.length > 0;
  const searchResults = fetcher.data?.results;

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value) return;

      debounceRef.current = setTimeout(() => {
        fetcher.load(`/transactions?q=${encodeURIComponent(value)}`);
      }, 300);
    },
    [fetcher],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>送る・受け取る</AppBarTitle>
        </AppBarItem>
      </AppBar>

      {/* Search */}
      <div className="px-20 pt-16">
        <TextField
          placeholder="名前・ID・アドレス"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          leadingAdornment={<Search size={20} />}
        />
      </div>

      <div className="px-20 pt-20">
        {isSearching ? (
          /* Search Results */
          <div>
            <SectionTitle>検索結果</SectionTitle>
            <div className="mt-8">
              {fetcher.state === "loading" ? (
                <Typography variant="ui-13" className="py-12 text-text-hint">検索中...</Typography>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((profile: NameStoneProfile, i: number) => (
                  <ListRow
                    key={profile.name}
                    name={profile.text_records?.display || profile.name}
                    divider={i < searchResults.length - 1}
                    avatarSrc={profile.text_records?.avatar}
                    onClick={() => navigate(`/transactions/${profile.address}`)}
                    className="cursor-pointer"
                  />
                ))
              ) : searchResults ? (
                <Typography variant="ui-13" className="py-12 text-text-hint">
                  該当するユーザーが見つかりません
                </Typography>
              ) : null}
            </div>
          </div>
        ) : (
          /* Transaction History */
          <div>
            <SectionTitle>履歴</SectionTitle>
            <div className="mt-8">
              {isTransfersLoading ? (
                <Typography variant="ui-13" className="py-12 text-text-hint">読み込み中...</Typography>
              ) : !transfers || transfers.length === 0 ? (
                <Typography variant="ui-13" className="py-12 text-text-hint">取引履歴がありません</Typography>
              ) : (
                transfers.map((tx, i) => (
                  <ListRow
                    key={tx.id}
                    name={shortenAddress(tx.from.id)}
                    date={formatTimestamp(tx.timestamp)}
                    amount={Number(formatUnits(BigInt(tx.totalAmount), 18))}
                    divider={i < transfers.length - 1}
                    onClick={() => navigate(`/transactions/${tx.transactionHash}`)}
                    className="cursor-pointer"
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
