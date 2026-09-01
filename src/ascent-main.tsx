import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AscentApp } from "./AscentApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AscentApp />
  </StrictMode>,
);
