import { ExternalLink } from "lucide-react";
import Markdown from "react-markdown";
import { useNavigate } from "react-router";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import content from "~/content/forest-fund.md?raw";
import type { Route } from "./+types/forest-bank.about";

// TODO: 正式なホワイトペーパーの URL に差し替える（現状は仮リンク）
const WHITEPAPER_URL = "https://forforest.gitbook.io/for";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の再生基金とは？ | FoR" }];
}

export default function ForestBankAbout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-bg-default">
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
                className="mb-12 leading-relaxed text-text-default"
              >
                {children}
              </Typography>
            ),
            // 仕切り線: 上下に 30px マージン
            hr: () => <hr className="my-[30px] border-t border-border" />,
            // 画像 / 動画: width 100% / contain
            // Markdown 上は ![alt](...) で書かれるため img として渡ってくる。
            // 動画拡張子の場合は再生可能な <video> として描画する。
            img: ({ src, alt }) => {
              const url = typeof src === "string" ? src : undefined;
              if (url && /\.(mp4|webm|ogg|mov)$/i.test(url)) {
                return (
                  // 装飾用のミュート自動再生（GIF 相当）。
                  // 動画端の変な線を隠すため、上下左右 2px をクロップする
                  // （wrapper を overflow-hidden にし、video を 4px 拡大して -2px オフセット）。
                  <div className="my-16 overflow-hidden">
                    <video
                      src={url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label={alt ?? undefined}
                      className="-m-2 block h-auto w-[calc(100%+4px)] max-w-none object-contain"
                    />
                  </div>
                );
              }
              return (
                <img
                  src={url}
                  alt={alt ?? ""}
                  className="my-16 h-auto w-full object-contain"
                />
              );
            },
          }}
        >
          {content}
        </Markdown>

        {/* ホワイトペーパーページへの外部リンク（リンクは仮） */}
        <div className="m-24">
          <a href={WHITEPAPER_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="w-full">
              ホワイトペーパーを読む
              <ExternalLink size={16} />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
