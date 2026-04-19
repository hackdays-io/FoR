import { Typography } from "./ui/typography";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-default">
      <Typography variant="ui-13" className="text-text-hint">
        読み込み中...
      </Typography>
    </div>
  );
}
