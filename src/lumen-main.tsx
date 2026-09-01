import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LumenApp } from "./LumenApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LumenApp />
  </StrictMode>,
);
