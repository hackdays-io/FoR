import { useState } from "react";
import type { Address } from "viem";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { useIsAllowListed } from "~/hooks/useAllowList";

const FORM_URL_TEMPLATE = import.meta.env.VITE_ALLOWLIST_FORM_URL;

/** フォーム URL の {address} をユーザーのアドレスに置き換える（事前入力用）。 */
export function buildAllowListFormUrl(
  template: string,
  address: Address,
): string {
  return template.replaceAll("{address}", encodeURIComponent(address));
}

type AllowListFormDialogProps = {
  address: Address;
};

/**
 * allowlist 未登録のユーザーに、Google フォームでのユーザー情報入力を促すモーダル。
 * ホームを開くたびに表示し、「あとで」で閉じられる。登録済みになれば表示しない。
 * フォーム URL（VITE_ALLOWLIST_FORM_URL）が未設定なら何も表示しない。
 */
export function AllowListFormDialog({ address }: AllowListFormDialogProps) {
  const { data: isListed } = useIsAllowListed(address);
  // 閉じたアドレスを覚えておき、アドレスが切り替わったら再表示する
  const [dismissedFor, setDismissedFor] = useState<Address | null>(null);
  const dismiss = () => setDismissedFor(address);

  if (!FORM_URL_TEMPLATE) return null;

  const formUrl = buildAllowListFormUrl(FORM_URL_TEMPLATE, address);

  return (
    <Dialog
      open={isListed === false && dismissedFor !== address}
      onClose={dismiss}
      title="ユーザー情報を入力してください"
      description={
        <>
          <p>
            すべての機能を使えるように、フォームからユーザー情報を入力してください。
          </p>
          <p className="mt-8 text-text-hint">
            運営が内容を確認したあと、送金などの機能が使えるようになります。
          </p>
        </>
      }
      actions={
        <>
          <Button
            className="w-full"
            onClick={() =>
              window.open(formUrl, "_blank", "noopener,noreferrer")
            }
          >
            フォームを開く
          </Button>
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            あとで
          </Button>
        </>
      }
    />
  );
}
