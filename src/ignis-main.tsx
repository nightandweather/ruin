import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IgnisApp } from "./IgnisApp";
import "./ignis.css";

createRoot(document.getElementById("root")!).render(<StrictMode><IgnisApp/></StrictMode>);
