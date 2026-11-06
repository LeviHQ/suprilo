// ============================================================================
// Category 5: Creative Mastery (Badges 43–50)
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// ============================================================================

export const CATEGORY_5_BADGES = [
  {
    slug: "sticker-fanatic",
    name: "Sticker Maestro",
    rarity: "common",
    category: "creative-mastery",
    centerpiece: `
      <!-- Holographic sticker sheet with floating enamel pins -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Holographic Sticker Sheet Base -->
      <g transform="translate(186, 175) rotate(-6)" filter="drop-shadow(0 4px 6px #09090b)">
        <rect x="0" y="0" width="140" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
        <!-- Holographic Rainbow Sheen Bar -->
        <rect x="10" y="10" width="120" height="20" rx="4" fill="#38bdf8" />
        <rect x="10" y="10" width="80" height="20" rx="4" fill="#ec4899" opacity="0.6" />
        <!-- Die-Cut Peel Sticker: Star -->
        <polygon points="40,65 44,75 55,75 46,82 49,92 40,86 31,92 34,82 25,75 36,75" fill="#fde047" stroke="#ffffff" stroke-width="2" />
        <!-- Die-Cut Peel Sticker: Heart -->
        <path d="M 100 75 C 92 60, 80 66, 100 86 C 120 66, 108 60, 100 75 Z" fill="#f43f5e" stroke="#ffffff" stroke-width="2" />
        <!-- Die-Cut Peel Sticker: Lightning -->
        <polygon points="45,108 35,128 45,128 38,142 55,122 45,122" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
        <!-- Die-Cut Peel Sticker: Diamond -->
        <polygon points="100,105 112,120 100,135 88,120" fill="#a855f7" stroke="#ffffff" stroke-width="1.5" />
      </g>
      <!-- Floating 3D Enamel Lapel Pin (Foreground) -->
      <g transform="translate(290, 220)" filter="drop-shadow(0 4px 6px #881337)">
        <circle cx="0" cy="0" r="22" fill="#f43f5e" stroke="#fde047" stroke-width="3.5" />
        <polygon points="0,-12 3,-3 12,-3 5,3 8,12 0,7 -8,12 -5,3 -12,-3 -3,-3" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "sensory-delight",
    name: "Full Sensory",
    rarity: "rare",
    category: "creative-mastery",
    centerpiece: `
      <!-- Vinyl record player spinning a framed photo memory -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Vinyl Turntable Base Platter -->
      <g filter="drop-shadow(0 6px 10px #09090b)">
        <circle cx="240" cy="255" r="95" fill="#09090b" stroke="#27272a" stroke-width="4" />
        <!-- Microgrooves -->
        <circle cx="240" cy="255" r="82" fill="none" stroke="#27272a" stroke-width="1.5" />
        <circle cx="240" cy="255" r="72" fill="none" stroke="#27272a" stroke-width="1.5" />
        <circle cx="240" cy="255" r="62" fill="none" stroke="#27272a" stroke-width="1.5" />
        <circle cx="240" cy="255" r="52" fill="none" stroke="#27272a" stroke-width="1.5" />
        <!-- Center Record Label (Framed Photo Memory) -->
        <circle cx="240" cy="255" r="36" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <!-- Miniature photo mountains & sun inside label -->
        <polygon points="220,270 235,245 250,270" fill="#1e3a8a" />
        <polygon points="238,270 250,250 262,270" fill="#3b82f6" />
        <circle cx="230" cy="240" r="5" fill="#fde047" />
        <!-- Center Spindle -->
        <circle cx="240" cy="255" r="5" fill="#f8fafc" />
      </g>
      <!-- Golden Tonearm & Stylus Needle -->
      <g transform="translate(325, 170)" filter="drop-shadow(0 2px 4px #09090b)">
        <circle cx="0" cy="0" r="14" fill="#fbbf24" stroke="#78350f" stroke-width="2" />
        <!-- Arm shaft -->
        <path d="M 0 0 L -30 65 L -65 85" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Cartridge head -->
        <rect x="-78" y="78" width="16" height="12" rx="2" fill="#d97706" stroke="#fde047" stroke-width="1.5" />
      </g>`,
  },
  {
    slug: "epic-surprise",
    name: "Master Storyteller",
    rarity: "rare",
    category: "creative-mastery",
    centerpiece: `
      <!-- Open ancient scroll with glowing calligraphy script -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Unfurled Ancient Scroll Body -->
      <g filter="drop-shadow(0 6px 10px #451a03)">
        <!-- Parchment Area -->
        <path d="M 180 180 C 220 190, 290 170, 330 180 L 330 310 C 290 300, 220 320, 180 310 Z" fill="#fef3c7" stroke="#d97706" stroke-width="3" />
        <!-- Left Wooden Scroll Roller Rod -->
        <rect x="168" y="160" width="14" height="170" rx="7" fill="#78350f" stroke="#f59e0b" stroke-width="2" />
        <circle cx="175" cy="162" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" />
        <circle cx="175" cy="328" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" />
        <!-- Right Wooden Scroll Roller Rod -->
        <rect x="328" y="160" width="14" height="170" rx="7" fill="#78350f" stroke="#f59e0b" stroke-width="2" />
        <circle cx="335" cy="162" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" />
        <circle cx="335" cy="328" r="9" fill="#fbbf24" stroke="#78350f" stroke-width="1.5" />
        <!-- Glowing Calligraphy Script Lines -->
        <g stroke="#b45309" stroke-width="3" stroke-linecap="round">
          <path d="M 195 210 Q 220 205 255 210 Q 285 205 315 210" />
          <path d="M 195 235 Q 220 230 255 235 Q 285 230 305 235" />
          <path d="M 195 260 Q 220 255 255 260 Q 285 255 315 260" />
          <path d="M 195 285 Q 220 280 245 285" />
        </g>
        <!-- Golden Illuminated Manuscript Drop Cap (Letter 'S') -->
        <text x="210" y="240" font-family="serif" font-weight="900" font-size="32" fill="#dc2626">S</text>
      </g>
      <!-- Magical Floating Ribbon / Sparkles -->
      <path d="M 230 160 Q 260 130 290 155 Q 310 170 330 150" fill="none" stroke="#fde047" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 0 6px #f59e0b)" />
      <circle cx="260" cy="140" r="4" fill="#ffffff" />
      <circle cx="310" cy="145" r="3.5" fill="#ffffff" />`,
  },
  {
    slug: "photo-album-card",
    name: "Memory Vault",
    rarity: "rare",
    category: "creative-mastery",
    centerpiece: `
      <!-- Triptych picture frame exhibiting floating memories -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Left Panel Frame (Angled) -->
      <g transform="translate(160, 200) rotate(-14)" filter="drop-shadow(0 4px 6px #09090b)">
        <rect x="0" y="0" width="70" height="105" rx="6" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <rect x="8" y="8" width="54" height="89" rx="3" fill="#1e293b" />
        <circle cx="35" cy="40" r="14" fill="#38bdf8" />
      </g>
      <!-- Right Panel Frame (Angled) -->
      <g transform="translate(282, 185) rotate(14)" filter="drop-shadow(0 4px 6px #09090b)">
        <rect x="0" y="0" width="70" height="105" rx="6" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <rect x="8" y="8" width="54" height="89" rx="3" fill="#1e293b" />
        <polygon points="35,28 47,52 23,52" fill="#fde047" />
      </g>
      <!-- Center Main Gallery Frame -->
      <g transform="translate(216, 175)" filter="drop-shadow(0 6px 10px #881337)">
        <rect x="0" y="0" width="80" height="120" rx="8" fill="#f43f5e" stroke="#ffffff" stroke-width="4" />
        <rect x="10" y="10" width="60" height="100" rx="4" fill="#0f172a" />
        <!-- Iridescent Floating Memory Gem -->
        <g transform="translate(40, 55)">
          <polygon points="0,-22 18,-8 12,18 -12,18 -18,-8" fill="#a855f7" stroke="#e9d5ff" stroke-width="1.5" />
          <polygon points="0,-22 10,0 0,22 -10,0" fill="#ffffff" opacity="0.6" />
        </g>
        <circle cx="40" cy="95" r="4" fill="#fbbf24" />
      </g>
      <!-- Golden Hinges connecting frames -->
      <rect x="212" y="210" width="6" height="14" rx="2" fill="#fde047" />
      <rect x="294" y="210" width="6" height="14" rx="2" fill="#fde047" />`,
  },
  {
    slug: "scratch-explorer",
    name: "Scratch Connoisseur",
    rarity: "rare",
    category: "creative-mastery",
    centerpiece: `
      <!-- Prismatic crystal prism refracting 5 distinct rays -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Incoming White Laser Ray (From Left) -->
      <line x1="140" y1="250" x2="230" y2="245" stroke="#ffffff" stroke-width="5" stroke-linecap="round" filter="drop-shadow(0 0 6px #ffffff)" />
      <!-- Triangular Quartz Prism in Center -->
      <g filter="drop-shadow(0 6px 10px #09090b)">
        <polygon points="256,165 315,285 197,285" fill="#818cf8" fill-opacity="0.3" stroke="#e0e7ff" stroke-width="4" />
        <!-- Internal Refraction Glints -->
        <line x1="230" y1="245" x2="265" y2="245" stroke="#ffffff" stroke-width="4" opacity="0.8" />
        <polygon points="256,165 240,285 272,285" fill="#ffffff" fill-opacity="0.2" />
      </g>
      <!-- Five Distinct Refracted Rainbow Rays (Emerging Right) -->
      <g stroke-width="4" stroke-linecap="round">
        <line x1="265" y1="245" x2="365" y2="195" stroke="#f43f5e" /> <!-- Red -->
        <line x1="265" y1="245" x2="370" y2="220" stroke="#f59e0b" /> <!-- Orange -->
        <line x1="265" y1="245" x2="372" y2="245" stroke="#fde047" /> <!-- Yellow -->
        <line x1="265" y1="245" x2="370" y2="270" stroke="#10b981" /> <!-- Green -->
        <line x1="265" y1="245" x2="365" y2="295" stroke="#38bdf8" /> <!-- Blue -->
      </g>
      <!-- Prismatic Flare Sparks -->
      <circle cx="370" cy="245" r="6" fill="#ffffff" filter="drop-shadow(0 0 8px #fde047)" />`,
  },
  {
    slug: "double-polish",
    name: "Master of Detail",
    rarity: "rare",
    category: "creative-mastery",
    centerpiece: `
      <!-- Dual jewelers' loupes examining a flawless gem -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Flawless Brilliant Cut Diamond (Center) -->
      <g transform="translate(256, 255)" filter="drop-shadow(0 0 12px #38bdf8)">
        <!-- Table & Crown -->
        <polygon points="-28,-22 28,-22 42,0 -42,0" fill="#e0e7ff" stroke="#ffffff" stroke-width="2" />
        <!-- Pavilion & Culet -->
        <polygon points="-42,0 42,0 0,42" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
        <!-- Facet Reflections -->
        <polygon points="-16,-22 16,-22 0,0" fill="#ffffff" opacity="0.9" />
        <polygon points="-42,0 -16,-22 0,0" fill="#818cf8" opacity="0.7" />
        <polygon points="42,0 16,-22 0,0" fill="#818cf8" opacity="0.7" />
        <polygon points="0,0 -20,20 0,42" fill="#ffffff" opacity="0.8" />
        <polygon points="0,0 20,20 0,42" fill="#0284c7" opacity="0.8" />
      </g>
      <!-- Left Jeweler's Loupe (Folding Brass Loop) -->
      <g transform="translate(195, 215) rotate(-25)" filter="drop-shadow(0 4px 6px #78350f)">
        <circle cx="0" cy="0" r="28" fill="none" stroke="#f59e0b" stroke-width="6" />
        <circle cx="0" cy="0" r="23" fill="#ffffff" fill-opacity="0.3" stroke="#fef08a" stroke-width="1.5" />
        <path d="M 0 -28 L -20 -50 L -12 -55 L 8 -30 Z" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
      </g>
      <!-- Right Jeweler's Loupe (Folding Brass Loop) -->
      <g transform="translate(317, 215) rotate(25)" filter="drop-shadow(0 4px 6px #78350f)">
        <circle cx="0" cy="0" r="28" fill="none" stroke="#f59e0b" stroke-width="6" />
        <circle cx="0" cy="0" r="23" fill="#ffffff" fill-opacity="0.3" stroke="#fef08a" stroke-width="1.5" />
        <path d="M 0 -28 L 20 -50 L 12 -55 L -8 -30 Z" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
      </g>
      <!-- Diamond Glint Stars -->
      <g fill="#ffffff">
        <polygon points="256,220 259,228 267,228 261,233 263,241 256,236 249,241 251,233 245,228 253,228" />
      </g>`,
  },
  {
    slug: "legendary-creator",
    name: "Legendary Creator",
    rarity: "epic",
    category: "creative-mastery",
    centerpiece: `
      <!-- Massive solid gold ingot stamped with Suprilo crest -->
      <ellipse cx="256" cy="355" rx="90" ry="14" fill="#000000" opacity="0.45" />
      <!-- Solid 24K Gold Bullion Ingot (Isometric Trapezoid) -->
      <g filter="drop-shadow(0 8px 14px #451a03)">
        <!-- Top Face -->
        <polygon points="190,195 322,195 352,280 160,280" fill="#fef08a" stroke="#d97706" stroke-width="3" />
        <!-- Front Bevel Face -->
        <polygon points="160,280 352,280 342,325 170,325" fill="#f59e0b" stroke="#78350f" stroke-width="2.5" />
        <!-- Left Bevel Face -->
        <polygon points="190,195 160,280 170,325 198,225" fill="#d97706" stroke="#78350f" stroke-width="2" />
        <!-- Embossed Suprilo Crest on Ingot Face -->
        <g transform="translate(256, 238)">
          <!-- Royal Shield Outline -->
          <path d="M 0 -22 C 16 -22, 28 -14, 28 0 C 28 18, 0 30, 0 30 C 0 30, -28 18, -28 0 C -28 -14, -16 -22, 0 -22 Z" fill="#b45309" stroke="#fde047" stroke-width="2" />
          <!-- Star inside Crest -->
          <polygon points="0,-12 4,-3 13,-3 6,3 9,12 0,6 -9,12 -6,3 -13,-3 -4,-3" fill="#ffffff" />
        </g>
        <!-- Hallmark Purity Stamps -->
        <text x="210" y="270" font-family="sans-serif" font-weight="900" font-size="11" fill="#78350f" letter-spacing="1">999.9</text>
        <text x="290" y="270" font-family="sans-serif" font-weight="900" font-size="11" fill="#78350f" letter-spacing="1">FINE GOLD</text>
      </g>
      <!-- Radiating Divine Wealth Glints -->
      <circle cx="160" cy="275" r="5" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
      <circle cx="352" cy="195" r="6" fill="#ffffff" filter="drop-shadow(0 0 6px #fde047)" />
      <circle cx="256" cy="170" r="4.5" fill="#fde047" />`,
  },
  {
    slug: "suprilo-hall-of-fame",
    name: "Hall of Fame",
    rarity: "legendary",
    category: "creative-mastery",
    centerpiece: `
      <!-- Celestial winged trophy atop a marble pillar -->
      <ellipse cx="256" cy="355" rx="90" ry="14" fill="#000000" opacity="0.45" />
      <!-- Starry Cosmic Aurora Rays Behind Trophy -->
      <g stroke="#fde047" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.6">
        <line x1="256" y1="210" x2="160" y2="135" />
        <line x1="256" y1="210" x2="205" y2="120" />
        <line x1="256" y1="210" x2="256" y2="115" />
        <line x1="256" y1="210" x2="307" y2="120" />
        <line x1="256" y1="210" x2="352" y2="135" />
      </g>
      <!-- Fluted Classical Marble Pillar Pedestal -->
      <g transform="translate(256, 305)" filter="drop-shadow(0 6px 10px #451a03)">
        <rect x="-45" y="0" width="90" height="15" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
        <rect x="-35" y="15" width="70" height="35" fill="#e2e8f0" stroke="#64748b" stroke-width="2" />
        <rect x="-45" y="50" width="90" height="15" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
        <!-- Pillar Fluting Grooves -->
        <line x1="-20" y1="15" x2="-20" y2="50" stroke="#94a3b8" stroke-width="2" />
        <line x1="0" y1="15" x2="0" y2="50" stroke="#94a3b8" stroke-width="2" />
        <line x1="20" y1="15" x2="20" y2="50" stroke="#94a3b8" stroke-width="2" />
      </g>
      <!-- Celestial Winged Victory Trophy in 24K Pure Gold -->
      <g transform="translate(256, 215)" filter="drop-shadow(0 6px 12px #78350f)">
        <!-- Chalice Goblet Cup -->
        <path d="M -30 -35 L 30 -35 C 30 15, -30 15, -30 -35 Z" fill="#fef08a" stroke="#d97706" stroke-width="3" />
        <!-- Stem & Foot Base -->
        <rect x="-6" y="15" width="12" height="40" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
        <polygon points="-24,70 24,70 12,55 -12,55" fill="#fef08a" stroke="#78350f" stroke-width="2" />
        <!-- Sweeping Angelic Wings (Left & Right) -->
        <!-- Left Wing -->
        <path d="M -30 -20 C -75 -45, -70 5, -20 5 C -25 -5, -28 -12, -30 -20 Z" fill="#fde047" stroke="#b45309" stroke-width="2" />
        <!-- Right Wing -->
        <path d="M 30 -20 C 75 -45, 70 5, 20 5 C 25 -5, 28 -12, 30 -20 Z" fill="#fde047" stroke="#b45309" stroke-width="2" />
        <!-- Crown Star Hovering Above Trophy Cup -->
        <polygon points="0,-60 6,-42 24,-42 10,-31 15,-13 0,-24 -15,-13 -10,-31 -24,-42 -6,-42" fill="#ffffff" stroke="#f59e0b" stroke-width="2" filter="drop-shadow(0 0 8px #fef08a)" />
      </g>`,
  },
];

