import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { LoadingScreen } from "./loading-screen";

// 認証無し (Privy)でも閲覧可能な規約系パス
const FULLY_PUBLIC_PATHS = new Set<string>(["/terms", "/privacy"]);
// profile チェックをスキップするパス（規約同意中 or プロフィール作成中）
// allowlist は判定しない。未登録でも使えるようにし、登録はホームのモーダルから
// Google フォームへ誘導して運営が行う（#185）。
const PROFILE_EXEMPT = new Set<string>([
  ...FULLY_PUBLIC_PATHS,
  "/welcome",
  "/profile/create",
]);

// authenticated だが接続ウォレットが無い状態が確定するまでの猶予時間
const NO_WALLET_LOGOUT_TIMEOUT_MS = 5000;

export function AuthGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ready, authenticated, logout } = usePrivy();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  // プロフィールは react-query でキャッシュ管理。ページ遷移ではキャッシュを即返しし、
  // 再取得が必要な場合も背景で実行される（画面をブランクにしない）。作成直後の反映は profile.create 側で
  // queryClient.invalidateQueries により行う。
  const { data: profile } = useProfileByAddress(address);

  const pathname = location.pathname;
  const isFullyPublic = FULLY_PUBLIC_PATHS.has(pathname);
  const requireProfile = !PROFILE_EXEMPT.has(pathname);

  // react-query の data は初回取得が完了するまで undefined
  const profileKnown = !!address && profile !== undefined;

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

  // プロフィール未作成なら、規約同意（/welcome）→ プロフィール作成の順に通す。
  // 規約同意の記録は持たず、プロフィールがあれば同意済みとみなす。
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (!profileKnown) return;

    if (requireProfile && !profile) {
      navigate("/welcome", { replace: true });
    }
  }, [ready, authenticated, profileKnown, requireProfile, profile, navigate]);

  if (!ready) return <LoadingScreen />;

  // 未ログインは home.tsx の LoginScreen に任せる
  if (!authenticated) return <Outlet />;

  // 規約・プライバシーは素通し
  if (isFullyPublic) return <Outlet />;

  if (isWalletLoading || !address) return <LoadingScreen />;
  if (!profileKnown) return <LoadingScreen />;

  // 遷移待ちの間もローディング
  if (requireProfile && !profile) return <LoadingScreen />;

  return <Outlet />;
}
