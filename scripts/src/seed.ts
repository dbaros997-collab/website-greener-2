import {
  randomBytes,
  scrypt as scryptCb,
} from "node:crypto";
import { promisify } from "node:util";
import {
  db,
  pool,
  staffUsersTable,
  newsItemsTable,
  testimonialsTable,
  videosTable,
  programmesTable,
  statsTable,
  schoolValuesTable,
  admissionStepsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

// Mirror of api-server's hashPassword (`scrypt:<saltHex>:<hashHex>`); scripts
// cannot import from artifact packages.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function seedAdmin(): Promise<void> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn(
      "ADMIN_USERNAME / ADMIN_PASSWORD not set — skipping admin account seed",
    );
    return;
  }

  const existing = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username));

  if (existing.length > 0) {
    console.log(`Admin account "${username}" already exists — skipping`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staffUsersTable).values({ username, passwordHash });
  console.log(`Created admin account "${username}"`);
}

// Insert seed rows only when the table is empty, assigning sortOrder by index.
async function seedTable<T extends Record<string, unknown>>(
  name: string,
  table: PgTable,
  rows: T[],
): Promise<void> {
  const existing = await db.select().from(table);
  if (existing.length > 0) {
    console.log(`${name}: already has ${existing.length} rows — skipping`);
    return;
  }
  const withOrder = rows.map((r, i) => ({ ...r, sortOrder: i }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.insert(table as any).values(withOrder);
  console.log(`${name}: seeded ${rows.length} rows`);
}

async function main(): Promise<void> {
  await seedAdmin();

  await seedTable("news_items", newsItemsTable, [
    { message: "Admissions Open for 2025/2026 — All Classes S1–S6" },
    {
      message:
        "UACE 2023 — Katumwa Hannington scores 20 Points — Glory Be to God!",
    },
    {
      message:
        "Grace High School featured on Spark TV for Extra-Curricular Excellence",
    },
    {
      message:
        "Students represent at National Renewable Energy Conference 2023",
    },
    { message: "New Term III begins 14 July 2025 — All students report" },
  ]);

  await seedTable("stats", statsTable, [
    { value: "28", label: "Acre Campus" },
    { value: "S1–S6", label: "All Levels" },
    { value: "UCE", label: "& UACE" },
    { value: "100%", label: "Christian Values" },
    { value: "∞", label: "Opportunities" },
  ]);

  await seedTable("testimonials", testimonialsTable, [
    {
      quote:
        "Grace High School gave me more than grades — it gave me faith, discipline, and purpose. My UACE results opened doors I never imagined.",
      name: "Katumwa Hannington",
      role: "UACE 2023 — 20 Points",
      initials: "KH",
    },
    {
      quote:
        "The teachers here go beyond the syllabus. They invest in you as a person, not just a student. I feel ready for university and for life.",
      name: "Ainebyoona Miriam",
      role: "S6 Graduate, 2024",
      initials: "AM",
    },
    {
      quote:
        "As a parent, I have watched my son transform — academically and morally. The Christian foundation at Grace is real, not just on paper.",
      name: "Mr. Byaruhanga",
      role: "Parent of S4 Student",
      initials: "BB",
    },
    {
      quote:
        "The vocational skills programme taught me tailoring alongside my A-Levels. I already have income while I wait for university admission.",
      name: "Namutebi Rose",
      role: "A-Level Graduate, 2024",
      initials: "NR",
    },
  ]);

  await seedTable("videos", videosTable, [
    {
      title: "Grace High School — Featured Video",
      category: "Featured",
      youtubeId: "c6dBmvv4BLQ",
    },
  ]);

  await seedTable("programmes", programmesTable, [
    {
      tag: "S1 – S4",
      title: "Ordinary Level",
      description:
        "Four years of broad foundational education leading to the Uganda Certificate of Education (UCE), setting students up for A-Level and beyond.",
      subjects: [
        "Mathematics",
        "Sciences",
        "English",
        "History",
        "Geography",
        "CRE",
        "SST",
        "Languages",
      ],
    },
    {
      tag: "S5 – S6",
      title: "Advanced Level",
      description:
        "Two-year advanced programme leading to the Uganda Advanced Certificate of Education (UACE), preparing students for university entrance.",
      subjects: ["Sciences", "Arts", "Business", "ICT", "Agriculture", "Economics"],
    },
    {
      tag: "Extracurricular",
      title: "Vocational Skills",
      description:
        "Practical skills training alongside academics, equipping students with capabilities that create real-world opportunities.",
      subjects: [
        "Entrepreneurship",
        "Life Skills",
        "Sports",
        "Arts & Crafts",
        "Leadership",
        "Welding",
      ],
    },
  ]);

  await seedTable("school_values", schoolValuesTable, [
    {
      icon: "✝️",
      title: "Faith",
      description:
        "Grounded in Christian teaching, we nurture a deep, personal faith in every student.",
    },
    {
      icon: "🎓",
      title: "Excellence",
      description:
        "We push every student to reach their full academic and personal potential.",
    },
    {
      icon: "🤝",
      title: "Integrity",
      description:
        "Honesty, respect, and moral uprightness are non-negotiable at Grace.",
    },
    {
      icon: "🌱",
      title: "Growth",
      description:
        "Continuous improvement — spiritually, intellectually, and as a community.",
    },
  ]);

  await seedTable("admission_steps", admissionStepsTable, [
    {
      title: "Contact the School",
      description:
        "Call or email us to express interest and get an admissions form.",
    },
    {
      title: "Visit Our Campus",
      description:
        "Schedule a tour of our 28-acre campus in Gayaza, Wakiso District.",
    },
    {
      title: "Submit Application",
      description:
        "Complete the form with academic records and personal information.",
    },
    {
      title: "Placement Assessment",
      description:
        "Students may sit a brief assessment to identify the right class.",
    },
    {
      title: "Confirm Enrollment",
      description:
        "Receive your admission letter, pay fees, and report on opening day.",
    },
  ]);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
