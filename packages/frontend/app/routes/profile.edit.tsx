import { useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { AvatarUpload } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { getNamesByAddress, setName } from "~/lib/namestone.server";
import type { Route } from "./+types/profile.edit";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロフィール編集 | FoR" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return redirect("/profile/create");
  }

  try {
    const profiles = await getNamesByAddress(address);
    if (profiles.length === 0) {
      return redirect("/profile/create");
    }
    return { profile: profiles[0] };
  } catch {
    return redirect("/profile/create");
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const avatar = (formData.get("avatar") as string)?.trim();
  const display = (formData.get("display") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  const errors: Record<string, string> = {};

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    errors.address = "ウォレットが接続されていません";
  }

  if (avatar && !avatar.startsWith("https://")) {
    errors.avatar = "URLはhttps://で始めてください";
  }

  if (display && display.length > 50) {
    errors.display = "ニックネームは50文字以内にしてください";
  }

  if (description && description.length > 200) {
    errors.description = "自己紹介は200文字以内にしてください";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await setName({
      name,
      address,
      textRecords: {
        avatar: avatar || undefined,
        display: display || undefined,
        description: description || undefined,
      },
    });
  } catch {
    return { errors: { description: "プロフィールの更新に失敗しました" } };
  }

  return redirect("/mypage");
}

export default function ProfileEdit() {
  const { profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState(
    profile.text_records?.avatar ?? "",
  );

  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール編集</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <Form method="post" className="flex flex-col items-center gap-24 px-20 py-24">
        <input type="hidden" name="name" value={profile.name} />
        <input type="hidden" name="address" value={profile.address} />

        {/* Avatar */}
        <AvatarUpload src={avatarUrl || undefined} alt="プロフィール画像" />

        <TextField
          name="avatar"
          label="プロフィール画像URL"
          placeholder="https://..."
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          errorText={errors?.avatar}
        />

        {/* Username (read-only) */}
        <TextField
          label="ユーザー名"
          value={profile.name}
          readOnly
        />

        {/* Display name */}
        <TextField
          name="display"
          label="ニックネーム"
          placeholder="表示名"
          defaultValue={profile.text_records?.display ?? ""}
          errorText={errors?.display}
        />

        {/* Bio */}
        <TextField
          name="description"
          label="自己紹介"
          placeholder="自己紹介を入力"
          defaultValue={profile.text_records?.description ?? ""}
          errorText={errors?.description}
        />

        {errors?.address && (
          <p className="text-ui-13 text-text-danger-default">
            {errors.address}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </Form>
    </div>
  );
}
