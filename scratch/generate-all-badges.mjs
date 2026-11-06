// ============================================================================
// Suprilo — 50 Canonical Bespoke 3D Enamel Badge Artwork Generator
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0 (Section 12)
//
// Target Specifications:
// - Format: Transparent WebP
// - Resolution: 512x512
// - File Size: < 45 KB per asset target
// - Output Directory: public/images/badges/
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { buildMedallionChassis } from "./badges/builder.mjs";
import { CATEGORY_1_BADGES } from "./badges/category1.mjs";
import { CATEGORY_2_BADGES } from "./badges/category2.mjs";
import { CATEGORY_3_BADGES } from "./badges/category3.mjs";
import { CATEGORY_4_BADGES } from "./badges/category4.mjs";
import { CATEGORY_5_BADGES } from "./badges/category5.mjs";

const ALL_BADGES = [
  ...CATEGORY_1_BADGES,
  ...CATEGORY_2_BADGES,
  ...CATEGORY_3_BADGES,
  ...CATEGORY_4_BADGES,
  ...CATEGORY_5_BADGES,
];

const OUTPUT_DIR = path.resolve("public/images/badges");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("================================================================================");
console.log(" Suprilo Phase 3 — Generating 50 Bespoke 3D Enamel Medallion Artworks");
console.log("================================================================================\n");
console.log(`Destination Directory: ${OUTPUT_DIR}`);
console.log(`Total Badges in Pipeline: ${ALL_BADGES.length}\n`);

const results = [];
let totalBytes = 0;
const startTime = Date.now();

for (let i = 0; i < ALL_BADGES.length; i++) {
  const badge = ALL_BADGES[i];
  const num = i + 1;
  const fileName = `${badge.slug}.webp`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const svg = buildMedallionChassis({
    slug: badge.slug,
    rarity: badge.rarity,
    category: badge.category,
    centerpiece: badge.centerpiece,
  });

  const info = await sharp(Buffer.from(svg))
    .resize(512, 512)
    .webp({ quality: 85, effort: 6 })
    .toFile(filePath);

  totalBytes += info.size;
  const kb = (info.size / 1024).toFixed(1);
  const compliant = info.size < 45 * 1024 ? "PASS (<45KB)" : "WARN (>45KB)";

  results.push({
    index: num,
    slug: badge.slug,
    name: badge.name,
    rarity: badge.rarity,
    category: badge.category,
    size: info.size,
    kb,
    compliant,
  });

  console.log(
    ` [${String(num).padStart(2, "0")}/50] ${badge.slug.padEnd(22)} | ${badge.rarity.padEnd(9)} | ${kb.padStart(5)} KB | ${compliant}`
  );
}

const elapsedMs = Date.now() - startTime;
const avgKb = (totalBytes / ALL_BADGES.length / 1024).toFixed(1);

console.log("\n================================================================================");
console.log(` COMPLETE: Generated ${results.length}/50 WebP Medallions in ${(elapsedMs / 1000).toFixed(2)}s`);
console.log(` Total Payload Size: ${(totalBytes / 1024).toFixed(1)} KB (Average: ${avgKb} KB per asset)`);
console.log(` Target Compliance (< 45 KB): ${results.every((r) => r.size < 45 * 1024) ? "100% PASS" : "NON-COMPLIANT ASSETS FOUND"}`);
console.log("================================================================================");

// Save JSON manifest of generated artwork assets
const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), "utf8");
console.log(`\nArtwork manifest saved to: ${manifestPath}`);

