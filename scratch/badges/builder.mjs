// ============================================================================
// Suprilo 3D Enamel Medallion Chassis Builder
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0 (Section 12)
// ============================================================================

export function buildMedallionChassis({
  slug,
  rarity = "common",
  category = "getting-started",
  centerpiece,
}) {
  const metalColors = {
    common: {
      outer: "#cbd5e1",
      light: "#f8fafc",
      dark: "#64748b",
      ring: "#94a3b8",
      accent: "#e2e8f0",
      stud: "#ffffff",
    },
    rare: {
      outer: "#fb7185",
      light: "#ffe4e6",
      dark: "#9f1239",
      ring: "#f43f5e",
      accent: "#fecdd3",
      stud: "#fff1f2",
    },
    epic: {
      outer: "#818cf8",
      light: "#e0e7ff",
      dark: "#312e81",
      ring: "#6366f1",
      accent: "#c7d2fe",
      stud: "#ede9fe",
    },
    legendary: {
      outer: "#f59e0b",
      light: "#fef9c3",
      dark: "#78350f",
      ring: "#d97706",
      accent: "#fde047",
      stud: "#fef08a",
    },
  }[rarity] || {
    outer: "#cbd5e1",
    light: "#f8fafc",
    dark: "#64748b",
    ring: "#94a3b8",
    accent: "#e2e8f0",
    stud: "#ffffff",
  };

  const basinColors = {
    "getting-started": {
      top: "#064e3b",
      mid: "#047857",
      bot: "#022c22",
      glow: "#10b981",
      flare: "#34d399",
    },
    "creator-journey": {
      top: "#1e3a8a",
      mid: "#1d4ed8",
      bot: "#0f172a",
      glow: "#3b82f6",
      flare: "#60a5fa",
    },
    "sharing-impact": {
      top: "#581c87",
      mid: "#7e22ce",
      bot: "#3b0764",
      glow: "#a855f7",
      flare: "#c084fc",
    },
    "milestones": {
      top: "#713f12",
      mid: "#b45309",
      bot: "#451a03",
      glow: "#f59e0b",
      flare: "#fbbf24",
    },
    "creative-mastery": {
      top: "#18181b",
      mid: "#27272a",
      bot: "#09090b",
      glow: "#ec4899",
      flare: "#f43f5e",
    },
  }[category] || {
    top: "#1e293b",
    mid: "#334155",
    bot: "#0f172a",
    glow: "#94a3b8",
    flare: "#cbd5e1",
  };

  const isLegendary = rarity === "legendary";
  const isEpic = rarity === "epic";
  const numStuds = isLegendary ? 24 : isEpic ? 20 : 16;

  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Drop Shadow Filter for 3D Float -->
    <filter id="shadow-${slug}" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#05070e" flood-opacity="0.5" />
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#05070e" flood-opacity="0.3" />
    </filter>

    <!-- Metallic Rim Multi-Stop Gradients -->
    <linearGradient id="metalRim-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${metalColors.light}" />
      <stop offset="25%" stop-color="${metalColors.outer}" />
      <stop offset="48%" stop-color="${metalColors.light}" />
      <stop offset="72%" stop-color="${metalColors.dark}" />
      <stop offset="100%" stop-color="${metalColors.outer}" />
    </linearGradient>

    <linearGradient id="metalBevel-${slug}" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${metalColors.dark}" />
      <stop offset="50%" stop-color="${metalColors.light}" />
      <stop offset="100%" stop-color="${metalColors.dark}" />
    </linearGradient>

    <!-- Vitreous Enamel Basin Gradient -->
    <radialGradient id="enamelBasin-${slug}" cx="45%" cy="32%" r="68%">
      <stop offset="0%" stop-color="${basinColors.mid}" />
      <stop offset="65%" stop-color="${basinColors.top}" />
      <stop offset="100%" stop-color="${basinColors.bot}" />
    </radialGradient>

    <!-- Glass Dome Highlight -->
    <linearGradient id="glassReflection-${slug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Rim Glow -->
    <radialGradient id="rimGlow-${slug}" cx="50%" cy="50%" r="50%">
      <stop offset="75%" stop-color="${basinColors.glow}" stop-opacity="0" />
      <stop offset="100%" stop-color="${basinColors.glow}" stop-opacity="0.35" />
    </radialGradient>
  </defs>

  <!-- Outer Metallic Bezel with 3D Drop Shadow -->
  <circle cx="256" cy="256" r="236" fill="url(#metalRim-${slug})" filter="url(#shadow-${slug})" />
  
  <!-- Outer Chamfer Edge -->
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#metalBevel-${slug})" stroke-width="4" />

  <!-- Outer Coin-Edge / Stud Accents -->
  <g fill="${metalColors.stud}" opacity="0.9">
    ${Array.from({ length: numStuds })
      .map((_, i) => {
        const angle = (i * 360) / numStuds;
        const rad = (angle * Math.PI) / 180;
        const x = (256 + 218 * Math.cos(rad)).toFixed(2);
        const y = (256 + 218 * Math.sin(rad)).toFixed(2);
        return `<circle cx="${x}" cy="${y}" r="${isLegendary ? 4 : 3.5}" />`;
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
  <g stroke="${basinColors.glow}" stroke-width="1" opacity="0.16">
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

