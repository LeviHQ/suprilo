# Suprilo Card Experience & Creation Studio Specification

**Document Version:** 1.0.0  
**Status:** Living Engineering Architecture & Design Standard  
**Last Updated:** November 2026  
**Module:** Interactive Scratch Engine, Foil Shaders, Studio Hub & Recipient Experience  

---

## 1. Executive Summary & Design Philosophy

The Suprilo scratch card is the heart of the platform. Cards must evoke **anticipation, tactile delight, and an emotional dopamine hit**, abandoning flat, administrative interfaces in favor of a **Luminous Futuristic Ticket** aesthetic.

### Core Cardinal Rules:

1. **The Pure Surprise Rule (Inside the Card)**:
   - The interior card surface revealed beneath the scratch foil contains **100% pure surprise content**.
   - **Zero administrative clutter** inside the card: no recipient headers, no sender labels with hearts, no status indicators, and no website URLs.
   - The revealed space is exclusively dedicated to the **Hero Visual** (Secret Memory Photo or 3D Animated Sticker), the **Big Emotional Message** in dramatic typography, and an optional **Secondary Secret Note Capsule**.

2. **The Luminous Ticket Silhouette**:
   - The card is framed as an exclusive high-stakes pass with **semicircular cutout notches** on the left and right edges.
   - Encased in a **neon ambient glow bezel** matching the active foil style (e.g. Electric Cyan/Violet for Cosmic Cyber, 24K Amber Gold for Royal Gold, Emerald Aurora for Mint, Pearlescent Rose for Lavender).

3. **The Separate Stats & Info Dock (`CardStatsDock`)**:
   - All administrative, transactional, and tracking details live **below the card** in a dedicated glassmorphic dock:
     - Sender ➔ Recipient gift badge with animated pulse
     - Occasion tag pill with glowing icon
     - Real-time scratch progression meter (live 0% ➔ 100% calculation)
     - Interactive action controls (Audio Mute/Unmute, Instant Reveal, Scratch Again, Share Link, Viral Creator CTA)

4. **Unified Copy Standard**:
   - Every scratch CTA across all foils, templates, and buttons is strictly standardized to **`Scratch to reveal`** (or styled equivalents such as `⚡ SCRATCH TO REVEAL ⚡`, `✨ SCRATCH TO REVEAL ✨`, etc.). Inconsistent variants (`Swipe to reveal`, `Scratch to unlock`, `Slide to uncover`, `Rub with coin`) are strictly prohibited.

---

## 2. Canvas Scratch Foil Engine (`ScratchCard.tsx`)

The interactive scratching experience is powered by an HTML5 `<canvas>` element operating at native device pixel ratio (`dpr`).

```
┌────────────────────────────────────────────────────────┐
│             LUMINOUS CARD FRAME (Aspect 3:4)           │
│         [Left Notch]                  [Right Notch]    │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  LAYER 0: Interior Surprise (Photo/Sticker/Msg)  │  │
│  │  ──────────────────────────────────────────────  │  │
│  │  LAYER 1: Canvas Foil (Shader Gradient + Stamp)  │  │
│  │  ──────────────────────────────────────────────  │  │
│  │  LAYER 2: Spark Particles Canvas (Friction Dust) │  │
│  │  ──────────────────────────────────────────────  │  │
│  │  LAYER 3: Celebration Confetti (On Reveal)       │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             BELOW-CARD STATS DOCK (`CardStatsDock`)    │
│  • Gift Badges: [Sender] ➔ [Recipient] | [Occasion]    │
│  • Live Meter:  [=================> ] 74% Scratched    │
│  • Action Bar:  [Sound] [Instant Reveal] [Share] [CTA] │
└────────────────────────────────────────────────────────┘
```

### 2.1 Technical Specifications

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Canvas Sizing** | Native DPR scaled (1x to 2x) | Prevents blurry rendering on Retina/OLED mobile screens |
| **Brush Radius** | `28px` (default) | Ergonomic touch & mouse clearing width (`lineWidth = radius * 2`) |
| **Line Cap & Join** | `round` | Eliminates jagged corner artifacts during rapid scratching |
| **Compositing Mode** | `destination-out` | Erases alpha channel to reveal underneath surprise layer |
| **Sampling Step** | `8px` grid | High-performance percentage calculation (~120fps overhead < 2ms) |
| **Calculation Throttle**| `100ms` | Bounded calculation loop prevents main-thread frame drops |
| **Default Threshold**| `0.65` (65%) | Triggers automatic reveal when 65% of the foil is cleared |
| **Reveal Animation** | Scale pop + Fade out | Smooth 500ms CSS opacity transition on canvas clearing |

