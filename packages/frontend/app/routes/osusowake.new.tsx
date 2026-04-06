import { ExternalLink, Gift } from "lucide-react";
import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/osusowake.new";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそわけする | FoR" }];
}

const GOOGLE_FORM_URL = "https://forms.google.com/example";

export default function OsusowakeNew() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>おすそわけする</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col items-center px-20 pt-40">
        <Gift size={80} className="text-muted-foreground/50" />

        <div className="mt-32">
          <p className="text-content-body-l leading-relaxed text-foreground">
            おすそわけをしますか？
            <br />
            以下のリンクより、Google Formで
            <br />
            おすそわけの内容を入力しましょう。
          </p>
        </div>
      </div>

      <div className="px-20 pt-12 pb-32">
        <a
          href={GOOGLE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary" className="w-full">
            おすそわけする
            <ExternalLink size={16} />
          </Button>
        </a>
      </div>
    </div>
  );
}
