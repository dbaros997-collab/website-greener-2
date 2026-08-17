import { createRoot } from "react-dom/client";
import { ensureApiClientConfigured } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

ensureApiClientConfigured();

createRoot(document.getElementById("root")!).render(<App />);
