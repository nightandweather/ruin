import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ValetudoApp } from "./ValetudoApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ValetudoApp />
  </StrictMode>,
);
