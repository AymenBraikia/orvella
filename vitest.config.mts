import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
        // Server-only modules are imported directly in tests (no React Server Components runtime).
        alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
    },
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        // The stock tests start a throwaway MongoDB; the first run downloads its binary.
        testTimeout: 120_000,
        hookTimeout: 180_000,
    },
});
