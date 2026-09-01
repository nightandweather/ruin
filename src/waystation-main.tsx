import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WaystationApp } from "./WaystationApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WaystationApp />
  </StrictMode>,
);
