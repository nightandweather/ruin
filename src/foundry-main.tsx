import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FoundryApp } from "./FoundryApp";
import "./foundry.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FoundryApp />
  </StrictMode>,
);
