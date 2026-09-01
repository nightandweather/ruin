import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CensusApp } from "./CensusApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CensusApp />
  </StrictMode>,
);
