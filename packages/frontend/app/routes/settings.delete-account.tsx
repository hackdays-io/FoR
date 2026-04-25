import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import {
  deleteName,
  getNamesByAddress,
  type NameStoneProfile,
} from "~/lib/namestone.server";
import type { Route } from "./+types/settings.delete-account";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アカウント削除 | FoR" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  if (!address) {
    return redirect("/mypage");
  }
  try {
    const profiles = await getNamesByAddress(address);
    const profile = profiles[0] ?? null;
    return { profile, address };
  } catch {
    return { profile: null as NameStoneProfile | null, address };
  }
}

interface ActionData {
  success?: boolean;
  error?: string;
}

export async function action({
  request,
}: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { error: "プロフィール名がありません" };
  }
  try {
    await deleteName(name);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました";
    return { error: message };
  }
}

export default function SettingsDeleteAccount() {
  const navigate = useNavigate();
  const { profile, address } = useLoaderData<typeof loader>();
  const { logout } = usePrivy();
  const fetcher = useFetcher<ActionData>();

  const [confirmed, setConfirmed] = useState(false);
  const isDeleting = fetcher.state !== "idle";
  const deleteSuccess = fetcher.data?.success === true;
  const deleteError = fetcher.data?.error;

  // 削除成功 → ログアウト → ホームへ
  useEffect(() => {
    if (!deleteSuccess) return;
    let cancelled = false;
    void (async () => {
      try {
        await logout();
      } finally {
        if (!cancelled) navigate("/", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deleteSuccess, logout, navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.name || !confirmed || isDeleting) return;
    const formData = new FormData();
    formData.set("name", profile.name);
    fetcher.submit(formData, {
      method: "post",
      action: `/settings/delete-account?address=${encodeURIComponent(address)}`,
    });
  };

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>アカウント削除</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col gap-24 px-20 py-24">
        <Typography variant="ui-16" weight="bold">
          アカウントの削除について
        </Typography>

        <div className="flex flex-col gap-12 rounded-lg bg-background p-16">
          <Typography variant="ui-13" weight="bold">
            削除されるもの
          </Typography>
          <ul className="ml-16 list-disc text-ui-13 text-text-default">
            <li>プロフィール（名前・アイコン・自己紹介）</li>
            <li>NameStone 上のドメイン登録</li>
          </ul>

          <Typography variant="ui-13" weight="bold" className="pt-8">
            削除されないもの（重要）
          </Typography>
          <ul className="ml-16 list-disc text-ui-13 text-text-default">
            <li>
              ブロックチェーンに記録された送受信履歴・金額・タイムスタンプ
            </li>
            <li>
              受取人としてオンチェーンに記録された相手側のトランザクション
            </li>
          </ul>
          <Typography variant="ui-13" className="text-text-subtle">
            これらはブロックチェーンの性質上、削除できません。アカウントを削除しても、過去の取引はチェーン上に残り続けます。
          </Typography>
        </div>

        {!profile ? (
          <Typography variant="ui-13" className="text-text-hint">
            プロフィールが見つかりませんでした。
          </Typography>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-16 rounded-lg bg-background p-16"
          >
            <Typography variant="ui-13" className="text-text-default">
              削除対象:{" "}
              <strong>
                {profile.name}.{profile.domain}
              </strong>
            </Typography>

            <label className="flex items-start gap-8 text-ui-13 text-text-default">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-4 size-16"
              />
              <span>
                上記の内容を理解し、アカウントを削除することに同意します。
              </span>
            </label>

            {deleteError ? (
              <Typography variant="ui-13" className="text-text-danger-default">
                削除に失敗しました: {deleteError}
              </Typography>
            ) : null}

            <Button
              type="submit"
              variant="destructive"
              disabled={!confirmed || isDeleting || deleteSuccess}
              className="w-full"
            >
              {deleteSuccess
                ? "削除しました"
                : isDeleting
                  ? "削除中..."
                  : "アカウントを削除する"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate(-1)}
              disabled={isDeleting || deleteSuccess}
            >
              キャンセル
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
