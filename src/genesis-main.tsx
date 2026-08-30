import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GenesisApp } from "./GenesisApp";
import "./civilization.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GenesisApp />
  </StrictMode>,
);
