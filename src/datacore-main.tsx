import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DatacoreApp } from "./DatacoreApp";
import "./datacore.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DatacoreApp />
  </StrictMode>,
);
