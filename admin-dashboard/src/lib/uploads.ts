import fs from "node:fs/promises";
import path from "node:path";

export async function removeUpload(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  if (!/^[\w.-]+$/.test(name)) return;
  const file = path.join(process.cwd(), "public", "uploads", name);
  await fs.unlink(file).catch(() => undefined);
}
