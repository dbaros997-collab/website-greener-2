import type { Request, Response } from "express";

// Lightweight Server-Sent Events (SSE) hub. The public website opens a single
// long-lived connection to `/api/events`; whenever staff change content through
// the admin dashboard, the relevant route calls `broadcast(resource)` and every
// connected client is told to refetch immediately — no page reload required.

interface Client {
  id: number;
  res: Response;
}

const clients = new Set<Client>();
let nextId = 1;

// Proxies and load balancers can silently drop idle connections, so we send a
// comment line periodically to keep the stream alive.
const HEARTBEAT_MS = 25_000;

export function addClient(req: Request, res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Disable proxy buffering so events flush to the client immediately.
    "X-Accel-Buffering": "no",
  });
  // An initial comment opens the stream and flushes headers.
  res.write(": connected\n\n");

  const client: Client = { id: nextId++, res };
  clients.add(client);

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

// Notify every connected client that a content resource changed. A write can
// fail if a connection died without firing its 'close' event; such clients are
// dropped so one broken stream never blocks delivery to the others.
export function broadcast(resource: string): void {
  const payload = JSON.stringify({ resource, at: Date.now() });
  const frame = `event: content-changed\ndata: ${payload}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(frame);
      // Compression / proxy layers may buffer until flush.
      const flushable = client.res as Response & { flush?: () => void };
      flushable.flush?.();
    } catch {
      clients.delete(client);
    }
  }
}
