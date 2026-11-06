// ============================================================================
// Suprilo 50-Badge Bespoke 3D Enamel Medallion Generator
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0 (Section 12)
// Target: 512x512 transparent WebP, < 45 KB per asset
// Destination: public/images/badges/[slug].webp
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("public/images/badges");

// Rarity metallic palette definitions
const RARITY_THEMES = {
  common: {
    // Polished Aluminum / Chrome
    outerRingStart: "#f8fafc",
    outerRingMid: "#cbd5e1",
    outerRingEnd: "#64748b",
    bevelLight: "#ffffff",
    bevelDark: "#475569",
    innerRing: "#94a3b8",
    studColor: "#e2e8f0",
  },
  rare: {
    // Lustrous Rose Gold
    outerRingStart: "#ffe4e6",
    outerRingMid: "#fb7185",
    outerRingEnd: "#9f1239",
    bevelLight: "#fff1f2",
    bevelDark: "#881337",
    innerRing: "#f43f5e",
    studColor: "#fecdd3",
  },
  epic: {
    // Polished Titanium / Iridescent Violet
    outerRingStart: "#e0e7ff",
    outerRingMid: "#818cf8",
    outerRingEnd: "#312e81",
    bevelLight: "#ede9fe",
    bevelDark: "#1e1b4b",
    innerRing: "#6366f1",
    studColor: "#c7d2fe",
  },
  legendary: {
    // 24K Tiered Pure Gold
    outerRingStart: "#fef9c3",
    outerRingMid: "#f59e0b",
    outerRingEnd: "#78350f",
    bevelLight: "#fef08a",
    bevelDark: "#451a03",
    innerRing: "#d97706",
    studColor: "#fde047",
  },
};

// Category vitreous enamel basin palettes
const CATEGORY_BASINS = {
  "getting-started": {
    basinTop: "#064e3b",
    basinCenter: "#047857",
    basinBottom: "#022c22",
    accent: "#34d399",
  },
  "creator-journey": {
    basinTop: "#1e3a8a",
    basinCenter: "#1d4ed8",
    basinBottom: "#0f172a",
    accent: "#60a5fa",
  },
  "sharing-impact": {
    basinTop: "#581c87",
    basinCenter: "#7e22ce",
    basinBottom: "#3b0764",
    accent: "#c084fc",
  },
  "milestones": {
    basinTop: "#713f12",
    basinCenter: "#b45309",
    basinBottom: "#451a03",
    accent: "#fbbf24",
  },
  "creative-mastery": {
    basinTop: "#18181b",
    basinCenter: "#27272a",
    basinBottom: "#09090b",
    accent: "#f43f5e",
  },
};

export { OUTPUT_DIR, RARITY_THEMES, CATEGORY_BASINS };

