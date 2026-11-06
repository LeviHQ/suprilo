// ============================================================================
// Category 4: Milestones & Community (Badges 33–42)
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// ============================================================================

export const CATEGORY_4_BADGES = [
  {
    slug: "seven-day-veteran",
    name: "Week One",
    rarity: "common",
    category: "milestones",
    centerpiece: `
      <!-- 7-day calendar leaf with golden checkmark pin -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Calendar Page Base -->
      <g transform="translate(186, 175)" filter="drop-shadow(0 6px 8px #451a03)">
        <rect x="0" y="0" width="140" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4" />
        <!-- Top Crimson Header Bar -->
        <rect x="0" y="0" width="140" height="42" rx="8" fill="#dc2626" />
        <!-- Calendar Rings -->
        <circle cx="35" cy="18" r="6" fill="#f8fafc" stroke="#475569" stroke-width="2" />
        <circle cx="105" cy="18" r="6" fill="#f8fafc" stroke="#475569" stroke-width="2" />
        <!-- Big Number '7' -->
        <text x="70" y="118" font-family="system-ui, sans-serif" font-weight="900" font-size="64" fill="#0f172a" text-anchor="middle">7</text>
        <!-- Days subtitle -->
        <text x="70" y="138" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="#64748b" text-anchor="middle" letter-spacing="2">DAYS</text>
      </g>
      <!-- Golden Checkmark Pin Overlaid -->
      <g transform="translate(290, 245)" filter="drop-shadow(0 0 6px #f59e0b)">
        <circle cx="0" cy="0" r="24" fill="#10b981" stroke="#ffffff" stroke-width="3" />
        <!-- Checkmark -->
        <path d="M -10 0 L -3 8 L 11 -6" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      </g>`,
  },
  {
    slug: "month-veteran",
    name: "Monthly Regular",
    rarity: "rare",
    category: "milestones",
    centerpiece: `
      <!-- Wax seal stamped with '30 Days' laurel wreath -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Giant Crimson/Burgundy Wax Seal Body -->
      <g filter="drop-shadow(0 6px 10px #451a03)">
        <!-- Irregular Scalloped Wax Edge -->
        <circle cx="256" cy="245" r="95" fill="#be123c" stroke="#881337" stroke-width="4" />
        <circle cx="256" cy="245" r="82" fill="#e11d48" stroke="#fda4af" stroke-width="2" />
        <circle cx="256" cy="245" r="76" fill="#be123c" />
        <!-- Laurel Wreath surrounding '30' -->
        <g fill="#fde047" stroke="#b45309" stroke-width="1">
          <!-- Left Laurel Branch Leaves -->
          <ellipse cx="205" cy="210" rx="8" ry="4" transform="rotate(-30 205 210)" />
          <ellipse cx="195" cy="235" rx="8" ry="4" transform="rotate(-10 195 235)" />
          <ellipse cx="198" cy="265" rx="8" ry="4" transform="rotate(20 198 265)" />
          <ellipse cx="215" cy="290" rx="8" ry="4" transform="rotate(45 215 290)" />
          <!-- Right Laurel Branch Leaves -->
          <ellipse cx="307" cy="210" rx="8" ry="4" transform="rotate(30 307 210)" />
          <ellipse cx="317" cy="235" rx="8" ry="4" transform="rotate(10 317 235)" />
          <ellipse cx="314" cy="265" rx="8" ry="4" transform="rotate(-20 314 265)" />
          <ellipse cx="297" cy="290" rx="8" ry="4" transform="rotate(-45 297 290)" />
        </g>
        <!-- Embossed '30' -->
        <text x="256" y="258" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#fde047" text-anchor="middle" filter="drop-shadow(0 2px 2px #713f12)">30</text>
        <text x="256" y="280" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#fef08a" text-anchor="middle" letter-spacing="3">DAYS</text>
      </g>`,
  },
  {
    slug: "ninety-day-veteran",
    name: "Quarter Master",
    rarity: "epic",
    category: "milestones",
    centerpiece: `
      <!-- Silver pocket watch with spinning astronomical gear -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Pocket Watch Body in Titanium/Silver -->
      <g filter="drop-shadow(0 6px 10px #1e1b4b)">
        <!-- Watch Crown Loop (Top) -->
        <circle cx="256" cy="140" r="14" fill="none" stroke="#e0e7ff" stroke-width="5" />
        <rect x="250" y="150" width="12" height="12" rx="2" fill="#818cf8" stroke="#312e81" stroke-width="2" />
        <!-- Watch Outer Bezel Case -->
        <circle cx="256" cy="255" r="95" fill="#475569" stroke="#e0e7ff" stroke-width="5" />
        <circle cx="256" cy="255" r="82" fill="#0f172a" stroke="#818cf8" stroke-width="3" />
        <!-- Inner Dial Track with Roman Hour Studs -->
        <circle cx="256" cy="255" r="72" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="2,6" />
        <!-- Spinning Astronomical Sun/Moon Gear -->
        <g transform="translate(256, 255) rotate(45)">
          <circle cx="0" cy="0" r="36" fill="#1e1b4b" stroke="#fde047" stroke-width="2.5" />
          ${Array.from({ length: 8 })
            .map((_, i) => {
              const ang = (i * 360) / 8;
              return `<rect x="-5" y="-42" width="10" height="10" rx="2" fill="#fde047" transform="rotate(${ang})" />`;
            })
            .join("\n          ")}
          <!-- Center Sunburst Motif inside gear -->
          <circle cx="0" cy="0" r="14" fill="#f59e0b" />
          <polygon points="0,-18 5,-8 15,-10 9,-2 14,8 4,6 0,16 -4,6 -14,8 -9,-2 -15,-10 -5,-8" fill="#ffffff" />
        </g>
        <!-- Blue Steel Watch Hands -->
        <line x1="256" y1="255" x2="256" y2="200" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
        <line x1="256" y1="255" x2="295" y2="245" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
        <circle cx="256" cy="255" r="5" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "one-year-veteran",
    name: "Perennial Legend",
    rarity: "legendary",
    category: "milestones",
    centerpiece: `
      <!-- Eternal golden infinity loop crowned with diamonds -->
      <ellipse cx="256" cy="355" rx="90" ry="14" fill="#000000" opacity="0.45" />
      <!-- Golden Möbius Infinity Loop -->
      <g filter="drop-shadow(0 6px 12px #451a03)">
        <path d="M 256 245 C 290 200, 360 200, 360 245 C 360 290, 290 290, 256 245 C 222 200, 152 200, 152 245 C 152 290, 222 290, 256 245 Z" fill="none" stroke="#fef08a" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 256 245 C 290 200, 360 200, 360 245 C 360 290, 290 290, 256 245 C 222 200, 152 200, 152 245 C 152 290, 222 290, 256 245 Z" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 256 245 C 290 200, 360 200, 360 245 C 360 290, 290 290, 256 245 C 222 200, 152 200, 152 245 C 152 290, 222 290, 256 245 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
      </g>
      <!-- Four Bezel-Set Brilliant Cut Diamond Stars -->
      <g fill="#ffffff" stroke="#38bdf8" stroke-width="1.5" filter="drop-shadow(0 0 6px #ffffff)">
        <!-- Top Diamond -->
        <polygon points="256,155 264,167 256,179 248,167" />
        <!-- Left Diamond -->
        <polygon points="152,233 164,245 152,257 140,245" />
        <!-- Right Diamond -->
        <polygon points="360,233 372,245 360,257 348,245" />
        <!-- Center Intersect Diamond -->
        <polygon points="256,233 268,245 256,257 244,245" />
      </g>
      <!-- '365' Laurel Inscription banner below -->
      <g transform="translate(256, 315)">
        <rect x="-42" y="-12" width="84" height="24" rx="12" fill="#78350f" stroke="#fde047" stroke-width="2" />
        <text x="0" y="5" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#fef08a" text-anchor="middle" letter-spacing="2">365 DAYS</text>
      </g>`,
  },
  {
    slug: "speedy-scratch",
    name: "Fast Scratch",
    rarity: "rare",
    category: "milestones",
    centerpiece: `
      <!-- Golden lightning bolt slicing through scratch foil -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Scratch Card Split in Two by Lightning -->
      <g transform="translate(180, 185) rotate(-6)">
        <rect x="0" y="0" width="150" height="110" rx="8" fill="#1e1b4b" stroke="#ffffff" stroke-width="3" />
        <!-- Split Fracture Gap -->
        <polygon points="0,0 70,0 55,60 85,60 65,110 0,110" fill="#94a3b8" />
        <polygon points="80,0 150,0 150,110 80,110 95,60 65,60" fill="#cbd5e1" />
      </g>
      <!-- High-Voltage Golden Lightning Bolt -->
      <g filter="drop-shadow(0 0 10px #f59e0b)">
        <polygon points="266,135 226,235 260,235 236,335 296,220 262,220 286,135" fill="#fde047" stroke="#ffffff" stroke-width="3" />
        <!-- Center Core Glow -->
        <polygon points="266,145 234,230 258,230 242,315 284,225 260,225 278,145" fill="#ffffff" />
      </g>
      <!-- Electrical Sparks at Impact -->
      <g fill="#fde047">
        <circle cx="215" cy="265" r="4" />
        <circle cx="305" cy="210" r="4.5" />
        <circle cx="256" cy="340" r="5" />
      </g>`,
  },
  {
    slug: "perfect-reveal-trio",
    name: "Triple Delight",
    rarity: "rare",
    category: "milestones",
    centerpiece: `
      <!-- Triangle of three interlocking triumphant hearts -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Trinity Knot Connecting Stream -->
      <polygon points="256,190 310,285 202,285" fill="none" stroke="#fde047" stroke-width="4" stroke-dasharray="8,6" opacity="0.7" />
      <!-- Top Heart -->
      <g transform="translate(256, 190)" filter="drop-shadow(0 4px 6px #881337)">
        <path d="M 0 15 C -20 -15, -45 5, 0 45 C 45 5, 20 -15, 0 15 Z" fill="#f43f5e" stroke="#fff1f2" stroke-width="3" />
        <circle cx="0" cy="15" r="6" fill="#fef08a" />
      </g>
      <!-- Bottom-Left Heart -->
      <g transform="translate(202, 280)" filter="drop-shadow(0 4px 6px #881337)">
        <path d="M 0 15 C -20 -15, -45 5, 0 45 C 45 5, 20 -15, 0 15 Z" fill="#ec4899" stroke="#fff1f2" stroke-width="3" />
        <circle cx="0" cy="15" r="6" fill="#fef08a" />
      </g>
      <!-- Bottom-Right Heart -->
      <g transform="translate(310, 280)" filter="drop-shadow(0 4px 6px #881337)">
        <path d="M 0 15 C -20 -15, -45 5, 0 45 C 45 5, 20 -15, 0 15 Z" fill="#fb7185" stroke="#fff1f2" stroke-width="3" />
        <circle cx="0" cy="15" r="6" fill="#fef08a" />
      </g>
      <!-- Central Victory Star -->
      <circle cx="256" cy="255" r="10" fill="#fde047" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 0 6px #f59e0b)" />`,
  },
  {
    slug: "ten-card-reveals",
    name: "Ten-Fold Reveal",
    rarity: "epic",
    category: "milestones",
    centerpiece: `
      <!-- Laurel wreath holding 10 glittering star gems -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Classical Victory Laurel Wreath (Polished Titanium / Gold) -->
      <g filter="drop-shadow(0 4px 8px #1e1b4b)">
        <!-- Left Branch -->
        <path d="M 256 340 C 180 340, 160 260, 180 180 C 190 150, 220 140, 240 140" fill="none" stroke="#818cf8" stroke-width="5" stroke-linecap="round" />
        <!-- Right Branch -->
        <path d="M 256 340 C 332 340, 352 260, 332 180 C 322 150, 292 140, 272 140" fill="none" stroke="#818cf8" stroke-width="5" stroke-linecap="round" />
        <!-- Bow at bottom knot -->
        <circle cx="256" cy="340" r="8" fill="#e0e7ff" stroke="#312e81" stroke-width="2" />
      </g>
      <!-- 10 Faceted Brilliant Cut Star Gems around the wreath -->
      <g filter="drop-shadow(0 0 6px #38bdf8)">
        ${[
          [180, 180],
          [165, 220],
          [165, 265],
          [185, 305],
          [220, 332],
          [332, 180],
          [347, 220],
          [347, 265],
          [327, 305],
          [292, 332],
        ]
          .map(([x, y]) => {
            return `<polygon points="${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
                    <circle cx="${x}" cy="${y}" r="2" fill="#ffffff" />`;
          })
          .join("\n        ")}
      </g>
      <!-- Roman Numeral 'X' in Center -->
      <text x="256" y="265" font-family="system-ui, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 4px 6px #312e81)">X</text>`,
  },
  {
    slug: "high-affinity",
    name: "Heart Magnet",
    rarity: "epic",
    category: "milestones",
    centerpiece: `
      <!-- Magnetic prism pulling glowing hearts effortlessly -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Chrome Horseshoe Magnet -->
      <g filter="drop-shadow(0 6px 10px #1e1b4b)">
        <!-- Horseshoe Curve -->
        <path d="M 195 240 L 195 190 C 195 140, 317 140, 317 190 L 317 240 L 285 240 L 285 190 C 285 165, 227 165, 227 190 L 227 240 Z" fill="#6366f1" stroke="#e0e7ff" stroke-width="4" />
        <!-- Magnetic Poles (Left: Ruby Red, Right: Cobalt Blue) -->
        <rect x="195" y="240" width="32" height="30" fill="#f43f5e" stroke="#e0e7ff" stroke-width="2" />
        <rect x="285" y="240" width="32" height="30" fill="#38bdf8" stroke="#e0e7ff" stroke-width="2" />
        <!-- Pole Markings N / S -->
        <text x="211" y="262" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">N</text>
        <text x="301" y="262" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">S</text>
      </g>
      <!-- Magnetic Field Lines -->
      <path d="M 211 270 Q 256 320 301 270" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-dasharray="6,4" />
      <path d="M 195 270 Q 256 340 317 270" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6" />
      <!-- Floating Glowing Hearts Pulled to Center -->
      <g filter="drop-shadow(0 0 6px #f43f5e)">
        <path d="M 256 300 C 248 285, 235 292, 256 312 C 277 292, 264 285, 256 300 Z" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5" />
        <path d="M 235 285 C 230 273, 220 279, 235 294 C 250 279, 240 273, 235 285 Z" fill="#ec4899" stroke="#ffffff" stroke-width="1.5" />
        <path d="M 277 285 C 272 273, 262 279, 277 294 C 292 279, 282 273, 277 285 Z" fill="#fb7185" stroke="#ffffff" stroke-width="1.5" />
      </g>`,
  },
  {
    slug: "badge-shared",
    name: "Showcase",
    rarity: "common",
    category: "milestones",
    centerpiece: `
      <!-- Interlocking megaphone broadcasting heart beams -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Broadcast Waves Radiating Right -->
      <path d="M 285 200 C 315 210, 315 270, 285 280" fill="none" stroke="#fde047" stroke-width="4" stroke-linecap="round" opacity="0.8" />
      <path d="M 315 180 C 355 200, 355 280, 315 300" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0.5" />
      <!-- Flying Heart Beams -->
      <g filter="drop-shadow(0 0 6px #f43f5e)">
        <path d="M 345 235 C 337 220, 324 227, 345 247 C 366 227, 353 220, 345 235 Z" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5" />
        <path d="M 315 215 C 310 205, 302 210, 315 223 C 328 210, 320 205, 315 215 Z" fill="#ec4899" stroke="#ffffff" stroke-width="1" />
      </g>
      <!-- Retro-Futuristic Megaphone in Aluminum/Gold -->
      <g transform="translate(180, 195)" filter="drop-shadow(0 4px 6px #451a03)">
        <!-- Megaphone Cone -->
        <polygon points="35,30 95,0 95,80 35,50" fill="#f59e0b" stroke="#f8fafc" stroke-width="3" />
        <ellipse cx="95" cy="40" rx="10" ry="40" fill="#d97706" stroke="#f8fafc" stroke-width="2" />
        <!-- Mouthpiece Body -->
        <rect x="15" y="30" width="20" height="20" rx="4" fill="#64748b" stroke="#cbd5e1" stroke-width="2" />
        <rect x="0" y="34" width="15" height="12" rx="3" fill="#334155" />
        <!-- Handle -->
        <path d="M 30 50 L 22 95 L 34 95 L 42 50 Z" fill="#475569" stroke="#cbd5e1" stroke-width="2" />
      </g>`,
  },
  {
    slug: "card-shared",
    name: "Postman",
    rarity: "common",
    category: "milestones",
    centerpiece: `
      <!-- Paper airplane folded from a golden card soaring -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Vapor Trail Arc -->
      <path d="M 160 330 C 180 320, 195 285, 230 255" fill="none" stroke="#fde047" stroke-width="3" stroke-dasharray="6,4" stroke-linecap="round" opacity="0.7" />
      <path d="M 140 335 C 170 330, 185 295, 220 265" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.5" />
      <!-- Golden Origami Glider / Supersonic Plane -->
      <g transform="translate(260, 215) rotate(-25)" filter="drop-shadow(0 6px 10px #78350f)">
        <!-- Main Wing Top -->
        <polygon points="0,-70 50,45 0,20 -50,45" fill="#fef08a" stroke="#d97706" stroke-width="3" />
        <!-- Right Wing Under-Fold -->
        <polygon points="0,-70 50,45 0,20" fill="#f59e0b" />
        <!-- Left Wing Under-Fold -->
        <polygon points="0,-70 -50,45 0,20" fill="#fbbf24" />
        <!-- Center Keel Spine -->
        <polygon points="0,-70 0,20 0,40" stroke="#b45309" stroke-width="3" />
        <!-- Golden Scratch Foil Texture on Wings -->
        <circle cx="20" cy="10" r="6" fill="#ffffff" opacity="0.8" />
        <circle cx="-20" cy="10" r="6" fill="#ffffff" opacity="0.8" />
      </g>
      <!-- Soaring Sparkles -->
      <circle cx="330" cy="165" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 4px #fde047)" />
      <circle cx="210" cy="180" r="3.5" fill="#fde047" />`,
  },
];

