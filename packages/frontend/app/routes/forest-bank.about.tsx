import Markdown from "react-markdown";
import { useNavigate } from "react-router";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Typography } from "~/components/ui/typography";
import content from "~/content/forest-fund.md?raw";
import type { Route } from "./+types/forest-bank.about";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の再生基金とは？ | FoR" }];
}

export default function ForestBankAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>森の再生基金とは？</AppBarTitle>
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
                className="mb-24 text-[32px] leading-tight text-text-default"
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
                weight="bold"
                className="mb-12 leading-relaxed text-text-default"
              >
                {children}
              </Typography>
            ),
            // 画像: width 100% / contain
            img: ({ src, alt }) => (
              <img
                src={typeof src === "string" ? src : undefined}
                alt={alt ?? ""}
                className="my-16 h-auto w-full object-contain"
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
