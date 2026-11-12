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
                  <div className="my-16 overflow-hidden rounded-lg">
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
                  className="my-16 h-auto w-full rounded-lg object-contain"
                />
              );
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
}
