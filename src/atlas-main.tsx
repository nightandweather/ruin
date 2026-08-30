import React from "react";
import ReactDOM from "react-dom/client";
import { AtlasApp } from "./AtlasApp";
import "./atlas.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AtlasApp />
  </React.StrictMode>,
);
