import Markdown from "react-markdown";
import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { formatAmount } from "~/lib/format";
import type { Route } from "./+types/osusowake.$id";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそわけ | FoR" }];
}

// Dummy data
const dummyContent = `私たちの身近にある「土」。
実は、植物の成長や生態系、さらには地域の環境循環を支えるとても重要な存在です。
本ワークショップでは、土中環境の基本を学びながら、実際に手を動かして改善方法を体験します。
初心者の方も大歓迎。
家庭菜園やガーデニング、地域づくりに興味のある方におすすめの内容です。

## 開催概要

- 日時：○年○月○日（○）○:○○〜○:○○
- 会場：○○（屋外／屋内）
- 定員：○名（先着順）
- 参加費：○円（材料費込み）
- 対象：どなたでも参加可能（小学生以下は保護者同伴）

## ワークショップ内容

- 土中環境とは？（微生物・通気・水分の基本）
- 良い土・悪い土の見分け方
- 土中環境が改善されると何が起こるのか
- 実践：
  - 土をほぐす
  - 有機物の入れ方
  - 空気と水の通り道づくり
- 家庭や地域で続けられる改善のヒント紹介

※天候や会場条件により、一部内容が変更になる場合があります。

---

## 持ち物

- 動きやすい服装
- 汚れてもよい靴
- 軍手
- 飲み物`;

const dummyItem = {
  title: "土中環境改善ワークショップ土中環境改善ワークショップ土中環境改善ワークショップ",
  amount: 12500,
  imageUrl: "",
};

export default function OsusowakeDetail({ params }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>おすそわけ</AppBarTitle>
        </AppBarItem>
      </AppBar>

      {/* Hero Image */}
      <div className="h-[200px] w-full bg-muted">
        {dummyItem.imageUrl && (
          <img
            src={dummyItem.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-16 px-20 pt-20 pb-20">
        <h1 className="text-content-headline-l font-bold text-foreground">
          {dummyItem.title}
        </h1>

        <div className="flex items-baseline justify-end gap-4">
          <span className="font-latin text-content-number-m font-bold text-foreground">
            {formatAmount(dummyItem.amount)}
          </span>
          <span className="font-latin text-ui-20 font-bold text-foreground">
            FoR
          </span>
        </div>

        <Markdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-24 mb-8 text-content-headline-m font-bold text-foreground">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="mb-8 text-content-body-m leading-relaxed text-foreground">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="mb-8 list-disc pl-20 text-content-body-m leading-relaxed text-foreground">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-8 list-decimal pl-20 text-content-body-m leading-relaxed text-foreground">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="mb-4">{children}</li>,
            hr: () => <hr className="my-16 border-border" />,
          }}
        >
          {dummyContent}
        </Markdown>
      </div>

      {/* Sticky Button */}
      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button
          className="w-full"
          onClick={() =>
            navigate(`/send?to=0x0000000000000000000000000000000000000000&amount=${dummyItem.amount}&story=${encodeURIComponent(dummyItem.title)}`)
          }
        >
          FoRを送る
        </Button>
      </div>
    </div>
  );
}
