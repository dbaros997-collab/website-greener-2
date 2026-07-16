/**
 * One-shot: compress public-site photos into attached_assets/optimized/*.webp
 * Run: node scripts/optimize-site-images.mjs
 * Requires sharp (e.g. npm install sharp in tmp-sharp/).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "attached_assets");
const outDir = path.join(srcDir, "optimized");

const require = createRequire(path.join(root, "tmp-sharp", "package.json"));
const sharp = require("sharp");

/** @type {{ in: string, out: string, width: number, height?: number, quality?: number, square?: boolean, coolSkin?: boolean, faceCrop?: boolean }[]} */
const jobs = [
  { in: "school_logo_transparent.png", out: "school-logo.webp", width: 256, quality: 90 },
  { in: "SSEKAMATTE_SIMON_1780946570401.png", out: "head-teacher.webp", width: 900, quality: 78 },
  { in: "IMG_9926_1780652934166.jpg", out: "campus-hero.webp", width: 1600, quality: 72 },
  { in: "3@_(7)_1780653886082.JPG", out: "alevel.webp", width: 1400, quality: 72 },
  { in: "3@_(5)_1781252589025.JPG", out: "students-group.webp", width: 1400, quality: 72 },
  { in: "IMG_20230304_115149_291_1781375070289.jpg", out: "hotsprings.webp", width: 1400, quality: 72 },
  { in: "IMG_0062_1781375708800.jpg", out: "library.webp", width: 1400, quality: 72 },
  { in: "IMG_3673_1781376146283.JPG", out: "dance.webp", width: 1400, quality: 72 },
  // Square face crops for circular admin portraits (retina-friendly).
  // Crop from the upper body of the portrait so the full head stays in frame.
  {
    in: "MUGERWA_DENIS_navy.png",
    out: "dean-students.webp",
    width: 720,
    height: 720,
    quality: 92,
    square: true,
    coolSkin: true,
    faceCrop: true,
  },
  { in: "Nakabiito_Linda_final.png", out: "careers-mistress.webp", width: 720, height: 720, quality: 92, square: true, faceCrop: true },
  { in: "Namuyomba_Viola_final.png", out: "viola.webp", width: 720, height: 720, quality: 92, square: true, faceCrop: true },
  { in: "Gemini_Generated_Image_y5ddwmy5ddwmy5dd_1781256435846.png", out: "crafts.webp", width: 1200, quality: 75 },
  { in: "featured_video_thumb_1780677204039.png", out: "featured-video.webp", width: 800, quality: 75 },
  // School Gallery — Life at Grace High School
  { in: "gallery_hike.png", out: "gallery-hike.webp", width: 1400, quality: 85 },
  { in: "gallery_roast.png", out: "gallery-roast.webp", width: 1400, quality: 85 },
  { in: "gallery_library.png", out: "gallery-library.webp", width: 1400, quality: 85 },
  { in: "gallery_girls.png", out: "gallery-girls.webp", width: 1400, quality: 85 },
  { in: "gallery_ribbon.png", out: "gallery-ribbon.webp", width: 1400, quality: 85 },
];

fs.mkdirSync(outDir, { recursive: true });

let before = 0;
let after = 0;

for (const job of jobs) {
  const input = path.join(srcDir, job.in);
  const output = path.join(outDir, job.out);
  if (!fs.existsSync(input)) {
    console.error("Missing:", job.in);
    process.exitCode = 1;
    continue;
  }
  const inSize = fs.statSync(input).size;
  before += inSize;
  let pipeline = sharp(input).rotate();
  // Soften an orange/red skin cast without turning whites cyan.
  if (job.coolSkin) {
    pipeline = pipeline
      .modulate({ saturation: 0.86, brightness: 1.04 })
      .linear([0.9, 1.0, 1.07], [6, 3, 0]);
  }
  if (job.square) {
    if (job.faceCrop) {
      // Pad headroom so circular frames don't clip the top of the head.
      pipeline = pipeline.extend({
        top: 120,
        bottom: 40,
        left: 70,
        right: 70,
        background: { r: 10, g: 64, b: 32, alpha: 1 },
      });
    }
    pipeline = pipeline
      .resize(job.width, job.height ?? job.width, {
        fit: "cover",
        position: job.faceCrop ? "top" : "attention",
      })
      .sharpen({ sigma: 0.5 });
  } else {
    pipeline = pipeline.resize({ width: job.width, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: job.quality ?? 75, effort: 5 }).toFile(output);
  const outSize = fs.statSync(output).size;
  after += outSize;
  console.log(
    `${job.out}: ${(inSize / 1024 / 1024).toFixed(2)}MB → ${(outSize / 1024).toFixed(0)}KB`,
  );
}

console.log(
  `\nTotal: ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - after / before) * 100)}% smaller)`,
);
