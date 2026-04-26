import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ["buffer"],
      globals: { Buffer: true },
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
