import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WatchfloorApp } from "./WatchfloorApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WatchfloorApp />
  </StrictMode>,
);
