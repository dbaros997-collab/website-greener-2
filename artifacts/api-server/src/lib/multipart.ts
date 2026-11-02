import type { Request } from "express";

export interface MultipartFile {
  fieldName: string;
  fileName: string;
  contentType: string;
  data: Buffer;
}

export interface MultipartForm {
  fields: Record<string, string>;
  files: MultipartFile[];
}

export class MultipartError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "MultipartError";
    this.status = status;
  }
}

export function parseMultipartBuffer(body: Buffer, contentType: string): MultipartForm {
  const header = contentType.toLowerCase();
  if (!header.includes("multipart/form-data")) {
    throw new MultipartError(
      415,
      "Image upload must use multipart/form-data.",
    );
  }

  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = (match?.[1] ?? match?.[2] ?? "").trim();
  if (!boundary) {
    throw new MultipartError(
      400,
      "Multipart upload is missing a boundary. Do not set Content-Type yourself; let the browser add it.",
    );
  }

  const delim = Buffer.from(`--${boundary}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  let cursor = body.indexOf(delim);
  if (cursor < 0) {
    throw new MultipartError(400, "Malformed multipart upload.");
  }
  cursor += delim.length;

  while (cursor < body.length) {
    if (body[cursor] === 45 && body[cursor + 1] === 45) break;
    if (body[cursor] === 13 && body[cursor + 1] === 10) cursor += 2;

    const next = body.indexOf(delim, cursor);
    if (next < 0) break;

    let partEnd = next;
    if (partEnd >= 2 && body[partEnd - 2] === 13 && body[partEnd - 1] === 10) {
      partEnd -= 2;
    }

    const part = body.subarray(cursor, partEnd);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd >= 0) {
      const rawHeaders = part.subarray(0, headerEnd).toString("utf8");
      const data = part.subarray(headerEnd + 4);
      const name = /name="([^"]*)"/.exec(rawHeaders)?.[1] ?? "";
      const fileName = /filename="([^"]*)"/.exec(rawHeaders)?.[1];
      const partType =
        /content-type:\s*([^\r\n;]+)/i.exec(rawHeaders)?.[1]?.trim() ||
        "application/octet-stream";

      if (fileName != null && fileName !== "") {
        files.push({
          fieldName: name || "file",
          fileName,
          contentType: partType,
          data: Buffer.from(data),
        });
      } else if (name) {
        fields[name] = data.toString("utf8").replace(/\0/g, "");
      }
    }

    cursor = next + delim.length;
  }

  return { fields, files };
}

async function readLimitedBody(req: Request, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) {
      throw new MultipartError(413, "File is too large. Maximum size is 15 MB.");
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export async function readMultipartRequest(
  req: Request,
  maxBytes: number,
): Promise<MultipartForm> {
  const contentType = req.header("content-type") ?? "";
  const body = await readLimitedBody(req, maxBytes);
  if (body.length === 0) {
    throw new MultipartError(400, "Empty upload body.");
  }
  return parseMultipartBuffer(body, contentType);
}
