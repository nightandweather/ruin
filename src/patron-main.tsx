import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PatronApp } from "./PatronApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PatronApp />
  </StrictMode>,
);
