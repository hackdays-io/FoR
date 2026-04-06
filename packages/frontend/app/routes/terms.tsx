import { useNavigate } from "react-router";
import Markdown from "react-markdown";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Typography } from "~/components/ui/typography";
import type { Route } from "./+types/terms";
import content from "~/content/terms.md?raw";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "利用規約 | FoR" }];
}

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>利用規約</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="px-20 py-24">
        <Markdown
          components={{
            h2: ({ children }) => (
              <Typography variant="headline-m" as="h2" className="mt-32 mb-12 text-text-default">
                {children}
              </Typography>
            ),
            p: ({ children }) => (
              <Typography variant="body-m" as="p" className="mb-12 leading-relaxed text-text-default">
                {children}
              </Typography>
            ),
            ul: ({ children }) => (
              <ul className="mb-12 list-disc pl-20 text-content-body-m leading-relaxed text-text-default">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-12 list-decimal pl-20 text-content-body-m leading-relaxed text-text-default">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="mb-4">{children}</li>,
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
}
