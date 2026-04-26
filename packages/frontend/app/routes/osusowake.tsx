import { Gift } from "lucide-react";
import { useLoaderData, useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Card } from "~/components/ui/card";
import { loadOsusowakeItems } from "~/lib/osusowake.server";
import type { Route } from "./+types/osusowake";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそわけ | FoR" }];
}

export async function loader() {
  const items = await loadOsusowakeItems();
  return { items };
}

export default function OsusowakeList() {
  const navigate = useNavigate();
  const { items } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>おすそわけ</AppBarTitle>
        </AppBarItem>
        <AppBarItem position="right">
          <button
            type="button"
            onClick={() => navigate("/osusowake/new")}
            className="inline-flex size-32 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          >
            <Gift size={20} />
          </button>
        </AppBarItem>
      </AppBar>

      <div className="grid grid-cols-2 gap-12 px-20 pt-16 pb-20">
        {items.map((item) => (
          <Card
            key={item.id}
            variant="promo"
            amount={item.amount}
            topProps={{ title: item.title }}
            isNew={item.isNew}
            backgroundImage={item.imageUrl}
            to={`/osusowake/${item.id}`}
          />
        ))}
      </div>
    </div>
  );
}
