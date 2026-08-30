import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MnemosyneApp } from "./MnemosyneApp";
import "./mnemosyne.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MnemosyneApp />
  </StrictMode>,
);
