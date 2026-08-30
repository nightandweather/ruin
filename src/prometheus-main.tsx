import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrometheusApp } from "./PrometheusApp";
import "./civilization.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrometheusApp />
  </StrictMode>,
);
