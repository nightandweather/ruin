import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildInputs } from "./src/modules";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: buildInputs(),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
