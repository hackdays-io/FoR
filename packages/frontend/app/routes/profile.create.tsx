import { ens_normalize } from "@adraffy/ens-normalize";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Form,
  redirect,
  useActionData,
  useFetcher,
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
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { searchNames, setName } from "~/lib/namestone.server";
import { Typography } from "~/components/ui/typography";
import type { Route } from "./+types/profile.create";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロフィール作成 | FoR" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const check = url.searchParams.get("check");

  if (!check) {
    return { available: null };
  }

  try {
    ens_normalize(check);
  } catch {
    return { available: false };
  }

  try {
    const results = await searchNames(check, true);
    return { available: results.length === 0 };
  } catch {
    return { available: null };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const address = formData.get("address") as string;
  const avatar = (formData.get("avatar") as string)?.trim();
  const display = (formData.get("display") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  const errors: Record<string, string> = {};

  // Validate name
  if (!name) {
    errors.name = "ユーザー名を入力してください";
  } else if (name.length < 3) {
    errors.name = "ユーザー名は3文字以上にしてください";
  } else if (name.length > 32) {
    errors.name = "ユーザー名は32文字以内にしてください";
  } else if (/\s/.test(name)) {
    errors.name = "ユーザー名にスペースは使えません";
  } else {
    try {
      ens_normalize(name);
    } catch {
      errors.name = "使用できない文字が含まれています";
    }
  }

  // Validate address
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    errors.address = "ウォレットが接続されていません";
  }

  // Validate avatar
  if (avatar && !avatar.startsWith("https://")) {
    errors.avatar = "URLはhttps://で始めてください";
  }

  // Validate display name
  if (display && display.length > 50) {
    errors.display = "ニックネームは50文字以内にしてください";
  }

  // Validate description
  if (description && description.length > 200) {
    errors.description = "自己紹介は200文字以内にしてください";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Check availability
  try {
    const existing = await searchNames(name, true);
    if (existing.length > 0) {
      return { errors: { name: "このユーザー名は既に使用されています" } };
    }
  } catch {
    return { errors: { name: "ユーザー名の確認中にエラーが発生しました" } };
  }

  // Create profile
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
    return { errors: { name: "プロフィールの作成に失敗しました" } };
  }

  return redirect("/");
}

export default function ProfileCreate() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof loader>();
  const { address } = useActiveWallet();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  // Client-side ENS normalize check
  const [clientError, setClientError] = useState<string | null>(null);

  const validateAndCheckName = useCallback(
    (value: string) => {
      if (!value || value.length < 3) {
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

      // Debounced availability check
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetcher.load(`/profile/create?check=${encodeURIComponent(value)}`);
      }, 500);
    },
    [fetcher],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Determine username field status
  const availabilityData = fetcher.data;
  let nameHelperText: string | undefined;
  let nameErrorText = errors?.name ?? clientError ?? undefined;

  if (!nameErrorText && username.length >= 3 && availabilityData) {
    if (availabilityData.available === true) {
      nameHelperText = "このユーザー名は使用できます";
    } else if (availabilityData.available === false) {
      nameErrorText = "このユーザー名は既に使用されています";
    }
  }

  if (fetcher.state === "loading" && username.length >= 3) {
    nameHelperText = "確認中...";
  }

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール作成</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <Form method="post" className="flex flex-col items-center gap-24 px-20 py-24">
        <input type="hidden" name="address" value={address ?? ""} />

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

        {/* Username */}
        <TextField
          name="name"
          label="ユーザー名"
          placeholder="username"
          value={username}
          onChange={(e) => {
            const v = e.target.value;
            setUsername(v);
            validateAndCheckName(v);
          }}
          errorText={nameErrorText}
          helperText={nameHelperText}
          required
        />

        {/* Display name */}
        <TextField
          name="display"
          label="ニックネーム"
          placeholder="表示名"
          errorText={errors?.display}
        />

        {/* Bio */}
        <TextField
          name="description"
          label="自己紹介"
          placeholder="自己紹介を入力"
          errorText={errors?.description}
        />

        {errors?.address && (
          <Typography variant="ui-13" className="text-text-danger-default">
            {errors.address}
          </Typography>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !address || !username}
          className="w-full"
        >
          {isSubmitting ? "作成中..." : "プロフィールを作成"}
        </Button>
      </Form>
    </div>
  );
}
