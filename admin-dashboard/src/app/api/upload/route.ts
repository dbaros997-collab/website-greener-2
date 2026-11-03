import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fail, ok, requireWrite } from "@/lib/http";

export const dynamic = "force-dynamic";

const TYPES: Record<string, { ext: string; mediaType: "image" | "video"; limit: number }> = {
  "image/jpeg": { ext: ".jpg", mediaType: "image", limit: 12 * 1024 * 1024 },
  "image/png": { ext: ".png", mediaType: "image", limit: 12 * 1024 * 1024 },
  "image/webp": { ext: ".webp", mediaType: "image", limit: 12 * 1024 * 1024 },
  "image/gif": { ext: ".gif", mediaType: "image", limit: 12 * 1024 * 1024 },
  "video/mp4": { ext: ".mp4", mediaType: "video", limit: 40 * 1024 * 1024 },
  "video/webm": { ext: ".webm", mediaType: "video", limit: 40 * 1024 * 1024 },
};

export async function POST(req: Request) {
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Choose a file to upload.");
  const kind = TYPES[file.type];
  if (!kind) return fail("Upload a JPEG, PNG, WebP, GIF, MP4, or WebM file.");
  if (file.size <= 0) return fail("That file is empty.");
  if (file.size > kind.limit) {
    return fail(kind.mediaType === "image" ? "Images need to be 12 MB or smaller." : "Videos need to be 40 MB or smaller.");
  }

  const filename = `${randomUUID()}${kind.ext}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return ok({ url: `/uploads/${filename}`, mediaType: kind.mediaType });
}
