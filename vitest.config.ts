import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    // Phase 0 has no tests yet; the timer engine tests arrive in Phase 1.
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["**/*.test.*"],
    },
  },
});
