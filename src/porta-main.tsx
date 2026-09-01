import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PortaApp } from "./PortaApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PortaApp />
  </StrictMode>,
);
