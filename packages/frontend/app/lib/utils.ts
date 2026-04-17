import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "ui-10",
            "ui-12",
            "ui-13",
            "ui-16",
            "ui-20",
            "content-display-l",
            "content-display-m",
            "content-display-s",
            "content-headline-l",
            "content-headline-m",
            "content-headline-s",
            "content-number-l",
            "content-number-m",
            "content-number-s",
            "content-body-l",
            "content-body-m",
            "content-body-s",
            "content-caption",
          ],
        },
      ],
    },
  },
});

export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

export function formatTimestamp(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  return `${month}/${String(day).padStart(2, "0")} (${dayName})`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
