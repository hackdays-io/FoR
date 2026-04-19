import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { Outlet, useFetcher, useLocation, useNavigate } from "react-router";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useIsAllowListed } from "~/hooks/useAllowList";
import type { NameStoneProfile } from "~/lib/namestone.server";
import { LoadingScreen } from "./loading-screen";

// 認証無し (Privy)でも閲覧可能な規約系パス
const FULLY_PUBLIC_PATHS = new Set<string>(["/terms", "/privacy"]);
// allowlist チェックをスキップするパス（本人が registration 中 or 規約閲覧中）
const ALLOWLIST_EXEMPT = new Set<string>([
  ...FULLY_PUBLIC_PATHS,
  "/welcome",
]);
// profile チェックをスキップするパス（本人が作成中 or allowlist 登録中）
const PROFILE_EXEMPT = new Set<string>([
  ...ALLOWLIST_EXEMPT,
  "/profile/create",
]);

export function AuthGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: isListed } = useIsAllowListed(address);
  const profileFetcher = useFetcher<{ profile: NameStoneProfile | null }>();

  const pathname = location.pathname;
  const isFullyPublic = FULLY_PUBLIC_PATHS.has(pathname);
  const requireAllowlist = !ALLOWLIST_EXEMPT.has(pathname);
  const requireProfile = !PROFILE_EXEMPT.has(pathname);

  // パスかアドレスが変わるたびにプロフィールを再取得（作成後の反映を保証）
  const lastLoadKey = useRef("");
  useEffect(() => {
    if (!address) return;
    const key = `${address}:${pathname}`;
    if (lastLoadKey.current === key) return;
    if (profileFetcher.state !== "idle") return;
    lastLoadKey.current = key;
    profileFetcher.load(`/api/profile/${address}`);
  }, [address, pathname, profileFetcher]);

  const allowlistKnown = !!address && typeof isListed === "boolean";
  const profileKnown =
    !!address &&
    profileFetcher.data !== undefined &&
    profileFetcher.state === "idle";
  const bothResolved = allowlistKnown && profileKnown;

  // 両方解決してから allowlist → profile の順に遷移
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!bothResolved) return;

    if (requireAllowlist && isListed === false) {
      navigate("/welcome", { replace: true });
      return;
    }
    if (requireProfile && !profileFetcher.data?.profile) {
      navigate("/profile/create", { replace: true });
    }
  }, [
    ready,
    authenticated,
    bothResolved,
    requireAllowlist,
    requireProfile,
    isListed,
    profileFetcher.data,
    navigate,
  ]);

  if (!ready) return <LoadingScreen />;

  // 未ログインは home.tsx の LoginScreen に任せる
  if (!authenticated) return <Outlet />;

  // 規約・プライバシーは素通し
  if (isFullyPublic) return <Outlet />;

  if (isWalletLoading || !address) return <LoadingScreen />;
  if (!bothResolved) return <LoadingScreen />;

  // 遷移待ちの間もローディング
  if (requireAllowlist && isListed !== true) return <LoadingScreen />;
  if (requireProfile && !profileFetcher.data?.profile) return <LoadingScreen />;

  return <Outlet />;
}
