import { useMemo } from "react";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import {
  type TransferBetween,
  useTransfersBetween,
} from "~/hooks/useTransfersBetween";
import { formatAmount } from "~/lib/format";
import { getNamesByAddress } from "~/lib/namestone.server";
import { formatTimestamp } from "~/lib/utils";
import type { Route } from "./+types/transactions.$address";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "やりとり詳細 | FoR" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { address } = params;

  let profile = null;
  try {
    const profiles = await getNamesByAddress(address);
    profile = profiles.length > 0 ? profiles[0] : null;
  } catch {
    // ignore
  }

  return { address, profile };
}

function formatTime(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function MessageBubble({
  type,
  title,
  amount,
  time,
  avatarSrc,
}: {
  type: "sent" | "received";
  title: string;
  amount: number;
  time: string;
  avatarSrc?: string;
}) {
  const isSent = type === "sent";

  return (
    <div className={`flex items-end gap-8 ${isSent ? "flex-row-reverse" : ""}`}>
      {!isSent && <Avatar src={avatarSrc} size="sm" alt="" />}
      <div className="flex max-w-[75%] flex-col gap-4 rounded-lg bg-background p-12">
        <Typography variant="ui-13" weight="bold">
          {title}
        </Typography>
        <div className="flex items-end justify-end gap-4">
          <Typography variant="number-m">{formatAmount(amount)}</Typography>
          <Typography variant="ui-16" weight="bold">
            FoR
          </Typography>
        </div>
      </div>
      <Typography
        variant="ui-10"
        as="span"
        className="shrink-0 text-muted-foreground"
      >
        {time}
      </Typography>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center py-8">
      <Typography
        variant="ui-12"
        as="span"
        className="rounded-full bg-primary px-16 py-4 text-primary-foreground"
      >
        {date}
      </Typography>
    </div>
  );
}

interface ChatMessage {
  id: string;
  type: "sent" | "received";
  title: string;
  amount: number;
  time: string;
  date: string;
}

function buildMessages(
  transfers: TransferBetween[],
  meLower: string,
): ChatMessage[] {
  return transfers.map((tx) => {
    const isSent = tx.from.id.toLowerCase() === meLower;
    const rawAmount = isSent ? tx.totalAmount : tx.recipientAmount;
    return {
      id: tx.id,
      type: isSent ? "sent" : "received",
      title: isSent ? "FoRを送りました" : "FoRを受け取りました",
      amount: Number(formatUnits(BigInt(rawAmount), 18)),
      time: formatTime(tx.timestamp),
      date: formatTimestamp(tx.timestamp),
    };
  });
}

export default function TransactionDetail({
  loaderData,
}: Route.ComponentProps) {
  const { address: peer, profile } = loaderData;
  const navigate = useNavigate();
  const { address: me } = useActiveWallet();

  const { data: transfers, isLoading } = useTransfersBetween(me, peer);

  const messages = useMemo(() => {
    if (!transfers || !me) return [];
    return buildMessages(transfers, me.toLowerCase());
  }, [transfers, me]);

  const dates = useMemo(
    () => Array.from(new Set(messages.map((m) => m.date))),
    [messages],
  );

  const displayName =
    profile?.text_records?.display || profile?.name || "ユーザー";
  const avatarSrc = profile?.text_records?.avatar;

  return (
    <div className="flex min-h-screen flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>{displayName}</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col gap-16 px-20 py-16">
        {isLoading ? (
          <Typography
            variant="ui-13"
            className="py-24 text-center text-text-hint"
          >
            読み込み中...
          </Typography>
        ) : messages.length === 0 ? (
          <Typography
            variant="ui-13"
            className="py-24 text-center text-text-hint"
          >
            やりとりがありません
          </Typography>
        ) : (
          dates.map((date) => (
            <div key={date} className="flex flex-col gap-16">
              <DateSeparator date={date} />
              {messages
                .filter((m) => m.date === date)
                .map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    type={msg.type}
                    title={msg.title}
                    amount={msg.amount}
                    time={msg.time}
                    avatarSrc={avatarSrc}
                  />
                ))}
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button
          className="w-full"
          onClick={() => navigate(`/send?to=${peer}`)}
        >
          送る
        </Button>
      </div>
    </div>
  );
}
