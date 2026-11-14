# Suprilo Card Experience & Creation Studio Specification

**Document Version:** 2.0.0  
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
   - Encased in a **neon ambient glow bezel** matching the active foil style (e.g. Electric Cyan/Violet for Cosmic Cyber, 24K Amber Gold for Royal Gold, Emerald Aurora for Mint, Pearlescent Rose for Lavender, etc.).

3. **The Separate Stats & Info Dock (`CardStatsDock`)**:
   - All administrative, transactional, and tracking details live **below the card** in a dedicated glassmorphic dock:
     - Sender ➔ Recipient gift badge with animated pulse
     - Occasion tag pill with glowing icon
     - Real-time scratch progression meter (live 0% ➔ 100% calculation)
     - Interactive action controls (Audio Mute/Unmute, Instant Reveal, Scratch Again, Share Link, Viral Creator CTA)

4. **Unified Copy Standard**:
   - Every scratch CTA across all foils, templates, and buttons is strictly standardized to **`Scratch to reveal`** (or styled variants such as `⚡ SCRATCH TO REVEAL ⚡`, `✦ SCRATCH TO REVEAL ✦`, `✨ SCRATCH TO REVEAL ✨`, etc.). Inconsistent variants (`Swipe to reveal`, `Scratch to unlock`, `Slide to uncover`, `Rub with coin`) are strictly prohibited.

5. **Clean Studio Architecture (No Subcategories in Sidebar)**:
   - The left sidebar is strictly minimalist with only **4 Core Parent Categories** + **Saved Templates**:
     - `Life & Milestones` (Evergreen: Birthday, Anniversary, Friendship, Wedding & Baby, Career)
     - `Trending & Calendar` (Dynamic holidays & seasonal moments)
     - `Social Media & Wins` (YouTube, X / Twitter, Instagram, Startup & Creator wins)
     - `Surprise & Mystery` (Mystery vouchers, truth/dare, roasts, confessions)
     - `Saved Templates` (Pinned at bottom; renders user drafts **directly in the studio**, NEVER redirecting to `/profile`).

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
- **Color Palettes**: Dynamically sampled from the active foil theme (Cyan/Violet for Cyber/Future Scratch, Gold/Yellow for Royal 24K Gold, Emerald/Mint for Lucky Emerald, Pink/Orange for Holographic Rose, Ruby/Crimson for Festive Velvet).
- **Lifespan**: Rapid 300ms fade with glowing blur (`shadowBlur = 6`).
- **Performance**: Managed on an independent transparent overlay canvas with `requestAnimationFrame` lifecycle.

### 2.3 Audio & Haptic Feedback

