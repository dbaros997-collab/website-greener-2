import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Prefer SSE-driven invalidation; keep a short poll as a safety net.
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 8_000,
      refetchIntervalInBackground: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Router base={routerBase}>
      <App />
    </Router>
  </QueryClientProvider>,
);
