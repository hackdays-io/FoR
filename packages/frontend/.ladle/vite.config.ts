import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    svgr({
      // SVG にハードコードされた色を currentColor に変換し、
      // コンポーネント側の text-* で色を制御できるようにする。
      svgrOptions: {
        replaceAttrValues: {
          white: "currentColor",
          "#fff": "currentColor",
          "#ffffff": "currentColor",
          "#FFF": "currentColor",
          "#FFFFFF": "currentColor",
        },
      },
    }),
    tsconfigPaths(),
  ],
});
