import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HygeiaApp } from "./HygeiaApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HygeiaApp />
  </StrictMode>,
);
