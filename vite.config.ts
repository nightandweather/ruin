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
        aegis: "aegis.html",
        progenitor: "progenitor.html",
        gravitas: "gravitas.html",
        atlas: "atlas.html",
        navis: "navis.html",
        mender: "mender.html",
        sentinel: "sentinel.html",
        ignis: "ignis.html",
        odyssey: "odyssey.html",
        corvus: "corvus.html",
        prometheus: "prometheus.html",
        genesis: "genesis.html",
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
