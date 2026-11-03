import { asc, desc } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { announcements, galleryItems, schoolEvents, staffProfiles } from "@/db/schema";
import { LIVE_SITE } from "@/lib/constants";
import { fail, requireExport } from "@/lib/http";

export const dynamic = "force-dynamic";

const COLLECTIONS = ["gallery", "announcements", "events", "staff"] as const;
type Collection = (typeof COLLECTIONS)[number];

function csvCell(value: unknown) {
  const text = value == null ? "" : Array.isArray(value) ? value.join("|") : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const gate = await requireExport();
  if ("error" in gate) return gate.error;
  await ensureReady();

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const db = getDb();
  const [gallery, news, events, staff] = await Promise.all([
    db.select().from(galleryItems).orderBy(desc(galleryItems.id)),
    db.select().from(announcements).orderBy(desc(announcements.id)),
    db.select().from(schoolEvents).orderBy(asc(schoolEvents.startsAt)),
    db.select().from(staffProfiles).orderBy(asc(staffProfiles.name)),
  ]);

  if (format === "json") {
    const body = JSON.stringify(
      {
        school: "Grace High School Gayaza",
        site: LIVE_SITE,
        exportedAt: new Date().toISOString(),
        gallery,
        announcements: news,
        events,
        staff,
      },
      null,
      2,
    );
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="grace-high-school-gayaza-${stamp()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format !== "csv") return fail("Choose JSON or CSV.");
  const collection = url.searchParams.get("collection");
  if (!COLLECTIONS.includes(collection as Collection)) {
    return fail("Choose gallery, announcements, events, or staff for the CSV export.");
  }

  const tables: Record<Collection, { headers: string[]; rows: unknown[][] }> = {
    gallery: {
      headers: ["id", "title", "description", "category", "mediaType", "mediaUrl", "takenOn", "featured", "status"],
      rows: gallery.map((item) => [
        item.id,
        item.title,
        item.description,
        item.category,
        item.mediaType,
        item.mediaUrl,
        item.takenOn,
        item.featured,
        item.status,
      ]),
    },
    announcements: {
      headers: ["id", "title", "body", "priority", "status", "publishAt"],
      rows: news.map((item) => [item.id, item.title, item.body, item.priority, item.status, item.publishAt]),
    },
    events: {
      headers: ["id", "title", "description", "eventType", "venue", "startsAt", "endsAt", "audiences", "status"],
      rows: events.map((item) => [
        item.id,
        item.title,
        item.description,
        item.eventType,
        item.venue,
        item.startsAt,
        item.endsAt,
        item.audiences,
        item.status,
      ]),
    },
    staff: {
      headers: ["id", "name", "title", "department", "bio", "photoUrl", "email", "phone", "staffGroup", "visible"],
      rows: staff.map((item) => [
        item.id,
        item.name,
        item.title,
        item.department,
        item.bio,
        item.photoUrl,
        item.email,
        item.phone,
        item.staffGroup,
        item.visible,
      ]),
    },
  };

  const table = tables[collection as Collection];
  return new Response(toCsv(table.headers, table.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="grace-high-school-gayaza-${collection}-${stamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
