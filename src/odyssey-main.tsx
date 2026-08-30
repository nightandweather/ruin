import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OdysseyApp } from "./OdysseyApp";
import "./odyssey.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OdysseyApp />
  </StrictMode>,
);
