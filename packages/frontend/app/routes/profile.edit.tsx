import { useCallback, useEffect, useState } from "react";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
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
import { Typography } from "~/components/ui/typography";
import { useUploadImageFileToIpfs } from "~/hooks/useUploadImageFileToIpfs";
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
  const description = (formData.get("description") as string)?.trim();

  const errors: Record<string, string> = {};

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    errors.address = "ウォレットが接続されていません";
  }

  if (
    avatar &&
    !avatar.startsWith("ipfs://") &&
    !avatar.startsWith("https://")
  ) {
    errors.avatar = "プロフィール画像のURLが不正です";
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
  const submit = useSubmit();

  const {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading: isUploading,
    error: uploadError,
  } = useUploadImageFileToIpfs();

  const initialAvatar = profile.text_records?.avatar ?? "";
  const initialDescription = profile.text_records?.description ?? "";
  const [description, setDescription] = useState(initialDescription);

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayAvatarSrc = previewUrl ?? initialAvatar ?? undefined;
  const isSubmitting = navigation.state !== "idle" || isUploading;
  const errors = actionData?.errors;

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      let avatarUri = initialAvatar;
      if (imageFile) {
        const res = await uploadImageFileToIpfs();
        if (!res) return;
        avatarUri = res.ipfsUri;
      }

      const formData = new FormData();
      formData.set("name", profile.name);
      formData.set("address", profile.address);
      formData.set("description", description);
      if (avatarUri) formData.set("avatar", avatarUri);

      submit(formData, { method: "post" });
    },
    [
      profile.name,
      profile.address,
      description,
      imageFile,
      initialAvatar,
      uploadImageFileToIpfs,
      submit,
    ],
  );

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

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-24 px-20 py-24"
      >
        <AvatarUpload
          src={displayAvatarSrc}
          alt="プロフィール画像"
          onFileSelect={setImageFile}
          disabled={isSubmitting}
        />

        {uploadError && (
          <Typography variant="ui-13" className="text-text-danger-default">
            画像のアップロードに失敗しました
          </Typography>
        )}

        <TextField label="ユーザー名" value={profile.name} readOnly />

        <TextField
          name="description"
          label="自己紹介"
          placeholder="自己紹介を入力"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          errorText={errors?.description}
        />

        {errors?.address && (
          <Typography variant="ui-13" className="text-text-danger-default">
            {errors.address}
          </Typography>
        )}

        {errors?.avatar && (
          <Typography variant="ui-13" className="text-text-danger-default">
            {errors.avatar}
          </Typography>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isUploading
            ? "画像アップロード中..."
            : navigation.state !== "idle"
              ? "保存中..."
              : "保存"}
        </Button>
      </form>
    </div>
  );
}
