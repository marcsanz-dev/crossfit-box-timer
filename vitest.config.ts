import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["**/*.test.*", "**/index.ts"],
      // Framework-free logic is the core of the app: keep it fully tested.
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
