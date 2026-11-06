// ============================================================================
// Category 1: Getting Started (Badges 1–10)
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// ============================================================================

export const CATEGORY_1_BADGES = [
  {
    slug: "first-step",
    name: "Welcome Creator",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Base Shadow -->
      <ellipse cx="256" cy="358" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Steps Leading Up -->
      <path d="M 180 352 L 332 352 L 322 366 L 190 366 Z" fill="#94a3b8" stroke="#475569" stroke-width="2" />
      <path d="M 194 340 L 318 340 L 312 352 L 200 352 Z" fill="#cbd5e1" stroke="#475569" stroke-width="2" />
      <!-- Door Frame -->
      <path d="M 196 340 L 196 210 Q 256 148 316 210 L 316 340 Z" fill="#1e293b" stroke="#f8fafc" stroke-width="5" />
      <!-- Glowing Interior Aperture -->
      <path d="M 204 338 L 204 214 Q 256 160 308 214 L 308 338 Z" fill="#fef08a" />
      <polygon points="256,190 150,380 362,380" fill="#fef9c3" opacity="0.35" />
      <!-- Sparkles -->
      <g fill="#ffffff" filter="drop-shadow(0 0 4px #fbbf24)">
        <path d="M 256 142 Q 256 156 266 156 Q 256 156 256 170 Q 256 156 246 156 Q 256 156 256 142 Z" />
        <path d="M 160 230 Q 160 240 168 240 Q 160 240 160 250 Q 160 240 152 240 Q 160 240 160 230 Z" />
        <path d="M 352 220 Q 352 232 362 232 Q 352 232 352 244 Q 352 232 342 232 Q 352 232 352 220 Z" />
        <circle cx="180" cy="190" r="3" />
        <circle cx="330" cy="180" r="3.5" />
      </g>`,
  },
  {
    slug: "first-draft",
    name: "First Draft",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Floating Parchment Draft with Glowing Neon Quill -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.35" />
      <!-- Parchment sheet -->
      <g transform="translate(195, 175) rotate(-6)">
        <rect x="0" y="0" width="115" height="150" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="3" />
        <!-- Draft text lines -->
        <line x1="20" y1="30" x2="95" y2="30" stroke="#b45309" stroke-width="4" stroke-linecap="round" />
        <line x1="20" y1="50" x2="85" y2="50" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
        <line x1="20" y1="70" x2="90" y2="70" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
        <line x1="20" y1="90" x2="65" y2="90" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
        <!-- Corner curl -->
        <path d="M 95 150 L 115 130 L 95 130 Z" fill="#fde68a" stroke="#d97706" stroke-width="1.5" />
      </g>
      <!-- Neon Quill Pen -->
      <g transform="translate(295, 150) rotate(32)" filter="drop-shadow(0 0 6px #06b6d4)">
        <path d="M 0 0 C 15 25, 25 80, -10 130 C 5 95, 10 40, 0 0 Z" fill="#22d3ee" stroke="#ffffff" stroke-width="2" />
        <line x1="-10" y1="130" x2="-14" y2="145" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        <!-- Ink droplet -->
        <circle cx="-16" cy="154" r="3" fill="#38bdf8" />
      </g>
      <circle cx="215" cy="165" r="3" fill="#ffffff" />
      <circle cx="340" cy="270" r="3.5" fill="#fde047" />`,
  },
  {
    slug: "first-card",
    name: "First Spark",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Electric spark igniting festive scratch card -->
      <ellipse cx="256" cy="355" rx="85" ry="14" fill="#000000" opacity="0.4" />
      <!-- Base Scratch Card in 3D Isometric Tilt -->
      <g transform="translate(170, 185) rotate(-8)">
        <rect x="0" y="0" width="165" height="115" rx="10" fill="#f8fafc" stroke="#64748b" stroke-width="4" />
        <!-- Card Inner Surface -->
        <rect x="10" y="10" width="145" height="95" rx="6" fill="#e2e8f0" />
        <!-- Scratch Foil Path (Partially Scratched) -->
        <path d="M 25 30 Q 75 15 125 35 Q 140 70 120 85 Q 60 95 30 75 Z" fill="#94a3b8" stroke="#475569" stroke-width="2" />
        <!-- Revealed Surprise Glitter underneath -->
        <path d="M 45 40 Q 80 30 105 45 Q 115 70 95 78 Q 55 82 45 60 Z" fill="#fbbf24" />
      </g>
      <!-- Electric Spark Explosion -->
      <g filter="drop-shadow(0 0 8px #f59e0b)">
        <polygon points="256,150 264,195 295,180 270,210 310,225 260,230 275,265 245,235 220,260 235,220 195,215 235,195 220,165 250,185" fill="#fde047" stroke="#ffffff" stroke-width="2" />
        <circle cx="256" cy="210" r="7" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "named-recipient",
    name: "Name in Lights",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Neon marquee nameplate adorned with stars -->
      <ellipse cx="256" cy="355" rx="90" ry="12" fill="#000000" opacity="0.35" />
      <!-- Marquee Plaque -->
      <rect x="156" y="210" width="200" height="90" rx="14" fill="#0f172a" stroke="#cbd5e1" stroke-width="4" />
      <!-- Inner Neon Border -->
      <rect x="166" y="220" width="180" height="70" rx="10" fill="none" stroke="#38bdf8" stroke-width="3" filter="drop-shadow(0 0 4px #0284c7)" />
      <!-- Text: VIP Star Marquee -->
      <text x="256" y="266" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#f8fafc" text-anchor="middle" letter-spacing="4">VIP</text>
      <!-- Corner Stud Stars -->
      <g fill="#fde047" filter="drop-shadow(0 0 3px #eab308)">
        <path d="M 180 200 L 183 208 L 191 208 L 185 213 L 187 221 L 180 216 L 173 221 L 175 213 L 169 208 L 177 208 Z" />
        <path d="M 332 200 L 335 208 L 343 208 L 337 213 L 339 221 L 332 216 L 325 221 L 327 213 L 321 208 L 329 208 Z" />
        <circle cx="256" cy="180" r="5" fill="#38bdf8" />
      </g>`,
  },
  {
    slug: "secret-note",
    name: "Secret Note",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Wax-sealed love envelope with glowing heart seal -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Folded Envelope Body -->
      <g transform="translate(170, 195) rotate(-4)">
        <rect x="0" y="0" width="170" height="110" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
        <!-- Envelope Fold Flaps -->
        <path d="M 0 0 L 85 65 L 170 0" fill="none" stroke="#94a3b8" stroke-width="2.5" />
        <path d="M 0 110 L 60 50" fill="none" stroke="#cbd5e1" stroke-width="2" />
        <path d="M 170 110 L 110 50" fill="none" stroke="#cbd5e1" stroke-width="2" />
        <!-- Red Wax Seal -->
        <circle cx="85" cy="65" r="24" fill="#dc2626" stroke="#991b1b" stroke-width="2" filter="drop-shadow(0 2px 4px #7f1d1d)" />
        <circle cx="85" cy="65" r="19" fill="#ef4444" />
        <!-- Embossed Heart on Wax -->
        <path d="M 85 73 L 76 64 C 72 60, 72 54, 76 50 C 80 46, 84 48, 85 52 C 86 48, 90 46, 94 50 C 98 54, 98 60, 94 64 Z" fill="#ffffff" />
      </g>`,
  },
  {
    slug: "custom-cover",
    name: "Custom Cover",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Metallic theatrical curtains peeling open -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Stage backboard glowing card -->
      <rect x="180" y="180" width="152" height="152" rx="8" fill="#fef08a" stroke="#f59e0b" stroke-width="3" />
      <polygon points="256,220 270,250 256,280 242,250" fill="#f59e0b" />
      <!-- Left Curtain Drape (Deep Crimson Metallic) -->
      <path d="M 160 170 C 180 210, 185 270, 150 330 L 195 330 C 220 270, 215 210, 195 170 Z" fill="#e11d48" stroke="#881337" stroke-width="2" />
      <path d="M 165 170 C 180 220, 180 270, 160 330" fill="none" stroke="#f43f5e" stroke-width="3" opacity="0.6" />
      <!-- Right Curtain Drape -->
      <path d="M 352 170 C 332 210, 327 270, 362 330 L 317 330 C 292 270, 297 210, 317 170 Z" fill="#e11d48" stroke="#881337" stroke-width="2" />
      <path d="M 347 170 C 332 220, 332 270, 352 330" fill="none" stroke="#f43f5e" stroke-width="3" opacity="0.6" />
      <!-- Top Valance Pelmet -->
      <path d="M 155 170 Q 205 190 256 175 Q 307 190 357 170 L 357 160 L 155 160 Z" fill="#be123c" stroke="#881337" stroke-width="2" />
      <!-- Golden Tieback Tassels -->
      <circle cx="165" cy="270" r="5" fill="#fde047" />
      <circle cx="347" cy="270" r="5" fill="#fde047" />`,
  },
  {
    slug: "music-lover",
    name: "Soundtrack",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Floating 3D musical treble note with pulse rings -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.35" />
      <!-- Soundwave Pulse Rings -->
      <ellipse cx="256" cy="256" rx="100" ry="70" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4" />
      <ellipse cx="256" cy="256" rx="130" ry="90" fill="none" stroke="#818cf8" stroke-width="1" stroke-dasharray="8,6" opacity="0.3" />
      <!-- Floating 3D Treble Clef Note -->
      <g filter="drop-shadow(0 4px 6px #0f172a)">
        <path d="M 264 160 C 264 140, 246 150, 246 170 C 246 195, 275 220, 275 255 C 275 295, 230 305, 230 275 C 230 255, 250 255, 250 268 C 250 274, 246 278, 242 278 C 240 278, 238 274, 240 270 C 245 250, 280 255, 280 220 C 280 185, 252 165, 252 145 C 252 135, 258 130, 264 135 Z" fill="#fbbf24" stroke="#d97706" stroke-width="3" />
        <line x1="256" y1="135" x2="256" y2="330" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />
        <circle cx="240" cy="335" r="16" fill="#f59e0b" stroke="#b45309" stroke-width="3" />
      </g>
      <!-- Musical Beamed Eighth Notes Floating -->
      <g fill="#fde047" opacity="0.9">
        <circle cx="180" cy="210" r="6" />
        <circle cx="205" cy="200" r="6" />
        <path d="M 186 210 L 186 175 L 211 165 L 211 200 Z" stroke="#f59e0b" stroke-width="2" />
      </g>`,
  },
  {
    slug: "photo-memory",
    name: "Picture Perfect",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Polaroid frame revealing an iridescent gemstone -->
      <ellipse cx="256" cy="355" rx="80" ry="12" fill="#000000" opacity="0.35" />
      <!-- Tilted Polaroid Frame -->
      <g transform="translate(180, 175) rotate(-6)">
        <rect x="0" y="0" width="150" height="175" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="4" filter="drop-shadow(0 4px 6px #334155)" />
        <!-- Photo Window (Dark Indigo Night) -->
        <rect x="14" y="14" width="122" height="115" rx="4" fill="#0f172a" />
        <!-- Iridescent Gemstone inside photo -->
        <g transform="translate(75, 70)">
          <!-- Gem Facets -->
          <polygon points="0,-35 30,-12 20,30 -20,30 -30,-12" fill="#a855f7" stroke="#e9d5ff" stroke-width="2" />
          <polygon points="0,-35 15,0 0,35 -15,0" fill="#c084fc" opacity="0.7" />
          <polygon points="0,-35 30,-12 15,0" fill="#e879f9" opacity="0.8" />
          <polygon points="30,-12 20,30 0,35 15,0" fill="#d946ef" opacity="0.6" />
        </g>
        <!-- Heart stamp on Polaroid bottom margin -->
        <path d="M 75 155 L 71 150 C 69 148, 69 145, 71 143 C 73 141, 75 142, 75 144 C 75 142, 77 141, 79 143 C 81 145, 81 148, 79 150 Z" fill="#f43f5e" />
      </g>`,
  },
  {
    slug: "first-archive",
    name: "Curator",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Ornate velvet museum archive box with ribbon -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.4" />
      <!-- Archive Chest Base -->
      <path d="M 170 240 L 342 240 L 332 340 L 180 340 Z" fill="#1e3a8a" stroke="#172554" stroke-width="4" />
      <!-- Chest Lid -->
      <path d="M 160 215 L 352 215 L 342 245 L 170 245 Z" fill="#1d4ed8" stroke="#1e40af" stroke-width="3" />
      <!-- Golden Corner Brackets -->
      <path d="M 170 245 L 185 245 L 185 260 L 170 260 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.5" />
      <path d="M 342 245 L 327 245 L 327 260 L 342 260 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.5" />
      <path d="M 180 340 L 195 340 L 195 325 L 180 325 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.5" />
      <path d="M 332 340 L 317 340 L 317 325 L 332 325 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.5" />
      <!-- Golden Silk Ribbon & Latch -->
      <rect x="246" y="215" width="20" height="125" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" />
      <circle cx="256" cy="255" r="10" fill="#fef08a" stroke="#b45309" stroke-width="2" />
      <rect x="253" y="260" width="6" height="12" rx="2" fill="#78350f" />`,
  },
  {
    slug: "palette-pioneer",
    name: "Style Pioneer",
    rarity: "common",
    category: "getting-started",
    centerpiece: `
      <!-- Artist's glass palette with glowing paint droplets -->
      <ellipse cx="256" cy="355" rx="85" ry="12" fill="#000000" opacity="0.35" />
      <!-- Glass Palette Board -->
      <g transform="translate(256, 256) rotate(-15) translate(-256, -256)">
        <path d="M 170 250 C 170 180, 240 160, 310 180 C 360 200, 360 280, 320 320 C 280 350, 240 330, 220 345 C 200 360, 170 330, 170 250 Z" fill="#ffffff" fill-opacity="0.25" stroke="#f8fafc" stroke-width="4" filter="drop-shadow(0 4px 6px #0f172a)" />
        <!-- Thumb Hole -->
        <ellipse cx="210" cy="320" rx="14" ry="18" fill="#064e3b" stroke="#ffffff" stroke-width="2" />
        <!-- Glowing Paint Swatches -->
        <circle cx="230" cy="190" r="14" fill="#f43f5e" stroke="#fff" stroke-width="2" filter="drop-shadow(0 0 4px #e11d48)" />
        <circle cx="275" cy="195" r="14" fill="#fbbf24" stroke="#fff" stroke-width="2" filter="drop-shadow(0 0 4px #d97706)" />
        <circle cx="320" cy="225" r="14" fill="#10b981" stroke="#fff" stroke-width="2" filter="drop-shadow(0 0 4px #059669)" />
        <circle cx="330" cy="275" r="14" fill="#38bdf8" stroke="#fff" stroke-width="2" filter="drop-shadow(0 0 4px #0284c7)" />
      </g>`,
  },
];

