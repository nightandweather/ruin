import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildInputs } from "./src/modules.ts";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: buildInputs(),
    },
  },
  test: {
    // Engine tests run in node. Component tests (.test.tsx) opt into jsdom
    // with a `@vitest-environment jsdom` docblock at the top of the file.
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
