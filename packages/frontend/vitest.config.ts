import { defineConfig } from "vitest/config";

// ロジック（純粋関数）のユニットテスト用。React Router / Vite プラグインは読み込まない。
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
