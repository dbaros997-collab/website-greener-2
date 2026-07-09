import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const apiDir = path.join(root, "artifacts", "api-server");

// A stale shell PORT (e.g. from starting the public site) overrides --env-file.
// Drop it so the API always reads PORT from .env (8080).
const env = { ...process.env };
delete env.PORT;

const isWin = process.platform === "win32";
const child = isWin
  ? spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "pnpm --filter @workspace/api-server run dev"],
      { cwd: root, env, stdio: "inherit" },
    )
  : spawn("pnpm", ["--filter", "@workspace/api-server", "run", "dev"], {
      cwd: root,
      env,
      stdio: "inherit",
    });

child.on("exit", (code) => process.exit(code ?? 1));
