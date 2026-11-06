import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("public/images/badges");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function buildMedallionSvg({
  slug,
  rarity = "common",
  category = "getting-started",
  centerpiece,
}) {
  const metalColors = {
    common: { outer: "#cbd5e1", light: "#f8fafc", dark: "#64748b", ring: "#94a3b8" },
    rare: { outer: "#fb7185", light: "#ffe4e6", dark: "#9f1239", ring: "#f43f5e" },
    epic: { outer: "#818cf8", light: "#e0e7ff", dark: "#312e81", ring: "#6366f1" },
    legendary: { outer: "#f59e0b", light: "#fef9c3", dark: "#78350f", ring: "#d97706" },
  }[rarity];

  const basinColors = {
    "getting-started": { top: "#064e3b", mid: "#047857", bot: "#022c22", glow: "#10b981" },
    "creator-journey": { top: "#1e3a8a", mid: "#1d4ed8", bot: "#0f172a", glow: "#3b82f6" },
    "sharing-impact": { top: "#581c87", mid: "#7e22ce", bot: "#3b0764", glow: "#a855f7" },
    "milestones": { top: "#713f12", mid: "#b45309", bot: "#451a03", glow: "#f59e0b" },
    "creative-mastery": { top: "#18181b", mid: "#27272a", bot: "#09090b", glow: "#ec4899" },
  }[category];

  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Drop Shadow Filter -->
    <filter id="shadow-${slug}" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#090d16" flood-opacity="0.45" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#090d16" flood-opacity="0.3" />
    </filter>
    <filter id="innerGlow-${slug}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
      <feFlood flood-color="#000000" flood-opacity="0.5" />
      <feComposite in2="shadowDiff" operator="in" />
      <feComposite in2="SourceGraphic" operator="over" />
    </filter>

    <!-- Metallic Rim Gradients -->
    <linearGradient id="metalRim-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${metalColors.light}" />
      <stop offset="30%" stop-color="${metalColors.outer}" />
      <stop offset="50%" stop-color="${metalColors.light}" />
      <stop offset="75%" stop-color="${metalColors.dark}" />
      <stop offset="100%" stop-color="${metalColors.outer}" />
    </linearGradient>

    <linearGradient id="metalBevel-${slug}" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${metalColors.dark}" />
      <stop offset="50%" stop-color="${metalColors.light}" />
      <stop offset="100%" stop-color="${metalColors.dark}" />
    </linearGradient>

    <!-- Vitreous Enamel Basin Gradient -->
    <radialGradient id="enamelBasin-${slug}" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${basinColors.mid}" />
      <stop offset="60%" stop-color="${basinColors.top}" />
      <stop offset="100%" stop-color="${basinColors.bot}" />
    </radialGradient>

    <!-- Glass Dome Highlight -->
    <linearGradient id="glassReflection-${slug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Rim Glow -->
    <radialGradient id="rimGlow-${slug}" cx="50%" cy="50%" r="50%">
      <stop offset="75%" stop-color="${basinColors.glow}" stop-opacity="0" />
      <stop offset="100%" stop-color="${basinColors.glow}" stop-opacity="0.4" />
    </radialGradient>
  </defs>

  <!-- Outer Metallic Bezel with 3D Drop Shadow -->
  <circle cx="256" cy="256" r="236" fill="url(#metalRim-${slug})" filter="url(#shadow-${slug})" />
  
  <!-- Outer Chamfer Edge -->
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#metalBevel-${slug})" stroke-width="4" />

  <!-- Outer Coin-Edge / Stud Accents -->
  <g fill="${metalColors.light}" opacity="0.85">
    ${Array.from({ length: 16 })
      .map((_, i) => {
        const angle = (i * 360) / 16;
        const rad = (angle * Math.PI) / 180;
        const x = (256 + 218 * Math.cos(rad)).toFixed(2);
        const y = (256 + 218 * Math.sin(rad)).toFixed(2);
        return `<circle cx="${x}" cy="${y}" r="3.5" />`;
      })
      .join("\n    ")}
  </g>

  <!-- Inner Step Ring -->
  <circle cx="256" cy="256" r="206" fill="url(#metalRim-${slug})" stroke="${metalColors.dark}" stroke-width="2" />
  
  <!-- Guilloché Micro-Fluting Track -->
  <circle cx="256" cy="256" r="198" fill="none" stroke="${metalColors.dark}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />
  <circle cx="256" cy="256" r="194" fill="none" stroke="${metalColors.light}" stroke-width="1" opacity="0.5" />

  <!-- Deep Vitreous Enamel Basin -->
  <circle cx="256" cy="256" r="186" fill="url(#enamelBasin-${slug})" />
  
  <!-- Ambient Edge Shadow within Basin -->
  <circle cx="256" cy="256" r="186" fill="none" stroke="#000000" stroke-width="6" opacity="0.35" />
  <!-- Ambient Edge Light within Basin -->
  <circle cx="256" cy="256" r="186" fill="url(#rimGlow-${slug})" />

  <!-- Concentric Sunburst / Guilloché Radians -->
  <g stroke="${basinColors.glow}" stroke-width="1" opacity="0.18">
    ${Array.from({ length: 24 })
      .map((_, i) => {
        const a = (i * 360) / 24;
        const r = (a * Math.PI) / 180;
        const x1 = (256 + 90 * Math.cos(r)).toFixed(2);
        const y1 = (256 + 90 * Math.sin(r)).toFixed(2);
        const x2 = (256 + 180 * Math.cos(r)).toFixed(2);
        const y2 = (256 + 180 * Math.sin(r)).toFixed(2);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      })
      .join("\n    ")}
  </g>

  <!-- CENTERPIECE MOTIF -->
  <g id="centerpiece-${slug}">
    ${centerpiece}
  </g>

  <!-- Polished Domed Glass Specular Reflection -->
  <path d="M 110 210 C 130 110, 382 110, 402 210 C 342 165, 170 165, 110 210 Z" fill="url(#glassReflection-${slug})" pointer-events="none" />
  
  <!-- Subtle Lower Rim Glint -->
  <path d="M 160 410 C 220 435, 292 435, 352 410 C 312 422, 200 422, 160 410 Z" fill="#ffffff" opacity="0.25" pointer-events="none" />
</svg>`;
}

const firstStepCenterpiece = `
  <!-- Studio Doorway Base Shadow -->
  <ellipse cx="256" cy="360" rx="90" ry="14" fill="#000000" opacity="0.4" />
  
  <!-- Steps Leading Up -->
  <path d="M 180 354 L 332 354 L 322 368 L 190 368 Z" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
  <path d="M 194 342 L 318 342 L 312 354 L 200 354 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2" />

  <!-- Door Frame -->
  <path d="M 196 342 L 196 210 Q 256 148 316 210 L 316 342 Z" fill="#1e293b" stroke="#f8fafc" stroke-width="6" />
  
  <!-- Glowing Interior Aperture -->
  <path d="M 204 340 L 204 214 Q 256 160 308 214 L 308 340 Z" fill="#fef08a" />
  <path d="M 210 338 L 210 218 Q 256 170 302 218 L 302 338 Z" fill="#fde047" opacity="0.9" />

  <!-- Welcoming Light Beam Rays -->
  <polygon points="256,190 150,380 362,380" fill="#fef9c3" opacity="0.35" />

  <!-- Welcoming Studio Sparkles -->
  <g fill="#ffffff" filter="drop-shadow(0 0 4px #fbbf24)">
    <!-- Top Sparkle -->
    <path d="M 256 142 Q 256 156 266 156 Q 256 156 256 170 Q 256 156 246 156 Q 256 156 256 142 Z" />
    <!-- Left Sparkle -->
    <path d="M 160 230 Q 160 240 168 240 Q 160 240 160 250 Q 160 240 152 240 Q 160 240 160 230 Z" />
    <!-- Right Sparkle -->
    <path d="M 352 220 Q 352 232 362 232 Q 352 232 352 244 Q 352 232 342 232 Q 352 232 352 220 Z" />
    <!-- Mini floating stars -->
    <circle cx="180" cy="190" r="3" />
    <circle cx="330" cy="180" r="4" />
    <circle cx="285" cy="150" r="2.5" />
  </g>
`;

const svg = buildMedallionSvg({
  slug: "first-step",
  rarity: "common",
  category: "getting-started",
  centerpiece: firstStepCenterpiece,
});

const outPath = path.join(OUTPUT_DIR, "first-step.webp");
const buf = await sharp(Buffer.from(svg))
  .resize(512, 512)
  .webp({ quality: 85, effort: 6 })
  .toFile(outPath);

console.log("Rendered first-step.webp:", buf);