- **Scratching Sound**: Synthesized via Web Audio API pink/brown filtered noise (`SoundManager.startScratch()` and `pulseScratch()`).
- **Reveal Chime**: Arpeggiated cheerful major pentatonic notes (E5, G#5, B5, E6, G#6) synthesized on threshold breach (`SoundManager.playRevealChime()`).
- **Haptic Vibration**: Native mobile haptic pulses triggered on reveal (`navigator.vibrate([40, 60, 100])`).

---

## 3. Foil Shader Architecture & Thematic Families

Suprilo maps every foil dynamically to a tailored shader family inside `ScratchCard.tsx`'s `drawCover` engine:

### 3.1 Cyber / Future Scratch Family (`cosmic-purple`, `cyber-*`, `neon-*`, `matrix-*`, `hacker-*`)
- **Aesthetic**: Inspired by high-stakes futuristic jackpot tickets with cyan & purple circuits.
- **Visual Elements**:
  - Isometric cyber grid pattern (`rgba(139, 92, 246, 0.18)`).
  - Glowing cyan circuit traces (`#22D3EE`) with bright electrical contact nodes (`#A5F3FC`).
  - Terminal code watermark text (`0100 1011 JACKPOT!`).
  - Header: `⚡ FUTURE SCRATCH ⚡`.
  - Center: Dark glassmorphic ticket box with cyan dashed border.
  - Bottom Stamp: `⚡ SCRATCH TO REVEAL ⚡`.
- **Glow Bezel**: Cyan-to-purple neon glow (`shadow-[0_0_35px_rgba(34,211,238,0.35)]`).

### 3.2 24K Royal Gold & VIP Family (`golden-foil`, `gold-*`, `luxury-*`, `vip-*`, `champagne-*`)
- **Aesthetic**: Luxurious metallic banknote luster with angled sheen reflections.
- **Visual Elements**:
  - Multi-stop metallic 24K gold gradient (`#FFF3B0` ➔ `#E0A926` ➔ `#9A6F09` ➔ `#FBE68A`).
  - Angled specular reflection bands (`-25deg`).
  - Starburst glints (`rgba(255, 255, 255, 0.75)`).
  - Header: `★ 24K GOLDEN VIP PASS ★`.
  - Center: Embossed ivory luxury badge.
  - Bottom Stamp: `✦ SCRATCH TO REVEAL ✦`.
- **Glow Bezel**: Warm golden amber glow (`shadow-[0_0_35px_rgba(245,158,11,0.35)]`).

### 3.3 Lucky Emerald & Aurora Matrix Family (`mint-fresh`, `emerald-*`, `mint-*`, `aurora-*`)
- **Aesthetic**: Glowing matrix lasers with iridescent green/teal silk waves.
- **Visual Elements**:
  - Sine wave laser ribbons (`rgba(52, 211, 153, 0.28)`).
  - Header: `❖ LUCKY EMERALD PASS ❖`.
  - Center: Deep forest glass ticket badge with neon mint border.
  - Bottom Stamp: `❖ SCRATCH TO REVEAL ❖`.
- **Glow Bezel**: Neon mint aurora glow (`shadow-[0_0_35px_rgba(52,211,153,0.35)]`).

### 3.4 Holographic Rose & Pastel Velvet Family (`lavender-pink`, `rose-*`, `holographic-*`, `pastel-*`)
- **Aesthetic**: Iridescent chrome pearl and romantic rose velvet.
- **Visual Elements**:
  - Multidimensional pastel gradient (`#FF758C` ➔ `#FF7EB3` ➔ `#F77062` ➔ `#8E54E9`).
  - Holographic stardust shimmer bands (`-20deg`).
  - Header: `♡ SECRET SURPRISE PASS ♡`.
  - Center: Frosted white ticket pill with brand pink border.
  - Bottom Stamp: `✨ SCRATCH TO REVEAL ✨`.
- **Glow Bezel**: Pearlescent rose glow (`shadow-[0_0_35px_rgba(255,77,109,0.35)]`).

### 3.5 Velvet Ruby & Festive Scarlet Family (`ruby-*`, `crimson-*`, `festive-*`, `diwali-*`, `fire-*`)
- **Aesthetic**: Deep royal red velvet with warm golden flares.
- **Visual Elements**:
  - Deep crimson gradient (`#5B0612` ➔ `#9B111E` ➔ `#E11D48` ➔ `#4C0519`).
  - Festive warm gold starbursts and diagonal shimmer ribbons.
  - Bottom Stamp: `🎉 SCRATCH TO REVEAL 🎉`.

### 3.6 Titanium, Obsidian & Stealth Monochrome Family (`obsidian-*`, `titanium-*`, `stealth-*`, `silver-*`)
- **Aesthetic**: High-grade industrial carbon, brushed titanium, and deep space noir.
- **Visual Elements**:
  - Sleek dark titanium gradient (`#0B0F17` ➔ `#1E293B` ➔ `#334155` ➔ `#0F172A`).
  - Subtle laser-etched horizontal hairline grain.
  - Bottom Stamp: `◈ SCRATCH TO REVEAL ◈`.

---

## 4. Creation Studio Architecture (`/create`)

The Creation Studio uses a **Modular Template Engine** designed for maximum usability, zero sidebar clutter, and scalable subcategories:

```
┌───────────────────┬──────────────────────────────────────────────────────────┐
│ STUDIO SIDEBAR    │ TOP RECTANGLE SUBCATEGORY BANNER                         │
│                   │ ┌──────────────────────────────────────────────────────┐ │
│ 🌿 Life           │ │ 🎂 BIRTHDAY MILESTONES & PARTIES    [5 FOILS READY]  │ │
│                   │ │ Epic confetti cannons, midnight cake drops...        │ │
│ ⚡ Trending       │ │ Foils: [Gold] [Neon Cyber] [Ruby] [Pastel] [Glitter] │ │
│                   │ │ ───────────────────────────────────────────────────  │ │
│ 🚀 Social Media   │ │ Subcategories: [Birthday*] [Anniversary] [Friendship]│ │
│                   │ └──────────────────────────────────────────────────────┘ │
│ 🎁 Surprise       │                                                          │
│                   │ TEMPLATE GRID (5 Themed Cards + 1 Blank Canvas)          │
│                   │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│                   │ │ Card #1 │ │ Card #2 │ │ Card #3 │ │ Card #4 │          │
│                   │ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                   │ ┌─────────┐ ┌───────────────────┐                        │
│                   │ │ Card #5 │ │ ✦ BLANK CANVAS    │                        │
│                   │ └─────────┘ └───────────────────┘                        │
│ ───────────────── │                                                          │
│ 📁 Saved (0/3)    │ (Clicking 'Saved' opens In-Studio Drafts Gallery)        │
└───────────────────┴──────────────────────────────────────────────────────────┘
```

### 4.1 Parent Navigation Hierarchy
1. **Life & Milestones (`life`)**:
   - Subcategories: `birthday`, `anniversary`, `friendship`, `wedding-baby`, `career-hustle`.
2. **Trending & Calendar (`trending`)**:
   - Subcategories: `festivals-india`, `global-holidays`, `pop-culture`, `wellness-mental`.
3. **Social Media & Wins (`social`)**:
   - Subcategories: `youtube-milestones`, `x-twitter-wins`, `instagram-creators`, `startup-builder`.
4. **Surprise & Mystery (`surprise`)**:
   - Subcategories: `mystery-vouchers`, `truth-or-dare`, `secret-confessions`, `meme-roasts`.
5. **Saved Templates & Drafts (`saved-templates`)**:
   - Rendered **in-place inside the right studio canvas** (no redirect to `/profile`).
   - Shows active draft slot count (`N / 3 Slots Used`).
   - Cards display draft foil style, recipient, occasion, timestamp, "Continue Editing" button, and "Delete Draft" action.

### 4.2 Top Rectangle Subcategory Banner
- **Header & Visual Identity**: Displays the subcategory's active title, emoji, description, and status badge (`5 FOILS READY`).
- **Foil Palette Swatches**: Shows the 5 curated foils specific to this subcategory with color dots and names.
- **Docked Subcategory Switcher**: Horizontal pill tabs at the bottom of the banner allowing instant 1-click subcategory switching without leaving the parent context.

### 4.3 Template Grid (5 Foil Cards + 1 Blank Canvas)
- **Cards 1 to 5**: Dedicated handcrafted cards mapping 1:1 to the subcategory's 5 themed foils.
- **Card 6 (Blank Canvas)**: "Create Custom Card" card pre-configured with the subcategory's primary foil, giving users complete creative freedom.

---

## 5. Database Schema & Supabase Migrations

### 5.1 Foil Style Constraint Migration (`20261114000001_expand_foil_styles.sql`)
The legacy check constraint restricting `foil_style` to only 4 options was dropped and replaced by an open, regex-validated pattern:

```sql
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS chk_cards_foil_style;

ALTER TABLE public.cards
  ADD CONSTRAINT chk_cards_foil_style CHECK (
    foil_style ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND char_length(foil_style) BETWEEN 2 AND 50
  );
```

### 5.2 Template ID Constraint Migration (`20261113000001_expand_template_catalog.sql`)
Supports any valid kebab-case template identifier:

```sql
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS chk_cards_template_id;

ALTER TABLE public.cards
  ADD CONSTRAINT chk_cards_template_id CHECK (
    template_id IS NULL OR (
      template_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      AND char_length(template_id) BETWEEN 3 AND 60
    )
  );
```

---

## 6. Testing & Quality Checklist

- [x] **Zero TypeScript Errors**: Verified with `npx tsc --noEmit --incremental false`.
- [x] **Production Next.js Build**: Compiles cleanly with zero route or JSX errors.
- [x] **Supabase Production Migrations**: Both template ID and foil style migrations applied to linked production Supabase (`naynjodssamuacmjkaqx`).
- [x] **Copy Consistency**: All scratch prompts across cards, foils, and docks strictly say `"Scratch to reveal"`.
- [x] **In-Studio Saved Drafts**: Selecting Saved Templates switches view to in-studio drafts gallery without page redirection.

---

**Certified & Maintained By:** Suprilo Engineering Team
