import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProspectApp } from "./ProspectApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProspectApp />
  </StrictMode>,
);
