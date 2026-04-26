import Markdown from "react-markdown";
import { useLoaderData, useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { formatAmount } from "~/lib/format";
import {
  loadOsusowakeItem,
  resolveRecipientAddress,
} from "~/lib/osusowake.server";
import type { Route } from "./+types/osusowake.$id";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそわけ | FoR" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Response("Not Found", { status: 404 });
  }
  const item = await loadOsusowakeItem(id);
  if (!item) {
    throw new Response("Not Found", { status: 404 });
  }
  const recipientAddress = await resolveRecipientAddress(item.recipient);
  return { item, recipientAddress };
}

export default function OsusowakeDetail() {
  const navigate = useNavigate();
  const { item, recipientAddress } = useLoaderData<typeof loader>();

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

      <div className="h-[200px] w-full bg-muted">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-16 px-20 pt-20 pb-20">
        <Typography variant="headline-l" as="h1">
          {item.title}
        </Typography>

        <div className="flex items-baseline justify-end gap-4">
          <Typography variant="number-m">
            {formatAmount(item.amount)}
          </Typography>
          <Typography variant="ui-20" weight="bold">
            FoR
          </Typography>
        </div>

        {item.description && (
          <Markdown
            components={{
              h2: ({ children }) => (
                <Typography variant="headline-m" as="h2" className="mt-24 mb-8">
                  {children}
                </Typography>
              ),
              p: ({ children }) => (
                <Typography
                  variant="body-m"
                  as="p"
                  className="mb-8 leading-relaxed"
                >
                  {children}
                </Typography>
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
            {item.description}
          </Markdown>
        )}
      </div>

      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button
          className="w-full"
          onClick={() =>
            navigate(
              `/send?to=${recipientAddress}&amount=${item.amount}&story=${encodeURIComponent(item.title)}`,
            )
          }
        >
          FoRを送る
        </Button>
      </div>
    </div>
  );
}
