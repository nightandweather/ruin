import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConciliumApp } from "./ConciliumApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConciliumApp />
  </StrictMode>,
);