### 2.2 Friction Spark Particles

When a user scratches the foil, the engine dynamically spawns **sparkle particles** at the cursor/pointer coordinates:
- **Velocity**: Outward radial burst with soft gravity and drag.
- **Color Palettes**: Dynamically sampled from the active foil theme (Cyan/Violet for Cosmic, Gold/Yellow for Royal, Emerald/Mint for Mint Fresh, Pink/Orange for Lavender).
- **Lifespan**: Rapid 300ms fade with glowing blur (`shadowBlur = 6`).
- **Performance**: Managed on an independent transparent overlay canvas with `requestAnimationFrame` lifecycle.

### 2.3 Audio & Haptic Feedback

- **Scratching Sound**: Synthesized via Web Audio API pink/brown filtered noise (`SoundManager.startScratch()` and `pulseScratch()`).
- **Reveal Chime**: Arpeggiated cheerful major pentatonic notes (E5, G#5, B5, E6, G#6) synthesized on threshold breach (`SoundManager.playRevealChime()`).
- **Haptic Vibration**: Native mobile haptic pulses triggered on reveal (`navigator.vibrate([40, 60, 100])`).

---

## 3. Foil Themes & Shaders

Suprilo supports 4 primary foil shader styles, each rendering custom canvas gradients, holographic sheen bands, and thematic badges.

### 3.1 Cosmic Purple (`cosmic-purple`) — *Cyber Jackpot / Future Scratch*
- **Aesthetic**: Futuristic cyberpunk arcade pass with glowing cyan and purple neon.
- **Background**: Deep indigo gradient (`#0B0826` ➔ `#21094E` ➔ `#080616`).
- **Visual Details**:
  - Isometric cyber grid lines (`rgba(139, 92, 246, 0.15)`).
  - Cyan circuit board traces with illuminated terminal nodes (`#22D3EE`).
  - Header: `⚡ FUTURE SCRATCH ⚡`.
  - Center Box: Dark glassmorphic ticket box with neon dashed border.
  - Bottom Banner: `⚡ SCRATCH TO REVEAL ⚡`.
- **Glow Bezel**: Cyan-to-purple neon glow (`shadow-[0_0_35px_rgba(34,211,238,0.35)]`).

### 3.2 Golden Foil (`golden-foil`) — *24K Royal Gold VIP Pass*
- **Aesthetic**: Luxurious metallic gold banknote with engraved guilloche luster.
- **Background**: Multi-stop reflective 24K gold gradient (`#FFF3B0` ➔ `#E0A926` ➔ `#9A6F09` ➔ `#FBE68A`).
- **Visual Details**:
  - Angled diagonal metallic luster bands (`-25deg`).
  - Starlight diamond flecks (`rgba(255, 255, 255, 0.65)`).
  - Header: `★ 24K GOLDEN VIP PASS ★`.
  - Center Box: Embossed ivory & gold luxury plaque with amber border.
  - Bottom Banner: `✦ SCRATCH TO REVEAL ✦`.
- **Glow Bezel**: Warm golden amber glow (`shadow-[0_0_35px_rgba(245,158,11,0.35)]`).

### 3.3 Mint Fresh (`mint-fresh`) — *Neon Emerald & Matrix Aurora*
- **Aesthetic**: High-tech emerald laser matrix with iridescent wave ribbons.
- **Background**: Deep emerald & teal gradient (`#022C22` ➔ `#065F46` ➔ `#047857`).
- **Visual Details**:
  - Sine laser wave curves (`rgba(52, 211, 153, 0.28)`).
  - Header: `❖ LUCKY EMERALD PASS ❖`.
  - Center Box: Deep forest glass box with neon emerald border (`#34D399`).
  - Bottom Banner: `❖ SCRATCH TO REVEAL ❖`.
- **Glow Bezel**: Neon mint aurora glow (`shadow-[0_0_35px_rgba(52,211,153,0.35)]`).

### 3.4 Lavender Pink (`lavender-pink`) — *Holographic Rose Velvet*
- **Aesthetic**: Iridescent pastel pearl and rose chrome with diamond glints.
- **Background**: Rose-to-violet gradient (`#FF758C` ➔ `#FF7EB3` ➔ `#F77062` ➔ `#8E54E9`).
- **Visual Details**:
  - Iridescent stardust shimmer bands (`-20deg`).
  - Floating starlight diamond sparkles.
  - Header: `♡ SECRET SURPRISE PASS ♡`.
  - Center Box: Frosted white ticket pill with brand pink border.
  - Bottom Banner: `✨ SCRATCH TO REVEAL ✨`.
- **Glow Bezel**: Pearlescent rose glow (`shadow-[0_0_35px_rgba(255,77,109,0.35)]`).

---

## 4. Interior Surprise Layer Architecture

When the canvas foil is cleared, the interior surprise layer is revealed. It is configured via the active card's `bg_palette` and enforces clean emotional focus:

### 4.1 Layout Hierarchy

1. **Hero Visual Element**:
   - **Custom Memory Photo**: Displayed in an authentic polaroid-inspired frame, tilted `-2deg`, with 3px solid white border, glowing ring (`ring-4 ring-brand-pink/25`), and drop shadow.
   - **Celebratory 3D Sticker**: When no photo is provided, renders the card's chosen sticker icon (`heart`, `sparkles`, `cake`, `flower`, `gift`, `confetti`, `trophy`, `star`) centered in a 3D glassmorphic badge with dynamic animation (pulse or spin).

2. **Primary Message**:
   - Styled with bold, punchy typography:
     - Short messages (<40 chars): `text-xl sm:text-2xl md:text-3xl font-black`
     - Medium messages (40-80 chars): `text-lg sm:text-xl font-extrabold`
     - Long messages (>80 chars): `text-base sm:text-lg font-bold`
   - Dynamically supports creator-chosen `font_family`.

3. **Secondary Secret Note Capsule**:
   - Displayed in a frosted pill container beneath the primary message for hints, coordinates, or secret instructions.

4. **Atmospheric Floating Sparks**:
   - Subtle glowing sparks framing the bottom of the surprise container.

### 4.2 Interior Background Palettes (`BgPaletteId`)

| Palette ID | Gradient | Text Color | Accent Glow |
| :--- | :--- | :--- | :--- |
| `soft-pink` | `from-pink-50 via-white to-rose-100` | `text-rose-950` | Rose Pink Glow |
| `warm-sunshine` | `from-amber-50 via-white to-orange-100` | `text-amber-950` | Warm Gold Glow |
| `royal-amethyst`| `from-purple-50 via-white to-indigo-100` | `text-indigo-950` | Royal Violet Glow |
| `mint-fresh` | `from-emerald-50 via-white to-teal-100` | `text-emerald-950` | Emerald Mint Glow |
| `pure-ivory` | `from-stone-50 via-white to-amber-50/40` | `text-stone-900` | Pure Brand Warm Glow |

---

## 5. Docked Stats & Actions (`CardStatsDock.tsx`)

The `CardStatsDock` component sits directly below the card and renders three distinct rows:

### 5.1 Row 1: Sender, Recipient & Occasion
- **Left Cluster**: Circular gift icon avatar + `From: [Sender] ➔ To: [Recipient]`.
- **Right Cluster**: Rounded occasion pill badge (`🎂 25th Birthday`, `💖 Secret Romance`, etc.).

### 5.2 Row 2: Live Scratch Progression Meter
- **Dynamic Text**:
  - `0% Scratched`: `"Scratch to reveal"`
  - `1% - 64%`: `"✨ Scratching..."` with flame icon
  - `65%+`: `"🎉 Surprise Unlocked!"` with spinning sparkle
- **Progression Bar**: Smooth gradient fill (`from-brand-orange via-brand-pink to-brand-purple` transitioning to emerald when unlocked).

### 5.3 Row 3: Interactive Action Controls
- **Audio Toggle**: Mute / Unmute with live soundwave animation.
- **State Action**:
  - Before reveal: `"Instant Reveal"` eye button for fast access.
  - After reveal: `"Scratch Again"` refresh button to replay foil clearing.
- **Share Button**: Native clipboard copy with 2.2s `"Copied!"` feedback indicator.
- **Viral Creator CTA**: `"Want to send a surprise card like this? Make one for free ➔"`.

---

## 6. Database Schema & API Contracts

### 6.1 Database Table: `public.cards`

```sql
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CONSTRAINT chk_cards_slug_format CHECK (slug ~ '^[2-9a-hj-km-np-z]{12}$'),
  status text NOT NULL DEFAULT 'draft' CONSTRAINT chk_cards_status CHECK (status IN ('draft', 'published', 'archived')),
  creation_mode text NOT NULL DEFAULT 'scratch' CONSTRAINT chk_cards_creation_mode CHECK (creation_mode IN ('template', 'scratch')),
  draft_slot integer NULL CONSTRAINT chk_cards_draft_slot CHECK (draft_slot BETWEEN 1 AND 3),

  -- Template Identifier (Validated via regex against approved kebab-case pattern)
  template_id text NULL CONSTRAINT chk_cards_template_id CHECK (
    template_id IS NULL OR (
      template_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      AND char_length(template_id) BETWEEN 3 AND 60
    )
  ),

  recipient_name text NOT NULL CONSTRAINT chk_cards_recipient_name CHECK (char_length(trim(recipient_name)) BETWEEN 1 AND 30),
  sender_name text NOT NULL CONSTRAINT chk_cards_sender_name CHECK (char_length(trim(sender_name)) BETWEEN 1 AND 30),
  occasion_tag text NOT NULL CONSTRAINT chk_cards_occasion_tag CHECK (char_length(trim(occasion_tag)) BETWEEN 1 AND 25),
  primary_message text NOT NULL CONSTRAINT chk_cards_primary_message CHECK (char_length(trim(primary_message)) BETWEEN 1 AND 160),
  secondary_message text NULL CONSTRAINT chk_cards_secondary_message CHECK (secondary_message IS NULL OR char_length(secondary_message) <= 90),

  foil_style text NOT NULL DEFAULT 'lavender-pink' CONSTRAINT chk_cards_foil_style CHECK (foil_style IN ('lavender-pink', 'golden-foil', 'cosmic-purple', 'mint-fresh')),
  cover_text text NOT NULL DEFAULT 'Scratch to reveal your surprise ✨' CONSTRAINT chk_cards_cover_text CHECK (char_length(trim(cover_text)) BETWEEN 1 AND 60),
  bg_palette text NOT NULL DEFAULT 'pure-ivory' CONSTRAINT chk_cards_bg_palette CHECK (bg_palette IN ('soft-pink', 'warm-sunshine', 'royal-amethyst', 'mint-fresh', 'pure-ivory')),
  sticker text NOT NULL DEFAULT 'sparkles' CONSTRAINT chk_cards_sticker CHECK (sticker IN ('heart', 'sparkles', 'cake', 'flower', 'gift', 'confetti', 'trophy', 'star')),
  font_family text NULL CONSTRAINT chk_cards_font_family CHECK (font_family IS NULL OR char_length(font_family) <= 50),
  photo_path text NULL,

  reveal_threshold numeric NOT NULL DEFAULT 0.65 CONSTRAINT chk_cards_reveal_threshold CHECK (reveal_threshold BETWEEN 0.10 AND 0.95),
  sound_enabled boolean NOT NULL DEFAULT true,
  published_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 6.2 Stored Procedure: `public.create_card_draft`
Draft initialization executes server-side with `SECURITY DEFINER` resolving `auth.uid()`, strictly managing the user's 3 concurrent draft slots (`1..3`).

---

## 7. Master Template Catalog (100 Templates + Blank Canvas)

The studio catalog is organized across 10 occasion categories with 10 templates each:
1. **Birthday** (`birthday`): 10 curated designs
2. **Love & Romance** (`love`): 10 curated designs
3. **Friendship** (`friendship`): 10 curated designs
4. **Funny & Memes** (`funny`): 10 curated designs
5. **Celebrations** (`celebrations`): 10 curated designs
6. **Workplace & Career** (`workplace`): 10 curated designs
7. **Big Reveals** (`reveals`): 10 curated designs
8. **Heartfelt & Care** (`heartfelt`): 10 curated designs
9. **Holidays** (`holidays`): 10 curated designs
10. **Interactive Games** (`games`): 10 curated designs
- **Blank Canvas Studio** (`custom-scratch`): Pinned 100% custom freedom mode.

---

## 8. Maintenance & Extension Protocols

### Adding a New Template
1. Add template definition to `SU_PRILO_TEMPLATES` in `src/data/templates.ts`.
2. Follow kebab-case format: `{category}-{descriptor}` (e.g. `love-rooftop-picnic`).
3. Set `coverText` adhering strictly to `"Scratch to reveal [surprise] [emoji]"`.
4. Register the new template ID in `TEMPLATE_PALETTE_MAP` (`src/types/card.ts`).

### Modifying Foil Shaders
1. Foil shader logic resides strictly in `drawCover` within `src/components/scratch/ScratchCard.tsx`.
2. Bottom action text must always adhere to the `"SCRATCH TO REVEAL"` standard.
3. Canvas operations must respect `dprRef` transformation.

---

**Certified & Maintained By:** Suprilo Engineering Team
