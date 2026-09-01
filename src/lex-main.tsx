import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LexApp } from "./LexApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LexApp />
  </StrictMode>,
);
