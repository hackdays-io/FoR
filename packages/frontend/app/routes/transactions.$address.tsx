import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { formatAmount } from "~/lib/format";
import { Typography } from "~/components/ui/typography";
import { getNamesByAddress } from "~/lib/namestone.server";
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

// Dummy message data
const dummyMessages = [
  {
    type: "sent" as const,
    title: "FoRを送りました",
    message: "鹿肉",
    amount: 112500,
    time: "12:20",
    date: "10/29 (水)",
  },
  {
    type: "received" as const,
    title: "FoRを受け取りました",
    message: "草刈りありがとう！",
    amount: 112500,
    time: "12:20",
    date: "10/29 (水)",
  },
];

function MessageBubble({
  type,
  title,
  message,
  amount,
  time,
  avatarSrc,
}: {
  type: "sent" | "received";
  title: string;
  message: string;
  amount: number;
  time: string;
  avatarSrc?: string;
}) {
  const isSent = type === "sent";

  return (
    <div className={`flex items-end gap-8 ${isSent ? "flex-row-reverse" : ""}`}>
      {!isSent && (
        <Avatar src={avatarSrc} size="sm" alt="" />
      )}
      <div
        className={`flex max-w-[75%] flex-col gap-4 rounded-lg p-12 ${
          isSent ? "bg-background" : "bg-background"
        }`}
      >
        <Typography variant="ui-13" weight="bold">{title}</Typography>
        <Typography variant="ui-13" className="text-muted-foreground">{message}</Typography>
        <div className="flex items-end justify-end gap-4">
          <Typography variant="number-m">
            {formatAmount(amount)}
          </Typography>
          <Typography variant="ui-16" weight="bold">
            FoR
          </Typography>
        </div>
      </div>
      <Typography variant="ui-10" as="span" className="shrink-0 text-muted-foreground">{time}</Typography>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center py-8">
      <Typography variant="ui-12" as="span" className="rounded-full bg-primary px-16 py-4 text-primary-foreground">
        {date}
      </Typography>
    </div>
  );
}

export default function TransactionDetail({
  loaderData,
}: Route.ComponentProps) {
  const { profile } = loaderData;
  const navigate = useNavigate();

  const displayName =
    profile?.text_records?.display || profile?.name || "ユーザー";

  // Group messages by date
  const dates = [...new Set(dummyMessages.map((m) => m.date))];

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

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-16 px-20 py-16">
        {dates.map((date) => (
          <div key={date} className="flex flex-col gap-16">
            <DateSeparator date={date} />
            {dummyMessages
              .filter((m) => m.date === date)
              .map((msg, i) => (
                <MessageBubble
                  key={i}
                  type={msg.type}
                  title={msg.title}
                  message={msg.message}
                  amount={msg.amount}
                  time={msg.time}
                  avatarSrc={profile?.text_records?.avatar}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Sticky Send Button */}
      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button
          className="w-full"
          onClick={() => navigate(`/send?to=${loaderData.address}`)}
        >
          送る
        </Button>
      </div>
    </div>
  );
}
