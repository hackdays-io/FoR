import { useNavigate } from "react-router";
import Markdown from "react-markdown";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import type { Route } from "./+types/privacy";
import content from "~/content/privacy.md?raw";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プライバシーポリシー | FoR" }];
}

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プライバシーポリシー</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="px-20 py-24">
        <Markdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-32 mb-12 text-content-headline-m font-bold text-text-default">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="mb-12 text-content-body-m leading-relaxed text-text-default">
                {children}
              </p>
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
