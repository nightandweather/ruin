import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConcordApp } from "./ConcordApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConcordApp />
  </StrictMode>,
);
