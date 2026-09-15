import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/**/*.test.ts",
        "src/lib/**/__tests__/**",
        "src/lib/**/*.server.ts",
        "src/lib/*.functions.ts",
        "src/lib/pwa-register.ts",
        "src/lib/offline-cache.ts",
        "src/lib/error-page.ts",
        "src/lib/error-capture.ts",
        "src/lib/lovable-error-reporting.ts",
      ],
    },
  },
});
