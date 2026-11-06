// ============================================================================
// Category 2: Creator Journey (Badges 11–22)
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// ============================================================================

export const CATEGORY_2_BADGES = [
  {
    slug: "trio-creator",
    name: "Triple Threat",
    rarity: "common",
    category: "creator-journey",
    centerpiece: `
      <!-- Tri-fold tiered cards arranged in isometric fan -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Left Card -->
      <g transform="translate(160, 200) rotate(-16)">
        <rect x="0" y="0" width="85" height="130" rx="8" fill="#38bdf8" stroke="#ffffff" stroke-width="3" />
        <rect x="10" y="15" width="65" height="40" rx="4" fill="#0284c7" />
        <circle cx="42" cy="85" r="12" fill="#fde047" />
      </g>
      <!-- Right Card -->
      <g transform="translate(265, 175) rotate(16)">
        <rect x="0" y="0" width="85" height="130" rx="8" fill="#f43f5e" stroke="#ffffff" stroke-width="3" />
        <rect x="10" y="15" width="65" height="40" rx="4" fill="#be123c" />
        <polygon points="42,75 52,95 32,95" fill="#fde047" />
      </g>
      <!-- Center Main Card (Foreground) -->
      <g transform="translate(213, 170)">
        <rect x="0" y="0" width="86" height="135" rx="8" fill="#fbbf24" stroke="#ffffff" stroke-width="4" filter="drop-shadow(0 6px 8px #0f172a)" />
        <rect x="10" y="15" width="66" height="45" rx="4" fill="#b45309" />
        <!-- Crown motif on center card -->
        <polygon points="43,80 55,95 50,105 36,105 31,95" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "five-cards",
    name: "High Five",
    rarity: "rare",
    category: "creator-journey",
    centerpiece: `
      <!-- Sculpted rose-gold hand giving a starry high-five -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.4" />
      <!-- Stylized Sculpted Hand (Rose Gold) -->
      <g filter="drop-shadow(0 4px 6px #881337)">
        <!-- Palm -->
        <path d="M 215 270 C 215 230, 240 230, 256 230 C 272 230, 297 230, 297 270 C 297 310, 275 340, 256 340 C 237 340, 215 310, 215 270 Z" fill="#fb7185" stroke="#ffe4e6" stroke-width="3" />
        <!-- Thumb -->
        <path d="M 216 270 C 190 260, 190 230, 205 220 C 215 215, 225 235, 225 250 Z" fill="#fda4af" stroke="#ffe4e6" stroke-width="2" />
        <!-- Fingers (Index, Middle, Ring, Pinky) -->
        <rect x="226" y="170" width="14" height="70" rx="7" fill="#fb7185" stroke="#ffe4e6" stroke-width="2" />
        <rect x="244" y="155" width="14" height="85" rx="7" fill="#fda4af" stroke="#ffe4e6" stroke-width="2" />
        <rect x="262" y="165" width="14" height="75" rx="7" fill="#fb7185" stroke="#ffe4e6" stroke-width="2" />
        <rect x="280" y="185" width="13" height="55" rx="6.5" fill="#f43f5e" stroke="#ffe4e6" stroke-width="2" />
      </g>
      <!-- Five Radiating Gold Stars -->
      <g fill="#fde047" stroke="#b45309" stroke-width="1.5" filter="drop-shadow(0 0 4px #fbbf24)">
        <polygon points="185,190 190,195 197,192 192,198 195,205 188,202 182,206 185,199 179,194 186,195" />
        <polygon points="215,140 220,145 227,142 222,148 225,155 218,152 212,156 215,149 209,144 216,145" />
        <polygon points="256,120 261,125 268,122 263,128 266,135 259,132 253,136 256,129 250,124 257,125" />
        <polygon points="297,135 302,140 309,137 304,143 307,150 300,147 294,151 297,144 291,139 298,140" />
        <polygon points="325,180 330,185 337,182 332,188 335,195 328,192 322,196 325,189 319,184 326,185" />
      </g>`,
  },
  {
    slug: "ten-cards",
    name: "Deck Builder",
    rarity: "rare",
    category: "creator-journey",
    centerpiece: `
      <!-- Stack of 10 metallic cards bound with gold ribbon -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.4" />
      <!-- Stacked Card Edges (isometric layers) -->
      <g transform="translate(180, 200)">
        ${Array.from({ length: 9 })
          .map((_, i) => {
            const y = 90 - i * 8;
            return `<path d="M 0 ${y} L 75 ${y + 25} L 150 ${y} L 75 ${y - 25} Z" fill="${i % 2 === 0 ? "#cbd5e1" : "#f1f5f9"}" stroke="#64748b" stroke-width="1.5" />`;
          })
          .join("\n        ")}
        <!-- Top Face Card -->
        <path d="M 0 18 L 75 43 L 150 18 L 75 -7 Z" fill="#fb7185" stroke="#ffffff" stroke-width="2.5" />
        <circle cx="75" cy="18" r="14" fill="#fff1f2" stroke="#e11d48" stroke-width="2" />
        <!-- Golden Ribbon Bound Around Deck -->
        <path d="M 55 11 L 55 105 L 95 119 L 95 25 Z" fill="#f59e0b" fill-opacity="0.8" stroke="#d97706" stroke-width="1.5" />
        <!-- Bow on Top -->
        <circle cx="75" cy="18" r="6" fill="#fef08a" />
        <ellipse cx="65" cy="14" rx="8" ry="4" fill="#fde047" transform="rotate(-20 65 14)" />
        <ellipse cx="85" cy="14" rx="8" ry="4" fill="#fde047" transform="rotate(20 85 14)" />
      </g>`,
  },
  {
    slug: "twenty-five-cards",
    name: "Card Smith",
    rarity: "epic",
    category: "creator-journey",
    centerpiece: `
      <!-- Crystal anvil crafting floating holographic cards -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.45" />
      <!-- Crystal Anvil Base -->
      <path d="M 205 340 L 307 340 L 290 290 L 325 290 C 345 290, 350 270, 335 260 L 315 255 L 197 255 L 175 260 C 160 270, 165 290, 185 290 L 222 290 Z" fill="#6366f1" stroke="#e0e7ff" stroke-width="3" filter="drop-shadow(0 4px 8px #1e1b4b)" />
      <!-- Crystal Facet Highlights -->
      <polygon points="197,255 315,255 305,270 207,270" fill="#a5b4fc" opacity="0.8" />
      <polygon points="207,270 305,270 280,310 232,310" fill="#818cf8" opacity="0.7" />
      <!-- Floating Holographic Card -->
      <g transform="translate(256, 195) rotate(-10)" filter="drop-shadow(0 0 8px #38bdf8)">
        <rect x="-45" y="-65" width="90" height="130" rx="8" fill="#38bdf8" fill-opacity="0.25" stroke="#7dd3fc" stroke-width="2.5" stroke-dasharray="8,4" />
        <circle cx="0" cy="0" r="22" fill="none" stroke="#ffffff" stroke-width="2" />
        <text x="0" y="8" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">25</text>
      </g>
      <!-- Hammer Strike Spark Burst -->
      <g fill="#fde047">
        <polygon points="256,235 262,245 272,240 265,248 274,256 263,253 260,263 255,253 246,258 250,248 242,243 252,243" />
      </g>`,
  },
  {
    slug: "fifty-cards",
    name: "Studio Master",
    rarity: "legendary",
    category: "creator-journey",
    centerpiece: `
      <!-- Floating celestial card tower encircled by rings -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.45" />
      <!-- Saturn-like Orbital Ring (Back arc) -->
      <ellipse cx="256" cy="245" rx="130" ry="38" fill="none" stroke="#f59e0b" stroke-width="6" stroke-dasharray="140,80" transform="rotate(-15 256 245)" opacity="0.7" />
      <!-- Tiered Tower of Floating Gold Cards -->
      <g transform="translate(256, 260)">
        <!-- Bottom Level Tier -->
        <rect x="-65" y="30" width="130" height="35" rx="6" fill="#d97706" stroke="#fef08a" stroke-width="2.5" />
        <!-- Mid Level Tier -->
        <rect x="-50" y="-10" width="100" height="35" rx="6" fill="#f59e0b" stroke="#fef08a" stroke-width="2.5" />
        <!-- Top Level Tier -->
        <rect x="-35" y="-50" width="70" height="35" rx="6" fill="#fbbf24" stroke="#fef08a" stroke-width="2.5" />
        <!-- Crown Apex Card -->
        <polygon points="0,-85 24,-52 -24,-52" fill="#fef08a" stroke="#d97706" stroke-width="2" />
        <circle cx="0" cy="-62" r="5" fill="#ffffff" />
      </g>
      <!-- Saturn-like Orbital Ring (Front arc) -->
      <ellipse cx="256" cy="245" rx="130" ry="38" fill="none" stroke="#fef08a" stroke-width="6" stroke-dasharray="80,140" transform="rotate(-15 256 245)" filter="drop-shadow(0 0 6px #f59e0b)" />
      <!-- Floating Star Orbs -->
      <circle cx="160" cy="220" r="5" fill="#ffffff" />
      <circle cx="340" cy="270" r="6" fill="#ffffff" />
      <circle cx="256" cy="140" r="7" fill="#fef08a" />`,
  },
  {
    slug: "hundred-cards",
    name: "Century Crafter",
    rarity: "legendary",
    category: "creator-journey",
    centerpiece: `
      <!-- Roman numeral 'C' crown over golden card prism -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.45" />
      <!-- Golden Card Prism Base -->
      <polygon points="256,190 345,245 345,335 256,380 167,335 167,245" fill="#b45309" stroke="#fef08a" stroke-width="3" />
      <polygon points="256,190 345,245 256,290 167,245" fill="#f59e0b" stroke="#fef08a" stroke-width="2" />
      <polygon points="167,245 256,290 256,380 167,335" fill="#d97706" />
      <polygon points="345,245 256,290 256,380 345,335" fill="#92400e" />
      <!-- Majestic Roman Numeral 'C' in Pure 24K Gold -->
      <g filter="drop-shadow(0 6px 10px #451a03)">
        <path d="M 285 220 C 235 220, 205 245, 205 285 C 205 325, 235 350, 285 350 C 300 350, 315 345, 325 335 L 310 315 C 302 322, 295 325, 285 325 C 255 325, 235 310, 235 285 C 235 260, 255 245, 285 245 C 295 245, 302 248, 310 255 L 325 235 C 315 225, 300 220, 285 220 Z" fill="#fef08a" stroke="#d97706" stroke-width="3" />
      </g>
      <!-- Crown Spikes on top of C -->
      <g fill="#fde047" stroke="#b45309" stroke-width="1.5">
        <polygon points="215,220 225,190 235,220" />
        <polygon points="256,210 266,175 276,210" />
        <polygon points="295,220 305,190 315,220" />
      </g>`,
  },
  {
    slug: "weekend-publish",
    name: "Weekend Warrior",
    rarity: "common",
    category: "creator-journey",
    centerpiece: `
      <!-- Sunny beach lounge chair holding a scratch card -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Tropical Sun -->
      <circle cx="320" cy="180" r="30" fill="#fde047" stroke="#f59e0b" stroke-width="2" filter="drop-shadow(0 0 10px #fbbf24)" />
      <!-- Beach Lounge Chair (Wooden slats + Canvas) -->
      <g transform="translate(170, 210)">
        <!-- Chair Legs / Frame -->
        <line x1="10" y1="120" x2="130" y2="40" stroke="#78350f" stroke-width="6" stroke-linecap="round" />
        <line x1="30" y1="40" x2="110" y2="120" stroke="#78350f" stroke-width="6" stroke-linecap="round" />
        <!-- Striped Canvas Sling -->
        <path d="M 25 35 C 50 70, 90 90, 120 115" fill="none" stroke="#f43f5e" stroke-width="8" stroke-linecap="round" />
        <path d="M 25 35 C 50 70, 90 90, 120 115" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="10,10" stroke-linecap="round" />
        <!-- Scratch Card on Chair -->
        <rect x="55" y="45" width="45" height="60" rx="4" fill="#38bdf8" stroke="#ffffff" stroke-width="2" transform="rotate(-15 55 45)" />
        <circle cx="70" cy="70" r="8" fill="#fde047" />
      </g>`,
  },
  {
    slug: "night-owl",
    name: "Midnight Artisan",
    rarity: "common",
    category: "creator-journey",
    centerpiece: `
      <!-- Stylized neon owl perched atop a crescent moon -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.35" />
      <!-- Crescent Moon (Silver / Pale Gold) -->
      <path d="M 280 170 C 220 170, 190 220, 190 280 C 190 320, 210 345, 235 355 C 190 340, 165 295, 165 250 C 165 190, 210 145, 270 145 C 285 145, 300 150, 310 160 C 300 165, 290 170, 280 170 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" filter="drop-shadow(0 0 8px #94a3b8)" />
      <!-- Stylized Geometric Neon Owl -->
      <g transform="translate(245, 195)">
        <!-- Owl Body -->
        <path d="M 10 30 C 10 0, 50 0, 50 30 C 50 70, 40 100, 30 110 C 20 100, 10 70, 10 30 Z" fill="#1e1b4b" stroke="#818cf8" stroke-width="3" />
        <!-- Owl Head Tufts -->
        <polygon points="10,10 0,-5 20,5" fill="#818cf8" />
        <polygon points="50,10 60,-5 40,5" fill="#818cf8" />
        <!-- Glowing Emerald Eyes -->
        <circle cx="20" cy="30" r="9" fill="#10b981" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 4px #34d399)" />
        <circle cx="40" cy="30" r="9" fill="#10b981" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 4px #34d399)" />
        <circle cx="20" cy="30" r="4" fill="#022c22" />
        <circle cx="40" cy="30" r="4" fill="#022c22" />
        <!-- Golden Beak -->
        <polygon points="30,35 35,46 25,46" fill="#f59e0b" />
        <!-- Talons Perched on Moon -->
        <circle cx="22" cy="115" r="4" fill="#f59e0b" />
        <circle cx="38" cy="115" r="4" fill="#f59e0b" />
      </g>`,
  },
  {
    slug: "card-refinement",
    name: "Polished Craft",
    rarity: "common",
    category: "creator-journey",
    centerpiece: `
      <!-- Diamond polishing wheel refining a glittering card -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Lapidary Polishing Wheel (Slanted Oval) -->
      <ellipse cx="256" cy="270" rx="90" ry="38" fill="#334155" stroke="#94a3b8" stroke-width="5" />
      <ellipse cx="256" cy="270" rx="70" ry="28" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="12,8" />
      <!-- Polishing Spindle -->
      <circle cx="256" cy="270" r="14" fill="#f8fafc" stroke="#475569" stroke-width="3" />
      <!-- Card Being Polished on Edge -->
      <g transform="translate(220, 160) rotate(25)">
        <rect x="0" y="0" width="70" height="105" rx="6" fill="#ec4899" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0 4px 6px #0f172a)" />
        <!-- Sparkle at contact point -->
        <circle cx="0" cy="105" r="8" fill="#fde047" filter="drop-shadow(0 0 6px #fbbf24)" />
      </g>
      <!-- Polishing Diamond Dust Sparks -->
      <g fill="#ffffff">
        <circle cx="230" cy="240" r="3" />
        <circle cx="280" cy="235" r="3.5" />
        <circle cx="260" cy="210" r="2.5" />
      </g>`,
  },
  {
    slug: "multi-style",
    name: "Style Explorer",
    rarity: "rare",
    category: "creator-journey",
    centerpiece: `
      <!-- Three overlapping foil samples (Pink, Gold, Mint) -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Pink Foil Sample (Left) -->
      <g transform="translate(170, 190) rotate(-15)">
        <rect x="0" y="0" width="75" height="120" rx="8" fill="#f43f5e" stroke="#fff1f2" stroke-width="3" />
        <path d="M 0 30 Q 35 15 75 30 L 75 50 Q 35 35 0 50 Z" fill="#fda4af" opacity="0.6" />
      </g>
      <!-- Mint Foil Sample (Right) -->
      <g transform="translate(265, 175) rotate(15)">
        <rect x="0" y="0" width="75" height="120" rx="8" fill="#10b981" stroke="#ecfdf5" stroke-width="3" />
        <path d="M 0 30 Q 35 15 75 30 L 75 50 Q 35 35 0 50 Z" fill="#6ee7b7" opacity="0.6" />
      </g>
      <!-- Gold Foil Sample (Center Foreground) -->
      <g transform="translate(218, 165)">
        <rect x="0" y="0" width="76" height="130" rx="8" fill="#f59e0b" stroke="#fef08a" stroke-width="3.5" filter="drop-shadow(0 6px 8px #881337)" />
        <path d="M 0 30 Q 38 15 76 30 L 76 50 Q 38 35 0 50 Z" fill="#fef08a" opacity="0.8" />
        <circle cx="38" cy="80" r="14" fill="#d97706" stroke="#fef08a" stroke-width="2" />
        <polygon points="38,70 42,78 50,78 44,83 46,91 38,86 30,91 32,83 26,78 34,78" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "five-recipients",
    name: "Inner Circle",
    rarity: "rare",
    category: "creator-journey",
    centerpiece: `
      <!-- Constellation of 5 connected friendship medallions -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Geometric Connecting Star Lines -->
      <polygon points="256,170 317,215 294,285 218,285 195,215" fill="none" stroke="#fb7185" stroke-width="3" stroke-dasharray="6,4" />
      <polygon points="256,170 294,285 195,215 317,215 218,285" fill="none" stroke="#fda4af" stroke-width="1.5" opacity="0.5" />
      <!-- Center Victory Spark -->
      <circle cx="256" cy="235" r="10" fill="#fde047" filter="drop-shadow(0 0 6px #f59e0b)" />
      <!-- 5 Friendship Medallion Studs -->
      <g filter="drop-shadow(0 2px 4px #881337)">
        <circle cx="256" cy="170" r="16" fill="#fb7185" stroke="#ffe4e6" stroke-width="2.5" />
        <circle cx="317" cy="215" r="16" fill="#fb7185" stroke="#ffe4e6" stroke-width="2.5" />
        <circle cx="294" cy="285" r="16" fill="#fb7185" stroke="#ffe4e6" stroke-width="2.5" />
        <circle cx="218" cy="285" r="16" fill="#fb7185" stroke="#ffe4e6" stroke-width="2.5" />
        <circle cx="195" cy="215" r="16" fill="#fb7185" stroke="#ffe4e6" stroke-width="2.5" />
        <!-- Miniature Heart Engraving in each -->
        <circle cx="256" cy="170" r="6" fill="#ffffff" />
        <circle cx="317" cy="215" r="6" fill="#ffffff" />
        <circle cx="294" cy="285" r="6" fill="#ffffff" />
        <circle cx="218" cy="285" r="6" fill="#ffffff" />
        <circle cx="195" cy="215" r="6" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "tidy-studio",
    name: "Tidy Studio",
    rarity: "common",
    category: "creator-journey",
    centerpiece: `
      <!-- Sparkling geometric organizers and whisk brush -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Organizer Desktop Tray -->
      <rect x="175" y="240" width="162" height="90" rx="8" fill="#1e293b" stroke="#cbd5e1" stroke-width="3" />
      <!-- Aligned Card Folders inside tray -->
      <rect x="190" y="210" width="30" height="75" rx="4" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
      <rect x="225" y="195" width="30" height="90" rx="4" fill="#fbbf24" stroke="#ffffff" stroke-width="2" />
      <rect x="260" y="205" width="30" height="80" rx="4" fill="#f43f5e" stroke="#ffffff" stroke-width="2" />
      <!-- Diagonal Artisan Whisk Brush -->
      <g transform="translate(295, 220) rotate(40)">
        <!-- Handle -->
        <rect x="0" y="0" width="10" height="60" rx="5" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
        <!-- Bristles -->
        <path d="M -8 60 L 18 60 L 24 95 L -14 95 Z" fill="#fde047" stroke="#d97706" stroke-width="1.5" />
      </g>
      <!-- Clean Gleam Sparkles -->
      <g fill="#ffffff" filter="drop-shadow(0 0 4px #38bdf8)">
        <polygon points="175,190 180,195 185,190 180,185" />
        <polygon points="310,180 314,184 318,180 314,176" />
      </g>`,
  },
];

