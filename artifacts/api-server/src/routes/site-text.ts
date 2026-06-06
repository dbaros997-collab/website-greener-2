import { Router, type IRouter } from "express";
import { db, siteTextTable } from "@workspace/db";
import { UpdateSiteTextBody, ListSiteTextResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

// Canonical, editable section-level copy. This is the single source of truth:
// the GET endpoint merges these defaults with any saved DB overrides, so the
// admin always has the full set of fields to edit even before anything is
// saved, and the public site degrades to these exact strings when the API is
// unreachable.
interface SiteTextBlock {
  key: string;
  label: string;
  multiline: boolean;
  defaultValue: string;
}

const SITE_TEXT_BLOCKS: SiteTextBlock[] = [
  {
    key: "about_heading",
    label: "About — Heading",
    multiline: false,
    defaultValue: "A School Built on Faith, Vision & Excellence",
  },
  {
    key: "about_body",
    label: "About — Body paragraph",
    multiline: true,
    defaultValue:
      "Grace High School – Gayaza is a Christian-founded school focused on producing students who are morally upright and Christ-like leaders of tomorrow.",
  },
  {
    key: "about_vision",
    label: "About — Vision statement",
    multiline: true,
    defaultValue:
      "A centre of excellence that shapes exceptional individuals who will make a defining difference in our world.",
  },
  {
    key: "about_mission",
    label: "About — Mission statement",
    multiline: true,
    defaultValue:
      "To create unique learners who are socially functional, analytically precise, financially savvy and very creative in all areas of life for the glorification of God.",
  },
  {
    key: "programmes_heading",
    label: "Programmes — Heading",
    multiline: false,
    defaultValue: "Our Programmes",
  },
  {
    key: "programmes_intro",
    label: "Programmes — Intro paragraph",
    multiline: true,
    defaultValue:
      "A comprehensive National Curriculum across O-Level and A-Level, complemented by vocational programmes that prepare students for life beyond school.",
  },
  {
    key: "admissions_heading",
    label: "Admissions — Heading",
    multiline: false,
    defaultValue: "Join the Grace Family",
  },
  {
    key: "admissions_intro",
    label: "Admissions — Intro paragraph",
    multiline: true,
    defaultValue:
      "Admissions are currently open for all classes — S1 through S6. We welcome students and families who share our commitment to faith, excellence, and vision.",
  },
];

const blockByKey = new Map(SITE_TEXT_BLOCKS.map((b) => [b.key, b]));

const router: IRouter = Router();

router.get("/site-text", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteTextTable);
  const valueByKey = new Map(rows.map((r) => [r.key, r.value]));

  const merged = SITE_TEXT_BLOCKS.map((block, index) => ({
    key: block.key,
    label: block.label,
    value: valueByKey.get(block.key) ?? block.defaultValue,
    multiline: block.multiline,
    sortOrder: index,
  }));

  res.json(ListSiteTextResponse.parse(merged));
});

router.patch(
  "/site-text/:key",
  requireAuth,
  async (req, res): Promise<void> => {
    const key = String(req.params.key);
    const block = blockByKey.get(key);
    if (!block) {
      res.status(404).json({ error: "Unknown text block key" });
      return;
    }

    const parsed = UpdateSiteTextBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ errors: parsed.error.message }, "Invalid site text body");
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const sortOrder = SITE_TEXT_BLOCKS.findIndex((b) => b.key === key);

    await db
      .insert(siteTextTable)
      .values({
        key: block.key,
        label: block.label,
        value: parsed.data.value,
        multiline: block.multiline,
        sortOrder,
      })
      .onConflictDoUpdate({
        target: siteTextTable.key,
        set: { value: parsed.data.value, label: block.label, multiline: block.multiline, sortOrder },
      });

    res.json({
      key: block.key,
      label: block.label,
      value: parsed.data.value,
      multiline: block.multiline,
      sortOrder,
    });
  },
);

export default router;
