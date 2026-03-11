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
