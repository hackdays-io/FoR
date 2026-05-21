import { type ReactNode, Suspense } from "react";
import { Await } from "react-router";

import { Card } from "~/components/ui/card";
import type { OsusowakeItem } from "~/lib/osusowake.server";

// scroll: ホームの横スクロール / grid: おすそ分け一覧ページの 2 カラム
type OsusowakeLayout = "scroll" | "grid";

const containerClassName: Record<OsusowakeLayout, string> = {
  scroll: "flex gap-12 overflow-x-auto pb-8",
  grid: "grid grid-cols-2 gap-12",
};

// スケルトン枚数（index を key にしないよう固定キーを用意）
const skeletonKeys: Record<OsusowakeLayout, readonly string[]> = {
  scroll: ["a", "b", "c"],
  grid: ["a", "b", "c", "d"],
};

/** 横スクロールはカード幅を固定する必要がある */
function CardSlot({
  layout,
  children,
}: {
  layout: OsusowakeLayout;
  children: ReactNode;
}) {
  if (layout === "scroll") {
    return <div className="w-[200px] shrink-0">{children}</div>;
  }
  return <>{children}</>;
}

function OsusowakeCardsView({
  items,
  layout,
}: {
  items: OsusowakeItem[];
  layout: OsusowakeLayout;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-ui-13 text-text-hint">おすそ分けがありません</p>
    );
  }
  return (
    <div className={containerClassName[layout]}>
      {items.map((item) => (
        <CardSlot key={item.id} layout={layout}>
          <Card
            variant="promo"
            amount={item.amount}
            topProps={{ title: item.title }}
            isNew={item.isNew}
            backgroundImage={item.imageUrl}
            to={`/osusowake/${item.id}`}
          />
        </CardSlot>
      ))}
    </div>
  );
}

/** items 解決前のプレースホルダー（promo カードと同じ h-[144px]） */
function OsusowakeCardsSkeleton({ layout }: { layout: OsusowakeLayout }) {
  return (
    <div className={containerClassName[layout]}>
      {skeletonKeys[layout].map((key) => (
        <CardSlot key={key} layout={layout}>
          <div className="h-[144px] w-full animate-pulse rounded-lg bg-muted" />
        </CardSlot>
      ))}
    </div>
  );
}

/**
 * おすそ分けカード一覧。loader が返す未解決の Promise を受け取り、
 * defer ストリーミングで後追い表示する（ページ本体の描画・遷移はブロックしない）。
 * ホーム（layout="scroll"）とおすそ分け一覧ページ（layout="grid"）で共用する。
 */
export function OsusowakeCards({
  items,
  layout,
}: {
  /** loader が `await` せずに返した Promise */
  items: Promise<OsusowakeItem[]>;
  layout: OsusowakeLayout;
}) {
  return (
    <Suspense fallback={<OsusowakeCardsSkeleton layout={layout} />}>
      <Await
        resolve={items}
        errorElement={<OsusowakeCardsView items={[]} layout={layout} />}
      >
        {(resolved: OsusowakeItem[]) => (
          <OsusowakeCardsView items={resolved} layout={layout} />
        )}
      </Await>
    </Suspense>
  );
}
