import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChronosApp } from "./ChronosApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChronosApp />
  </StrictMode>,
);
