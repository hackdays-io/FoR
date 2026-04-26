import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import { formatUnits, parseUnits } from "viem";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import {
  calculateDistribution,
  grossUpFromRecipient,
} from "~/hooks/useDistributionTransfer";
import { useDistributionRatios } from "~/hooks/useRouter";
import { formatAmount } from "~/lib/format";
import type { NameStoneProfile } from "~/lib/namestone.server";
import type { Route } from "./+types/receive";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "KUUを受け取る | FoR" }];
}

function toBigIntAmount(value: string): bigint {
  if (!value) return 0n;
  try {
    return parseUnits(value, 18);
  } catch {
    return 0n;
  }
}

export default function Receive() {
  const navigate = useNavigate();
  const { address } = useActiveWallet();
  const fetcher = useFetcher<{ profile: NameStoneProfile | null }>();
  const { data: ratios, isLoading: isRatiosLoading } = useDistributionRatios();

  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address && fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/profile/${address}`);
    }
  }, [address, fetcher.state, fetcher.data]);

  const profile = fetcher.data?.profile;
  const displayName =
    profile?.text_records?.display || profile?.name || "";

  const numAmount = Number(amount) || 0;
  // 依頼FoR = 受取人が受け取る額。送信側が支払う総額 (合計) は gross up。
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
  const fundAndBurn = breakdown
    ? formatUnits(breakdown.fundAmount + breakdown.burnAmount, 18)
    : "0";
  const totalAmount = ratios
    ? formatUnits(totalAmountBigInt, 18)
    : String(numAmount);

  const receiveUrl = useMemo(() => {
    if (!address) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({ to: address });
    if (numAmount > 0) {
      params.set("amount", String(numAmount));
    }
    return `${base}/send?${params}`;
  }, [address, numAmount]);

  const handleCopy = async () => {
    if (!receiveUrl) return;
    await navigator.clipboard.writeText(receiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>KUUを受け取る</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col gap-24 px-20 pt-20">
        <Typography variant="body-l">
          相手にQRコードをスキャンしてもらうと、KUUを受け取ることができます。
        </Typography>

        {/* QR Card */}
        <div className="rounded-lg bg-background p-20">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-card p-12">
              {receiveUrl ? (
                <QRCodeSVG value={receiveUrl} size={200} />
              ) : (
                <div className="size-[200px] bg-muted" />
              )}
            </div>
          </div>

          {/* Name */}
          <Typography variant="ui-16" weight="bold" className="mt-12 text-center">
            {displayName}
          </Typography>

          {/* Amount input */}
          <div className="mt-16 flex items-baseline gap-8">
            <Typography variant="ui-13" as="span" className="shrink-0">
              依頼KUU
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
              KUU
            </Typography>
          </div>

          {/* Fund + Burn */}
          <div className="mt-12 flex items-baseline justify-between border-b border-border pb-12">
            <Typography variant="ui-13" as="span">
              森の貯金箱
            </Typography>
            <div className="flex items-baseline gap-4">
              <Typography variant="number-m">
                {isRatiosLoading ? "--" : formatAmount(fundAndBurn)}
              </Typography>
              <Typography variant="ui-20" weight="bold">
                KUU
              </Typography>
            </div>
          </div>

          {/* Total */}
          <div className="mt-12 flex items-baseline justify-between">
            <Typography variant="ui-13" weight="bold" as="span">合計</Typography>
            <div className="flex items-baseline gap-4">
              <Typography variant="number-l">
                {isRatiosLoading ? "--" : formatAmount(totalAmount)}
              </Typography>
              <Typography variant="ui-20" weight="bold">
                KUU
              </Typography>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Copy Button */}
      <div className="sticky bottom-0 bg-bg-default px-20 pt-12 pb-32">
        <Button className="w-full" onClick={handleCopy}>
          {copied ? "コピーしました" : "リンクをコピーする"}
        </Button>
      </div>
    </div>
  );
}
