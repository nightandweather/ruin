import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CollectorApp } from "./CollectorApp";
import "./collector.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CollectorApp />
  </StrictMode>,
);
