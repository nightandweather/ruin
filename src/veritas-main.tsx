import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VeritasApp } from "./VeritasApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VeritasApp />
  </StrictMode>,
);
