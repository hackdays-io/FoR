import { ExternalLink, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { type Address, formatUnits, parseUnits } from "viem";
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
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import {
  calculateDistribution,
  grossUpFromRecipient,
  useDistributionTransfer,
} from "~/hooks/useDistributionTransfer";
import { useForTokenBalance } from "~/hooks/useForToken";
import { useDistributionRatios } from "~/hooks/useRouter";
import { getExplorerName, getExplorerTxUrl } from "~/lib/explorer";
import { formatAmount } from "~/lib/format";
import { getNamesByAddress } from "~/lib/namestone.server";
import { buildMessagePayload } from "~/lib/transfer-message";
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
    return {
      recipient: { address: to, profile: null },
      initialAmount,
      initialStory,
    };
  }
}

const PURPOSE_OPTIONS = ["森", "川", "コミュニティ"];

function toBigIntAmount(value: string): bigint {
  if (!value) return 0n;
  try {
    return parseUnits(value, 18);
  } catch {
    return 0n;
  }
}

type Step = "input" | "confirm" | "complete";

function AmountRow({
  label,
  amount,
  bold,
}: {
  label: string;
  amount: number | string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-16 py-12">
      <Typography variant="ui-13" weight={bold ? "bold" : "normal"} as="span">
        {label}
      </Typography>
      <div className="flex items-baseline gap-4">
        <Typography variant="number-m">{formatAmount(amount)}</Typography>
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

  const { address } = useActiveWallet();
  const { data: balance, isLoading: isBalanceLoading } =
    useForTokenBalance(address);
  const { data: ratios, isLoading: isRatiosLoading } = useDistributionRatios();
  const { executeTransfer, status, txHash, error } = useDistributionTransfer();

  // ユーザー入力 = 受取人が受け取る額（送るFoR）。
  // Router へは grossUp した total を渡して、分配後に recipient 部分が input に一致するようにする。
  const recipientAmountBigInt = useMemo(() => toBigIntAmount(amount), [amount]);

  const totalAmountBigInt = useMemo(
    () =>
      ratios
        ? grossUpFromRecipient(
            recipientAmountBigInt,
            ratios.fundRatio,
            ratios.burnRatio,
          )
        : recipientAmountBigInt,
    [recipientAmountBigInt, ratios],
  );

  const breakdown = useMemo(
    () =>
      ratios
        ? calculateDistribution(
            totalAmountBigInt,
            ratios.fundRatio,
            ratios.burnRatio,
          )
        : null,
    [totalAmountBigInt, ratios],
  );

  const numAmount = Number(amount) || 0;
  // 森の貯金箱表示は fund + burn を合算して表示する
  const fundAndBurn = breakdown
    ? formatUnits(breakdown.fundAmount + breakdown.burnAmount, 18)
    : "0";
  const totalAmount = formatUnits(totalAmountBigInt, 18);

  const balanceRaw = balance?.raw ?? 0n;
  const balanceDisplay = balance ? balance.formatted : "0";
  const insufficientBalance =
    !!balance && totalAmountBigInt > 0n && balanceRaw < totalAmountBigInt;
  const remainingBalance = balance
    ? formatUnits(
        balanceRaw > totalAmountBigInt ? balanceRaw - totalAmountBigInt : 0n,
        18,
      )
    : "0";

  const isSubmitting = status === "signing" || status === "pending";
  const confirmLabel =
    status === "signing"
      ? "署名中..."
      : status === "pending"
        ? "送信中..."
        : "送る";

  const handleConfirmSend = async () => {
    if (!recipient?.address || totalAmountBigInt === 0n || isSubmitting) return;
    const payload = buildMessagePayload({
      usecase: selectedPurpose,
      memo: story,
    });
    try {
      await executeTransfer(
        recipient.address as Address,
        totalAmountBigInt,
        payload,
      );
      setStep("complete");
    } catch {
      // エラーは hook の error に反映
    }
  };

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
              <Typography
                variant="ui-20"
                weight="bold"
                as="span"
                className="shrink-0"
              >
                FoR
              </Typography>
            </div>

            <div className="mt-12 flex items-center justify-between border-b border-border pb-12">
              <Typography variant="ui-13" as="span">
                森の貯金箱
              </Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-m">
                  {isRatiosLoading ? "--" : formatAmount(fundAndBurn)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <Typography variant="ui-13" weight="bold" as="span">
                合計
              </Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="number-l">
                  {isRatiosLoading ? "--" : formatAmount(totalAmount)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>
          </div>

          {/* Current Balance */}
          <div className="flex items-center justify-between px-4">
            <Typography variant="ui-13" as="span" className="text-text-hint">
              残高
            </Typography>
            <div className="flex items-baseline gap-4">
              <Typography variant="number-m">
                {isBalanceLoading ? "--" : formatAmount(balanceDisplay)}
              </Typography>
              <Typography variant="ui-13" weight="bold">
                FoR
              </Typography>
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
            <Typography variant="ui-16" weight="bold">
              ストーリー
            </Typography>
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
          {insufficientBalance && (
            <Typography
              variant="ui-13"
              className="mb-8 text-center text-destructive"
            >
              残高が不足しています
            </Typography>
          )}
          <Button
            className="w-full"
            disabled={
              numAmount <= 0 ||
              insufficientBalance ||
              isBalanceLoading ||
              isRatiosLoading ||
              !address
            }
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
                  {formatAmount(amount || "0")}
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
                  {formatAmount(fundAndBurn)}
                </Typography>
                <Typography variant="ui-20" weight="bold">
                  FoR
                </Typography>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Typography variant="ui-13" weight="bold" as="span">
                合計
              </Typography>
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

          {error && (
            <Typography variant="ui-13" className="text-destructive">
              送金に失敗しました: {error.message}
            </Typography>
          )}
        </div>

        <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
          <Button
            className="w-full"
            disabled={isSubmitting || !recipient?.address}
            onClick={handleConfirmSend}
          >
            {confirmLabel}
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
          <AmountRow label="送ったFoR" amount={amount || "0"} />
          <AmountRow label="森の貯金箱" amount={fundAndBurn} />
          <AmountRow label="合計" amount={totalAmount} bold />
        </div>

        {/* Explorer link */}
        {(() => {
          const explorerUrl = getExplorerTxUrl(txHash);
          if (!explorerUrl) return null;
          return (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-4 self-start text-ui-13 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {getExplorerName()}で取引を見る
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          );
        })()}

        {/* Rank */}
        <div className="flex flex-col items-center gap-8 pt-8">
          <Typography variant="ui-16" weight="bold" className="w-full">
            あなたのランク
          </Typography>
          <div className="h-[100px] w-[100px] rounded-lg bg-background" />
          <Typography variant="ui-16" weight="bold">
            ランク2
          </Typography>
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
