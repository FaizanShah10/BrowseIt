import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Placeholder *.test.ts files from issue #1 are comment-only; exclude
    // them so `npm test` exits cleanly with zero suites until #3/#6 fill them in.
    exclude: [
      "tests/navigationReducer.test.ts",
      "tests/sanitize.test.ts",
      "tests/normalizeAddress.test.ts",
    ],
    passWithNoTests: true,
  },
});
