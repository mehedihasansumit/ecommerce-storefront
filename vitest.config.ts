import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    // Tests sign real tokens; the app refuses to run without a secret.
    env: { JWT_SECRET: "test-secret-for-vitest-only-0123456789abcdef" },
  },
});
