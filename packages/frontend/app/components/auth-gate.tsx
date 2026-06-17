import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useIsAllowListed } from "~/hooks/useAllowList";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { LoadingScreen } from "./loading-screen";

// 認証無し (Privy)でも閲覧可能な規約系パス
const FULLY_PUBLIC_PATHS = new Set<string>(["/terms", "/privacy"]);
// allowlist チェックをスキップするパス（本人が registration 中 or 規約閲覧中）
const ALLOWLIST_EXEMPT = new Set<string>([...FULLY_PUBLIC_PATHS, "/welcome"]);
// profile チェックをスキップするパス（本人が作成中 or allowlist 登録中）
const PROFILE_EXEMPT = new Set<string>([
  ...ALLOWLIST_EXEMPT,
  "/profile/create",
]);

// authenticated だが接続ウォレットが無い状態が確定するまでの猶予時間
const NO_WALLET_LOGOUT_TIMEOUT_MS = 5000;

export function AuthGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ready, authenticated, logout } = usePrivy();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: isListed } = useIsAllowListed(address);
  // プロフィールは react-query でキャッシュ管理。allowlist チェックと同じ仕組みで、
  // ページ遷移ではキャッシュを即返しし、再取得が必要な場合も背景で実行される
  // （画面をブランクにしない）。作成直後の反映は profile.create 側で
  // queryClient.invalidateQueries により行う。
  const { data: profile } = useProfileByAddress(address);

  const pathname = location.pathname;
  const isFullyPublic = FULLY_PUBLIC_PATHS.has(pathname);
  const requireAllowlist = !ALLOWLIST_EXEMPT.has(pathname);
  const requireProfile = !PROFILE_EXEMPT.has(pathname);

  const allowlistKnown = !!address && typeof isListed === "boolean";
  // react-query の data は初回取得が完了するまで undefined
  const profileKnown = !!address && profile !== undefined;
  const bothResolved = allowlistKnown && profileKnown;

  // authenticated だが接続ウォレットが無い（MetaMask 切断後などで Privy
  // セッションだけ残った）状態では address が永久に null のままになり、
  // 下の `isWalletLoading || !address` で読み込み中から抜け出せなくなる。
  // ウォレット初期化が落ち着いても（!isWalletLoading）address が来なければ
  // 自動ログアウトして LoginScreen へ戻す。logout は再レンダリングごとに
  // 識別子が変わりうるため依存に入れず ref 経由で呼ぶ。
  const noWalletStuck =
    ready && authenticated && !isFullyPublic && !isWalletLoading && !address;
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    if (!noWalletStuck) return;
    const timer = setTimeout(() => {
      void logoutRef.current();
    }, NO_WALLET_LOGOUT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [noWalletStuck]);

  // 両方解決してから allowlist → profile の順に遷移
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!bothResolved) return;

    if (requireAllowlist && isListed === false) {
      navigate("/welcome", { replace: true });
      return;
    }
    if (requireProfile && !profile) {
      navigate("/profile/create", { replace: true });
    }
  }, [
    ready,
    authenticated,
    bothResolved,
    requireAllowlist,
    requireProfile,
    isListed,
    profile,
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
  if (requireProfile && !profile) return <LoadingScreen />;

  return <Outlet />;
}
