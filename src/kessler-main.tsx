import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { KesslerApp } from "./KesslerApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KesslerApp />
  </StrictMode>,
);
