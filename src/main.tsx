import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import AnalyticsScripts from "./components/AnalyticsScripts";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <AnalyticsScripts />
    <App />
  </HelmetProvider>
);
