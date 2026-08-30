import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        helios: "index.html",
        foundry: "foundry.html",
        collector: "collector.html",
        datacore: "datacore.html",
        agraria: "agraria.html",
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
