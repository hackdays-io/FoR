import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// ロジック（純粋関数）のユニットテスト用。React Router のプラグインは読み込まない。
// `~/` エイリアスだけは解決できないとアプリ側のモジュールを import できないため入れている。
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
