import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Button } from "~/components/ui/button";
import { formatAmount } from "~/lib/format";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import type { NameStoneProfile } from "~/lib/namestone.server";
import type { Route } from "./+types/receive";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "FoRを受け取る | FoR" }];
}

const FUND_RATE = 0.05;

export default function Receive() {
  const navigate = useNavigate();
  const { address } = useActiveWallet();
  const fetcher = useFetcher<{ profile: NameStoneProfile | null }>();

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
  const fundAmount = Math.ceil(numAmount * FUND_RATE);
  const totalAmount = numAmount + fundAmount;

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
          <AppBarTitle>FoRを受け取る</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col gap-24 px-20 pt-20">
        <Typography variant="body-l">
          相手にQRコードをスキャンしてもらうと、FoRを受け取ることができます。
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
              依頼FoR
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

          {/* Fund */}
          <div className="mt-12 flex items-baseline justify-between border-b border-border pb-12">
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

          {/* Total */}
          <div className="mt-12 flex items-baseline justify-between">
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
