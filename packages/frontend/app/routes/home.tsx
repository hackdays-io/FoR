import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "FoR Design Token Foundation" },
    {
      name: "description",
      content:
        "FoR semantic design tokens mapped to shadcn/ui theme variables.",
    },
  ];
}

export default function Home() {
  return <Welcome />;
}
