import { useState } from "react";

import "~/app.css";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";

export default {
  title: "Components/Dialog",
};

export const Default = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background p-24">
      <Button onClick={() => setOpen(true)}>ダイアログを開く</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="ユーザー情報を入力してください"
        description="すべての機能を使えるように、フォームからユーザー情報を入力してください。"
        actions={
          <>
            <Button className="w-full">フォームを開く</Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              あとで
            </Button>
          </>
        }
      />
    </div>
  );
};

export const WithoutActions = () => (
  <div className="min-h-screen bg-background p-24">
    <Dialog
      open
      title="お知らせ"
      description="ボタンの無いダイアログです。onClose を渡さない場合は閉じられません。"
    />
  </div>
);
