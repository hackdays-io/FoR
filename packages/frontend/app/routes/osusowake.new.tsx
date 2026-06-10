import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { PresentIcon } from "~/components/icons";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import type { Route } from "./+types/osusowake.new";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそわけの追加 | FoR" }];
}

const GOOGLE_FORM_URL = "https://forms.gle/BWy74cG4KemRi4DZ7";

export default function OsusowakeNew() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>おすそわけの追加</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col px-20 pt-40">
        <PresentIcon
          width={80}
          height={80}
          className="self-center text-text-hint"
        />

        <div className="mt-32">
          <Typography variant="body-l" className="leading-relaxed">
            おすそわけを追加しますか？
            <br />
            以下のGoogle Formから、おすそわけの内容を入力しましょう。
          </Typography>
        </div>
      </div>

      <div className="px-20 pt-12 pb-32">
        <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
          <Button className="w-full">
            おすそわけする
            <ExternalLink size={16} />
          </Button>
        </a>
      </div>
    </div>
  );
}
