import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { TextField } from "~/components/ui/text-field";
import { formatAmount } from "~/lib/format";
import { Typography } from "~/components/ui/typography";
import { getNamesByAddress } from "~/lib/namestone.server";
import type { Route } from "./+types/send";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "FoRを送る | FoR" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  const initialAmount = url.searchParams.get("amount") ?? "";
  const initialStory = url.searchParams.get("story") ?? "";

  if (!to) {
    return { recipient: null, initialAmount, initialStory };
  }

  try {
    const profiles = await getNamesByAddress(to);
    const profile = profiles.length > 0 ? profiles[0] : null;
    return { recipient: { address: to, profile }, initialAmount, initialStory };
  } catch {
    return { recipient: { address: to, profile: null }, initialAmount, initialStory };
  }
}

const FUND_RATE = 0.05; // 5%
const PURPOSE_OPTIONS = ["森", "川", "コミュニティ"];
const DUMMY_BALANCE = 45900;

type Step = "input" | "confirm" | "complete";

function AmountRow({
  label,
  amount,
  bold,
}: {
  label: string;
  amount: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-16 py-12">
      <Typography
        variant="ui-13"
        weight={bold ? "bold" : "normal"}
        as="span"
      >
        {label}
      </Typography>
      <div className="flex items-baseline gap-4">
        <Typography variant="number-m">
          {formatAmount(amount)}
        </Typography>
        <Typography variant="ui-20" weight="bold">
          FoR
        </Typography>
      </div>
    </div>
  );
}

