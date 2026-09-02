import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ArkApp } from "./ArkApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ArkApp />
  </StrictMode>,
);
