import { ens_normalize } from "@adraffy/ens-normalize";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  redirect,
  useActionData,
  useFetcher,
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
import { TextArea } from "~/components/ui/text-area";
import { TextField } from "~/components/ui/text-field";
import { Typography } from "~/components/ui/typography";
import { useUploadImageFileToIpfs } from "~/hooks/useUploadImageFileToIpfs";
import {
  deleteName,
  getNamesByAddress,
  isNameAvailable,
  setName,
} from "~/lib/namespace.server";
import type { Route } from "./+types/profile.edit";
import type { loader as checkNameLoader } from "./api.profile.check";

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
  const name = (formData.get("name") as string)?.trim();
  const currentName = (formData.get("currentName") as string)?.trim();
  const address = formData.get("address") as string;
  const avatar = (formData.get("avatar") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "ユーザー名を入力してください";
  } else if (/\s/.test(name)) {
    errors.name = "ユーザー名にスペースは使えません";
  } else {
    try {
      ens_normalize(name);
    } catch {
      errors.name = "使用できない文字が含まれています";
    }
  }

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

  // ユーザー名が変更された場合のみ、使用可否を再チェックする
  const isRenaming = name !== currentName;
  if (isRenaming) {
    try {
      const available = await isNameAvailable(name);
      if (!available) {
        return { errors: { name: "このユーザー名は既に使用されています" } };
      }
    } catch {
      return { errors: { name: "ユーザー名の確認中にエラーが発生しました" } };
    }
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
    // 改名時は旧ユーザー名のレコードを削除する
    if (isRenaming && currentName) {
      await deleteName(currentName);
    }
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
  const fetcher = useFetcher<typeof checkNameLoader>();

  const {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading: isUploading,
    error: uploadError,
  } = useUploadImageFileToIpfs();

  const initialAvatar = profile.text_records?.avatar ?? "";
  const initialDescription = profile.text_records?.description ?? "";
  const [username, setUsername] = useState(profile.name);
  const [description, setDescription] = useState(initialDescription);
  const [clientError, setClientError] = useState<string | null>(null);
  // 送信後にフィールドを編集したかどうか。編集後は前回送信のサーバーエラーが
  // 古くなる（例: 3文字未満で送信 → エラー → 3文字以上入力しても消えず保存不可）ため無視する。
  const [editedSinceSubmit, setEditedSinceSubmit] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const displayAvatarSrc = previewUrl ?? initialAvatar ?? undefined;
  const isSubmitting = navigation.state !== "idle" || isUploading;
  // 送信後に編集したら、前回送信のサーバーエラーは古いので無視する
  // （例: 既に使用中エラー → 別名に変更しても保存ボタンが押せないのを防ぐ）
  const errors = editedSinceSubmit ? undefined : actionData?.errors;

  const validateAndCheckName = useCallback(
    (value: string) => {
      // 変更なし、または空はチェック不要
      if (value === profile.name || !value) {
        setClientError(null);
        return;
      }

      if (/\s/.test(value)) {
        setClientError("ユーザー名にスペースは使えません");
        return;
      }

      try {
        ens_normalize(value);
        setClientError(null);
      } catch {
        setClientError("使用できない文字が含まれています");
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetcher.load(
          `/api/profile/check?name=${encodeURIComponent(value)}&current=${encodeURIComponent(profile.name)}`,
        );
      }, 500);
    },
    [fetcher, profile.name],
  );

  const nameChanged = username !== profile.name;
  const availabilityData = fetcher.data;
  let nameHelperText: string | undefined;
  let nameErrorText = errors?.name ?? clientError ?? undefined;

  if (!nameErrorText && nameChanged && availabilityData) {
    if (availabilityData.available === true) {
      nameHelperText = "このユーザー名は使用できます";
    } else if (availabilityData.available === false) {
      nameErrorText = "このユーザー名は既に使用されています";
    }
  }

  if (fetcher.state === "loading" && nameChanged) {
    nameHelperText = "確認中...";
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!username) return;
      // 送信するので、これ以降に来るサーバーエラーは有効なものとして扱う
      setEditedSinceSubmit(false);

      let avatarUri = initialAvatar;
      if (imageFile) {
        const res = await uploadImageFileToIpfs();
        if (!res) return;
        avatarUri = res.ipfsUri;
      }

      const formData = new FormData();
      formData.set("name", username);
      formData.set("currentName", profile.name);
      formData.set("address", profile.address);
      formData.set("description", description);
      if (avatarUri) formData.set("avatar", avatarUri);

      submit(formData, { method: "post" });
    },
    [
      username,
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
    <div className="flex min-h-dvh flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール編集</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center gap-24 px-20">
          <div className="py-40">
            <AvatarUpload
              src={displayAvatarSrc}
              alt="プロフィール画像"
              onFileSelect={setImageFile}
              disabled={isSubmitting}
            />
          </div>

          {uploadError && (
            <Typography variant="ui-13" className="text-text-danger-default">
              画像のアップロードに失敗しました
            </Typography>
          )}

          <TextField
            name="name"
            label="ユーザー名"
            placeholder="username"
            value={username}
            onChange={(e) => {
              const v = e.target.value;
              setUsername(v);
              setEditedSinceSubmit(true);
              validateAndCheckName(v);
            }}
            errorText={nameErrorText}
            helperText={nameHelperText}
            required
          />

          <TextArea
            name="description"
            label="自己紹介"
            placeholder="自己紹介を入力"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setEditedSinceSubmit(true);
            }}
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
        </div>

        <div className="sticky bottom-0 flex justify-center bg-bg-default px-20 py-16">
          <Button
            type="submit"
            disabled={isSubmitting || !username || Boolean(nameErrorText)}
            className="w-full"
          >
            {isUploading
              ? "画像アップロード中..."
              : navigation.state !== "idle"
                ? "保存中..."
                : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
