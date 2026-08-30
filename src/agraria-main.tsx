import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AgrariaApp } from "./AgrariaApp";
import "./agraria.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AgrariaApp />
  </StrictMode>,
);
