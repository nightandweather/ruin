import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GatewayApp } from "./GatewayApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GatewayApp />
  </StrictMode>,
);
