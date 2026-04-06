import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { TextField } from "~/components/ui/text-field";
import { searchNames, type NameStoneProfile } from "~/lib/namestone.server";
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

// Dummy transaction data
const dummyTransactions = [
  { name: "りょうま", message: "草刈りありがとう！", date: "10/29 (水)", amount: 50, address: "0x1234567890abcdef1234567890abcdef12345678" },
  { name: "南部", message: "鹿肉をもらいました。", date: "10/29 (水)", amount: -50, address: "0x2234567890abcdef1234567890abcdef12345678" },
  { name: "たかこ", message: "草刈りありがとう！", date: "10/29 (水)", amount: -50, address: "0x3234567890abcdef1234567890abcdef12345678" },
  { name: "あさこ", message: "草刈りありがとう！", date: "10/29 (水)", amount: -50, address: "0x4234567890abcdef1234567890abcdef12345678" },
  { name: "西原", message: "草刈りありがとう！", date: "10/29 (水)", amount: 50, address: "0x5234567890abcdef1234567890abcdef12345678" },
  { name: "高橋", message: "草刈りありがとう！", date: "10/29 (水)", amount: 50, address: "0x6234567890abcdef1234567890abcdef12345678" },
];

export default function Transactions() {
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof loader>();
  const [query, setQuery] = useState("");
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
                <p className="py-12 text-ui-13 text-text-hint">検索中...</p>
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
                <p className="py-12 text-ui-13 text-text-hint">
                  該当するユーザーが見つかりません
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          /* Transaction History */
          <div>
            <SectionTitle>履歴</SectionTitle>
            <div className="mt-8">
              {dummyTransactions.map((tx, i) => (
                <ListRow
                  key={i}
                  name={tx.name}
                  message={tx.message}
                  date={tx.date}
                  amount={tx.amount}
                  divider={i < dummyTransactions.length - 1}
                  onClick={() => navigate(`/transactions/${tx.address}`)}
                  className="cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
