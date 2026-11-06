import fs from "fs";

const manifest = JSON.parse(fs.readFileSync("public/images/badges/manifest.json", "utf8"));
console.log("Total badges in manifest:", manifest.length);

let missing = 0;
let overSize = 0;

for (const badge of manifest) {
  const filePath = `public/images/badges/${badge.slug}.webp`;
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${filePath}`);
    missing++;
  } else {
    const stats = fs.statSync(filePath);
    if (stats.size > 45 * 1024) {
      console.warn(`OVER 45KB: ${badge.slug} (${(stats.size / 1024).toFixed(1)} KB)`);
      overSize++;
    }
  }
}

console.log(`Summary: Missing: ${missing}, Over 45KB: ${overSize}`);

