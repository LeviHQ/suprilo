// ============================================================================
// Category 3: Sharing & Impact (Badges 23–32)
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// ============================================================================

export const CATEGORY_3_BADGES = [
  {
    slug: "first-view",
    name: "First Impression",
    rarity: "common",
    category: "sharing-impact",
    centerpiece: `
      <!-- Gentle crystal eye beholding a glowing card -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Glowing Miniature Card -->
      <g transform="translate(256, 305)">
        <rect x="-35" y="-20" width="70" height="42" rx="4" fill="#fef08a" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 8px #fbbf24)" />
        <circle cx="0" cy="1" r="8" fill="#f59e0b" />
      </g>
      <!-- Crystal Eye (Almond Profile) -->
      <g filter="drop-shadow(0 4px 8px #3b0764)">
        <path d="M 170 210 Q 256 140 342 210 Q 256 280 170 210 Z" fill="#f8fafc" stroke="#c084fc" stroke-width="4" />
        <!-- Iris (Translucent Violet / Cyan Crystal) -->
        <circle cx="256" cy="210" r="32" fill="#9333ea" stroke="#d8b4fe" stroke-width="2.5" />
        <!-- Pupil -->
        <circle cx="256" cy="210" r="16" fill="#1e1b4b" />
        <!-- Specular Highlight -->
        <circle cx="248" cy="202" r="7" fill="#ffffff" />
        <circle cx="266" cy="218" r="3" fill="#ffffff" />
      </g>
      <!-- Radiant Beams descending from eye to card -->
      <g stroke="#e9d5ff" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6">
        <line x1="220" y1="230" x2="235" y2="285" />
        <line x1="256" y1="242" x2="256" y2="285" />
        <line x1="292" y1="230" x2="277" y2="285" />
      </g>`,
  },
  {
    slug: "first-reveal",
    name: "First Reveal",
    rarity: "common",
    category: "sharing-impact",
    centerpiece: `
      <!-- Card half-scratched away revealing starlight -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Base Card Container -->
      <g transform="translate(180, 175) rotate(-6)">
        <rect x="0" y="0" width="155" height="115" rx="8" fill="#1e1b4b" stroke="#ffffff" stroke-width="3.5" filter="drop-shadow(0 4px 6px #0f172a)" />
        <!-- Left Half: Metallic Scratch Foil -->
        <path d="M 0 0 L 75 0 C 85 40, 60 70, 75 115 L 0 115 Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2" />
        <!-- Silver Foil Scratch Shavings -->
        <path d="M 20 25 Q 40 15 55 30" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
        <path d="M 15 65 Q 35 55 45 75" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round" />
        <!-- Right Half: Revealed Starlight & Gems -->
        <g fill="#fde047" filter="drop-shadow(0 0 6px #f59e0b)">
          <polygon points="115,35 120,45 130,45 122,52 125,62 115,56 105,62 108,52 100,45 110,45" />
          <circle cx="95" cy="85" r="8" fill="#38bdf8" />
          <circle cx="135" cy="80" r="4" fill="#ffffff" />
          <polygon points="125,95 128,102 135,102 129,107 131,114 125,110 119,114 121,107 115,102 122,102" />
        </g>
      </g>`,
  },
  {
    slug: "ten-views",
    name: "Spotted",
    rarity: "rare",
    category: "sharing-impact",
    centerpiece: `
      <!-- Binoculars projecting 10 sparkling beams of light -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- 10 Sparkling Beams Radiating Forward -->
      <g stroke="#fb7185" stroke-width="2" stroke-dasharray="8,4" opacity="0.7">
        ${Array.from({ length: 10 })
          .map((_, i) => {
            const angle = 140 + i * 28;
            const rad = (angle * Math.PI) / 180;
            const x2 = (256 + 130 * Math.cos(rad)).toFixed(1);
            const y2 = (210 + 90 * Math.sin(rad)).toFixed(1);
            return `<line x1="256" y1="220" x2="${x2}" y2="${y2}" />`;
          })
          .join("\n        ")}
      </g>
      <!-- Modern Binoculars in Rose Gold -->
      <g transform="translate(196, 210)" filter="drop-shadow(0 6px 8px #881337)">
        <!-- Left Barrel -->
        <rect x="0" y="20" width="46" height="75" rx="14" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <ellipse cx="23" cy="95" rx="23" ry="10" fill="#9f1239" stroke="#ffe4e6" stroke-width="2" />
        <ellipse cx="23" cy="95" rx="16" ry="6" fill="#38bdf8" />
        <!-- Right Barrel -->
        <rect x="74" y="20" width="46" height="75" rx="14" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <ellipse cx="97" cy="95" rx="23" ry="10" fill="#9f1239" stroke="#ffe4e6" stroke-width="2" />
        <ellipse cx="97" cy="95" rx="16" ry="6" fill="#38bdf8" />
        <!-- Center Bridge & Focus Wheel -->
        <rect x="42" y="35" width="36" height="20" rx="4" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2" />
        <rect x="52" y="25" width="16" height="38" rx="4" fill="#fde047" stroke="#b45309" stroke-width="1.5" />
      </g>`,
  },
  {
    slug: "fifty-views",
    name: "Crowd Gatherer",
    rarity: "rare",
    category: "sharing-impact",
    centerpiece: `
      <!-- Theater spotlight illuminating fifty glowing orbs -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Giant Spotlight Cone -->
      <polygon points="256,150 145,345 367,345" fill="#fef08a" fill-opacity="0.25" />
      <!-- Spotlight Fixture -->
      <g transform="translate(236, 135)" filter="drop-shadow(0 2px 4px #0f172a)">
        <polygon points="0,35 40,35 32,0 8,0" fill="#334155" stroke="#f8fafc" stroke-width="2" />
        <ellipse cx="20" cy="35" rx="20" ry="6" fill="#fde047" stroke="#ffffff" stroke-width="1.5" />
      </g>
      <!-- Constellation of Floating Glowing Orbs -->
      <g fill="#fde047" filter="drop-shadow(0 0 3px #f59e0b)">
        <circle cx="256" cy="220" r="7" fill="#ffffff" />
        <circle cx="230" cy="240" r="5" />
        <circle cx="280" cy="245" r="5.5" />
        <circle cx="210" cy="275" r="6" />
        <circle cx="256" cy="270" r="6.5" />
        <circle cx="300" cy="280" r="5" />
        <circle cx="185" cy="315" r="5.5" />
        <circle cx="235" cy="310" r="6" />
        <circle cx="280" cy="320" r="6" />
        <circle cx="325" cy="315" r="5" />
        <circle cx="205" cy="335" r="4.5" />
        <circle cx="256" cy="335" r="6" />
        <circle cx="305" cy="335" r="4.5" />
      </g>`,
  },
  {
    slug: "hundred-views",
    name: "Centurion View",
    rarity: "epic",
    category: "sharing-impact",
    centerpiece: `
      <!-- Lighthouse beacon radiating 360-degree light beams -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Dual Sweeping Beacon Beams -->
      <polygon points="256,195 110,135 110,240" fill="#38bdf8" fill-opacity="0.35" />
      <polygon points="256,195 402,135 402,240" fill="#38bdf8" fill-opacity="0.35" />
      <!-- Lighthouse Tower in Titanium -->
      <g transform="translate(231, 160)" filter="drop-shadow(0 4px 8px #1e1b4b)">
        <!-- Dome Roof -->
        <path d="M 10 35 C 10 15, 40 15, 40 35 Z" fill="#6366f1" stroke="#e0e7ff" stroke-width="2" />
        <polygon points="25,5 23,15 27,15" fill="#fde047" />
        <!-- Lantern Room & Beacon -->
        <rect x="8" y="35" width="34" height="25" fill="#fef08a" stroke="#ffffff" stroke-width="2" />
        <circle cx="25" cy="47" r="10" fill="#ffffff" filter="drop-shadow(0 0 6px #38bdf8)" />
        <!-- Balcony Gallery -->
        <rect x="3" y="60" width="44" height="8" rx="2" fill="#4338ca" stroke="#e0e7ff" stroke-width="1.5" />
        <!-- Tapered Tower Shaft -->
        <polygon points="6,68 44,68 49,150 1,150" fill="#e0e7ff" stroke="#4338ca" stroke-width="3" />
        <!-- Red/Violet Spiral Banding -->
        <polygon points="6,95 44,85 46,110 4,120" fill="#818cf8" />
        <!-- Base Door -->
        <path d="M 20 150 L 20 135 C 20 130, 30 130, 30 135 L 30 150 Z" fill="#1e1b4b" />
      </g>`,
  },
  {
    slug: "five-hundred-views",
    name: "Audience Magnet",
    rarity: "legendary",
    category: "sharing-impact",
    centerpiece: `
      <!-- Golden stadium amphitheater packed with fireworks -->
      <ellipse cx="256" cy="355" rx="90" ry="14" fill="#000000" opacity="0.45" />
      <!-- Fireworks Shell Bursts Overhead -->
      <g filter="drop-shadow(0 0 6px #f59e0b)">
        <!-- Left Firework Burst -->
        <g transform="translate(190, 160)" stroke="#fde047" stroke-width="2">
          <line x1="0" y1="-25" x2="0" y2="25" />
          <line x1="-25" y1="0" x2="25" y2="0" />
          <line x1="-18" y1="-18" x2="18" y2="18" />
          <line x1="-18" y1="18" x2="18" y2="-18" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" stroke="none" />
        </g>
        <!-- Center Giant Firework Burst -->
        <g transform="translate(256, 135)" stroke="#fbbf24" stroke-width="2.5">
          <line x1="0" y1="-32" x2="0" y2="32" />
          <line x1="-32" y1="0" x2="32" y2="0" />
          <line x1="-22" y1="-22" x2="22" y2="22" />
          <line x1="-22" y1="22" x2="22" y2="-22" />
          <circle cx="0" cy="0" r="6" fill="#ffffff" stroke="none" />
        </g>
        <!-- Right Firework Burst -->
        <g transform="translate(320, 160)" stroke="#fde047" stroke-width="2">
          <line x1="0" y1="-25" x2="0" y2="25" />
          <line x1="-25" y1="0" x2="25" y2="0" />
          <line x1="-18" y1="-18" x2="18" y2="18" />
          <line x1="-18" y1="18" x2="18" y2="-18" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" stroke="none" />
        </g>
      </g>
      <!-- Golden Stadium Amphitheater (Curved Colosseum Arc) -->
      <g transform="translate(256, 310)" filter="drop-shadow(0 6px 8px #451a03)">
        <!-- Outer Tier Arc -->
        <path d="M -95 10 C -95 -40, 95 -40, 95 10 C 95 35, -95 35, -95 10 Z" fill="#d97706" stroke="#fef08a" stroke-width="3" />
        <!-- Seating Arch Columns -->
        <g fill="#f59e0b" stroke="#78350f" stroke-width="1.5">
          <rect x="-80" y="-15" width="12" height="22" rx="3" />
          <rect x="-55" y="-25" width="12" height="25" rx="3" />
          <rect x="-30" y="-30" width="12" height="26" rx="3" />
          <rect x="-6" y="-32" width="12" height="26" rx="3" />
          <rect x="18" y="-30" width="12" height="26" rx="3" />
          <rect x="43" y="-25" width="12" height="25" rx="3" />
          <rect x="68" y="-15" width="12" height="22" rx="3" />
        </g>
        <!-- Arena Floor -->
        <ellipse cx="0" cy="12" rx="55" ry="16" fill="#fef08a" stroke="#b45309" stroke-width="2" />
        <text x="0" y="18" font-family="sans-serif" font-weight="900" font-size="16" fill="#78350f" text-anchor="middle">500+</text>
      </g>`,
  },
  {
    slug: "ten-reveals",
    name: "Party Starter",
    rarity: "rare",
    category: "sharing-impact",
    centerpiece: `
      <!-- Clustered bouquet of 10 blooming metallic confetti -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.35" />
      <!-- Ribbons & Confetti Streamers -->
      <path d="M 210 240 Q 180 200 200 160 Q 230 140 215 120" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" />
      <path d="M 302 240 Q 332 200 312 160 Q 282 140 297 120" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
      <!-- Center Party Popper Cone -->
      <g transform="translate(256, 320)" filter="drop-shadow(0 4px 6px #881337)">
        <polygon points="-25,0 25,0 0,45" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2.5" />
        <polygon points="-25,0 0,45 -12,0" fill="#be123c" />
      </g>
      <!-- Clustered 10 Metallic Confetti Blossoms -->
      <g filter="drop-shadow(0 2px 4px #0f172a)">
        ${[
          [256, 175, "#fde047"],
          [225, 195, "#fb7185"],
          [287, 195, "#38bdf8"],
          [200, 235, "#34d399"],
          [256, 225, "#ffffff"],
          [312, 235, "#c084fc"],
          [220, 275, "#fde047"],
          [256, 268, "#f43f5e"],
          [292, 275, "#38bdf8"],
          [256, 305, "#fbbf24"],
        ]
          .map(([x, y, color]) => {
            return `<circle cx="${x}" cy="${y}" r="11" fill="${color}" stroke="#ffffff" stroke-width="2" />
                    <circle cx="${x}" cy="${y}" r="5" fill="#0f172a" opacity="0.3" />`;
          })
          .join("\n        ")}
      </g>`,
  },
  {
    slug: "fifty-reveals",
    name: "Crowd Pleaser",
    rarity: "epic",
    category: "sharing-impact",
    centerpiece: `
      <!-- Prismatic glass box bursting open with 50 stars -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Prismatic Glass Casket Base -->
      <g transform="translate(196, 255)" filter="drop-shadow(0 6px 10px #1e1b4b)">
        <polygon points="0,35 60,65 120,35 120,70 60,100 0,70" fill="#6366f1" fill-opacity="0.75" stroke="#e0e7ff" stroke-width="3" />
        <polygon points="0,35 60,65 60,100 0,70" fill="#4338ca" fill-opacity="0.8" />
        <polygon points="60,65 120,35 120,70 60,100" fill="#3730a3" fill-opacity="0.8" />
        <!-- Open Hinged Lid Slanted Upward -->
        <polygon points="0,35 60,-5 120,35 60,15" fill="#818cf8" fill-opacity="0.6" stroke="#ffffff" stroke-width="2" />
      </g>
      <!-- Radiant Cloud of Bursting Stars -->
      <g fill="#fde047" filter="drop-shadow(0 0 6px #f59e0b)">
        <polygon points="256,150 262,165 278,165 266,175 270,190 256,181 242,190 246,175 234,165 250,165" />
        <polygon points="210,180 214,190 225,190 216,197 219,207 210,201 201,207 204,197 195,190 206,190" />
        <polygon points="302,180 306,190 317,190 308,197 311,207 302,201 293,207 296,197 287,190 298,190" />
        <circle cx="180" cy="215" r="4.5" fill="#ffffff" />
        <circle cx="332" cy="215" r="4.5" fill="#ffffff" />
        <circle cx="230" cy="140" r="3.5" fill="#ffffff" />
        <circle cx="282" cy="140" r="3.5" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "hundred-reveals",
    name: "Golden Joy",
    rarity: "legendary",
    category: "sharing-impact",
    centerpiece: `
      <!-- Golden hourglass with sand morphing into confetti -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.45" />
      <!-- Golden Hourglass Frame -->
      <g transform="translate(206, 155)" filter="drop-shadow(0 6px 10px #451a03)">
        <!-- Top & Bottom Plates -->
        <rect x="0" y="0" width="100" height="14" rx="4" fill="#fef08a" stroke="#78350f" stroke-width="2.5" />
        <rect x="0" y="176" width="100" height="14" rx="4" fill="#fef08a" stroke="#78350f" stroke-width="2.5" />
        <!-- Side Brass Pillars -->
        <rect x="8" y="14" width="8" height="162" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
        <rect x="84" y="14" width="8" height="162" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
        <!-- Glass Bulb Outline -->
        <path d="M 22 14 C 22 75, 45 95, 45 95 C 45 95, 22 115, 22 176 L 78 176 C 78 115, 55 95, 55 95 C 55 95, 78 75, 78 14 Z" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-width="2" />
        <!-- Top Bulb Golden Sand -->
        <path d="M 26 25 L 74 25 C 74 65, 55 85, 50 93 C 45 85, 26 65, 26 25 Z" fill="#f59e0b" />
        <!-- Falling Sand Stream -->
        <line x1="50" y1="93" x2="50" y2="135" stroke="#fde047" stroke-width="3" stroke-linecap="round" />
        <!-- Bottom Bulb: Golden Sand Morphing into Confetti Stars -->
        <path d="M 30 170 C 30 145, 42 135, 50 135 C 58 135, 70 145, 70 170 Z" fill="#fbbf24" />
      </g>
      <!-- Confetti bursting outside lower bulb -->
      <g fill="#fde047" stroke="#b45309" stroke-width="1">
        <polygon points="175,280 180,290 170,290" />
        <polygon points="337,280 342,290 332,290" />
        <circle cx="256" cy="340" r="5" fill="#f43f5e" />
        <circle cx="235" cy="335" r="4" fill="#38bdf8" />
        <circle cx="277" cy="335" r="4" fill="#10b981" />
      </g>`,
  },
  {
    slug: "viral-card",
    name: "Viral Sensation",
    rarity: "epic",
    category: "sharing-impact",
    centerpiece: `
      <!-- Supernova energy sphere detonating joyously -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Shockwave Rings -->
      <circle cx="256" cy="245" r="80" fill="none" stroke="#818cf8" stroke-width="3" stroke-dasharray="16,8" opacity="0.6" />
      <circle cx="256" cy="245" r="105" fill="none" stroke="#c084fc" stroke-width="2" stroke-dasharray="8,6" opacity="0.4" />
      <!-- Supernova Rays Bursting from Center -->
      <g stroke="#fde047" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 0 6px #f59e0b)">
        ${Array.from({ length: 12 })
          .map((_, i) => {
            const angle = (i * 360) / 12;
            const rad = (angle * Math.PI) / 180;
            const x1 = (256 + 28 * Math.cos(rad)).toFixed(1);
            const y1 = (245 + 28 * Math.sin(rad)).toFixed(1);
            const x2 = (256 + 75 * Math.cos(rad)).toFixed(1);
            const y2 = (245 + 75 * Math.sin(rad)).toFixed(1);
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
          })
          .join("\n        ")}
      </g>
      <!-- Core Energy Sphere -->
      <circle cx="256" cy="245" r="34" fill="#f43f5e" stroke="#ffffff" stroke-width="4" filter="drop-shadow(0 0 12px #ec4899)" />
      <circle cx="256" cy="245" r="22" fill="#fde047" />
      <circle cx="256" cy="245" r="12" fill="#ffffff" />
      <!-- Orbiting Joy Confetti Particles -->
      <circle cx="170" cy="180" r="5" fill="#38bdf8" />
      <circle cx="342" cy="180" r="6" fill="#fde047" />
      <circle cx="160" cy="290" r="5" fill="#f43f5e" />
      <circle cx="352" cy="290" r="5" fill="#34d399" />`,
  },
];