export default function Send({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { recipient } = loaderData;

  const [step, setStep] = useState<Step>("input");
  const [amount, setAmount] = useState(loaderData.initialAmount);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [story, setStory] = useState(loaderData.initialStory);

  const numAmount = Number(amount) || 0;
  const fundAmount = Math.ceil(numAmount * FUND_RATE);
  const totalAmount = numAmount + fundAmount;
  const remainingBalance = DUMMY_BALANCE - totalAmount;

  const displayName =
    recipient?.profile?.text_records?.display ||
    recipient?.profile?.name ||
    (recipient?.address
      ? `${recipient.address.slice(0, 6)}...${recipient.address.slice(-4)}`
      : "");

  const avatarSrc = recipient?.profile?.text_records?.avatar;

  const handleBack = () => {
    if (step === "confirm") {
      setStep("input");
    } else {
      navigate(-1);
    }
  };

  // ── Input Step ──
  if (step === "input") {
    return (
      <div className="flex min-h-screen flex-col bg-bg-default">
        <AppBar>
          <AppBarItem position="left">
            <AppBarBackButton onClick={handleBack} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>FoRを送る</AppBarTitle>
          </AppBarItem>
        </AppBar>

        <div className="flex flex-1 flex-col gap-24 px-20 pt-24">
          {/* Recipient */}
          {recipient && (
            <div className="flex flex-col items-center gap-8">
              <Avatar src={avatarSrc} alt={displayName} size="md" />
              <Typography variant="ui-16" weight="bold">
                {displayName}
              </Typography>
            </div>
          )}

          {/* Amount Card */}
          <div className="rounded-lg bg-background p-16">
            <div className="flex items-baseline gap-8">
              <Typography variant="ui-13" as="span" className="shrink-0">
                送るFoR
              </Typography>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="min-w-0 flex-1 rounded-md border border-border bg-card px-8 py-6 text-right font-latin text-content-number-m font-bold text-foreground outline-none"
              />
              <Typography variant="ui-20" weight="bold" as="span" className="shrink-0">
                FoR
              </Typography>
            </div>

            <div className="mt-12 flex items-center justify-between border-b border-border pb-12">
              <Typography variant="ui-13" as="span">
                森の貯金箱
              </Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-m">
                  {formatAmount(fundAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <Typography variant="ui-13" weight="bold" as="span">合計</Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-l">
                  {formatAmount(totalAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>
          </div>

          {/* Forest bank link */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-ui-13 font-medium text-foreground underline underline-offset-2"
              onClick={() => navigate("/forest-bank")}
            >
              森の貯金箱とは？
            </button>
          </div>

          {/* Purpose */}
          <div>
            <Typography variant="ui-16" weight="bold">
              FoRの交換用途
            </Typography>
            <div className="mt-8 flex flex-wrap gap-8">
              {PURPOSE_OPTIONS.map((purpose) => (
                <Label
                  key={purpose}
                  interactive
                  selected={selectedPurpose === purpose}
                  onClick={() =>
                    setSelectedPurpose(
                      selectedPurpose === purpose ? null : purpose,
                    )
                  }
                >
                  {purpose}
                </Label>
              ))}
            </div>
          </div>

          {/* Story */}
          <div>
            <Typography variant="ui-16" weight="bold">ストーリー</Typography>
            <div className="mt-8">
              <TextField
                placeholder="ストーリーをシェア"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                maxLength={50}
                trailingAdornment={
                  story ? (
                    <button type="button" onClick={() => setStory("")}>
                      <X size={16} />
                    </button>
                  ) : undefined
                }
                helperText="最大50文字で入力"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
          <Button
            className="w-full"
            disabled={numAmount <= 0}
            onClick={() => setStep("confirm")}
          >
            送る
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirm Step ──
  if (step === "confirm") {
    return (
      <div className="flex min-h-screen flex-col bg-bg-default">
        <AppBar>
          <AppBarItem position="left">
            <AppBarBackButton onClick={handleBack} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>FoRを送る</AppBarTitle>
          </AppBarItem>
        </AppBar>

        <div className="flex flex-1 flex-col gap-16 px-20 pt-24">
          {/* Recipient */}
          {recipient && (
            <div className="flex flex-col items-center gap-8">
              <Avatar src={avatarSrc} alt={displayName} size="md" />
              <Typography variant="ui-16" weight="bold">
                {displayName}
              </Typography>
            </div>
          )}

          {/* Amount Summary */}
          <div className="flex flex-col gap-4 rounded-lg bg-background p-16">
            <div className="flex items-center justify-between">
              <Typography variant="ui-13" as="span">
                送るFoR
              </Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-m">
                  {formatAmount(numAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-12">
              <Typography variant="ui-13" as="span">
                森の貯金箱
              </Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-m">
                  {formatAmount(fundAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Typography variant="ui-13" weight="bold" as="span">合計</Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-l">
                  {formatAmount(totalAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>
          </div>

          {/* Remaining Balance */}
          <AmountRow label="残高" amount={remainingBalance} bold />

          <Typography variant="ui-13" className="text-muted-foreground">
            ※ この取引は、キャンセルできません。
          </Typography>
        </div>

        <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
          <Button className="w-full" onClick={() => setStep("complete")}>
            送る
          </Button>
        </div>
      </div>
    );
  }

  // ── Complete Step ──
  return (
    <div className="flex min-h-screen flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate("/")} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>FoRを送る</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col gap-16 px-20 pt-24">
        {/* Recipient */}
        {recipient && (
          <div className="flex flex-col items-center gap-8">
            <Avatar src={avatarSrc} alt={displayName} size="md" />
            <Typography variant="ui-16" weight="bold">
              {displayName}
            </Typography>
          </div>
        )}

        <Typography variant="ui-16">FoRを送りました。</Typography>

        {/* Amount Summary */}
        <div className="flex flex-col gap-8">
          <AmountRow label="送ったFoR" amount={numAmount} />
          <AmountRow label="森の貯金箱" amount={fundAmount} />
        </div>

        {/* Rank */}
        <div className="flex flex-col items-center gap-8 pt-8">
          <Typography variant="ui-16" weight="bold" className="w-full">
            あなたのランク
          </Typography>
          <div className="h-[100px] w-[100px] rounded-lg bg-background" />
          <Typography variant="ui-16" weight="bold">ランク2</Typography>
          <Typography variant="ui-13" className="text-visual-green-4">
            あと○回交換すると、ランク3にアップ！
          </Typography>
        </div>
      </div>

      <div className="bg-bg-default px-20 pt-12 pb-32">
        <div className="flex flex-col gap-12">
          <Button className="w-full" onClick={() => navigate("/forest-bank")}>
            森の貯金箱を見る
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate("/")}
          >
            ホームへ戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
