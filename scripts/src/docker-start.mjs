import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const port = process.env.PORT ?? "8080";
console.log("[start] Grace High School");
console.log("[start] NODE_ENV:", process.env.NODE_ENV ?? "(unset)");
console.log("[start] PORT:", port);
console.log(
  "[start] DATABASE_URL:",
  process.env.DATABASE_URL ? "set" : "missing (API routes may fail)",
);

if (!process.env.PORT) {
  process.env.PORT = "8080";
}

function runNode(script, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", (err) => {
      console.error("[start] Failed to spawn node:", err);
      resolve(1);
    });
  });
}

const setupCode = await runNode(path.join(root, "scripts/src/setup-db.mjs"));
if (setupCode !== 0) {
  console.warn("[start] setup-db exited with code", setupCode, "(continuing)");
}

const server = spawn(
  process.execPath,
  ["--enable-source-maps", path.join(root, "artifacts/api-server/dist/index.mjs")],
  { stdio: "inherit", env: process.env },
);

server.on("exit", (code) => process.exit(code ?? 1));
server.on("error", (err) => {
  console.error("[start] FATAL: API server failed to start:", err);
  process.exit(1);
});
