import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemisApp } from "./ThemisApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemisApp />
  </StrictMode>,
);
