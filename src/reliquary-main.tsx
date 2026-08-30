import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReliquaryApp } from "./ReliquaryApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReliquaryApp />
  </StrictMode>,
);
