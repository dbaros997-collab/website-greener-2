import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Replit sets PORT/BASE_PATH via artifact.toml; CI/Render builds use these defaults.
const port = Number(process.env.PORT ?? "24144");
const basePath = process.env.BASE_PATH ?? "/";

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const isReplit = process.env.REPL_ID !== undefined;
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: isReplit
      ? undefined
      : {
          "/api": {
            target: apiProxyTarget,
            changeOrigin: true,
            // Keep SSE (/api/events) open — default timeouts drop the stream.
            timeout: 0,
            proxyTimeout: 0,
            configure(proxy) {
              proxy.on("proxyReq", (proxyReq, req) => {
                if (req.url?.startsWith("/api/events") || req.url === "/events") {
                  proxyReq.setHeader("Connection", "keep-alive");
                  proxyReq.setHeader("Accept", "text/event-stream");
                }
              });
            },
          },
        },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
