import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";

export function meta() {
  return [{ title: "QRスキャン | FoR" }];
}

export default function Scan() {
  const navigate = useNavigate();
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const readerId = "qr-reader";
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop().catch(() => {});

            try {
              const url = new URL(decodedText);
              if (url.pathname.includes("/send")) {
                navigate(`${url.pathname}${url.search}`);
              } else {
                navigate(`/send?to=${encodeURIComponent(decodedText)}`);
              }
            } catch {
              navigate(`/send?to=${encodeURIComponent(decodedText)}`);
            }
          },
          () => {},
        );
        if (!cancelled) setStarted(true);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "カメラを起動できませんでした";
          setError(message);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current as
        | { isScanning: boolean; stop: () => Promise<void> }
        | undefined;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <AppBar className="bg-black/80">
        <AppBarItem position="left">
          <AppBarBackButton
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle className="text-white">QRスキャン</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col items-center justify-center px-20">
        {error ? (
          <div className="flex flex-col items-center gap-16">
            <p className="text-center text-ui-16 text-white">{error}</p>
            <p className="text-center text-ui-13 text-white/60">
              カメラのアクセスを許可してください
            </p>
          </div>
        ) : !started ? (
          <p className="text-ui-13 text-white/60">カメラを起動中...</p>
        ) : null}

        <div
          id="qr-reader"
          className="w-full max-w-[300px] overflow-hidden rounded-lg"
        />

        {started && (
          <p className="mt-20 text-center text-ui-13 text-white/60">
            QRコードをカメラに映してください
          </p>
        )}
      </div>
    </div>
  );
}
