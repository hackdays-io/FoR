import Markdown from "react-markdown";
import { useNavigate } from "react-router";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Typography } from "~/components/ui/typography";
import content from "~/content/for-status.md?raw";
import type { Route } from "./+types/status.about";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "FoRステータスとは | FoR" }];
}

export default function StatusAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>FoRステータスとは</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="px-20 py-24">
        <Markdown
          components={{
            // ページタイトル: 32px
            h1: ({ children }) => (
              <Typography
                as="h1"
                variant="display-l"
                className="mb-8 text-[32px] leading-tight text-text-default"
              >
                {children}
              </Typography>
            ),
            // サブタイトル: 見出し直下のリード文
            h3: ({ children }) => (
              <Typography
                as="h3"
                variant="headline-l"
                className="mb-24 text-text-default"
              >
                {children}
              </Typography>
            ),
            // セクションタイトル: h2 20px bold
            h2: ({ children }) => (
              <Typography
                as="h2"
                variant="headline-l"
                className="mt-32 mb-12 text-text-default"
              >
                {children}
              </Typography>
            ),
            // 本文: 15px bold
            p: ({ children }) => (
              <Typography
                as="p"
                variant="body-l"
                className="mb-12 leading-relaxed text-text-default weight-medium"
              >
                {children}
              </Typography>
            ),
            // 画像: width 100% / contain
            img: ({ src, alt }) => (
              <img
                src={typeof src === "string" ? src : undefined}
                alt={alt ?? ""}
                className="my-16 h-auto w-full rounded-lg object-contain"
              />
            ),
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
}
