# Suprilo Platform UI Design System & Engineering Standards

> **Canonical Master Specification: SPEC-UI-2026-FINAL**
> **Mandatory Reference for All Engineers, Subagents, and AI Assistants Working on Suprilo UI.**
> *Always consult and adhere to this document before creating or modifying any UI component, page layout, image asset, or numeric gamification display.*

---

## Table of Contents
1. [Core UI Philosophy & Visual Identity](#1-core-ui-philosophy--visual-identity)
2. [Header, Navigation & Dropdown Containment Architecture](#2-header-navigation--dropdown-containment-architecture)
3. [Fixed Platform Asset Instant-Loading Formula](#3-fixed-platform-asset-instant-loading-formula)
4. [Gamification & Numeric Precision Standards](#4-gamification--numeric-precision-standards)
5. [Badge, Pill & Tag Typography & Wrapping Rules](#5-badge-pill--tag-typography--wrapping-rules)
6. [Mobile Viewport & Horizontal Overflow Prevention](#6-mobile-viewport--horizontal-overflow-prevention)
7. [Color Palette, Elevation & Shadows](#7-color-palette-elevation--shadows)
8. [Checklist for Every UI Pull Request / Turn](#8-checklist-for-every-ui-pull-request--turn)

---

## 1. Core UI Philosophy & Visual Identity

Suprilo is designed to evoke **joy, warmth, anticipation, and emotional delight**.
- **Warm Canvas**: Base background is `#FFFDFB` (warm white) with delicate warm border accents (`#F3EDE8` / `#EAE3DB`).
- **Brand Colors**:
  - Primary Pink: `#FF4D6D` (CTA buttons, key highlights, primary focus)
  - Accent Orange: `#FF9F1C` (sparks, stars, warmth)
  - Accent Purple: `#8B5CF6` (creativity, discovery, badges)
  - Deep Ink: `#17152A` (crisp, readable, high-contrast headings and body copy)
- **Rounded Harmony**: Rounded cards (`rounded-3xl` / `24px-30px`), friendly pill buttons (`rounded-full`), and clean micro-interactions (`active:scale-95`).

---

## 2. Header, Navigation & Dropdown Containment Architecture

### The Golden Rule of Headers
> **NEVER apply `overflow: hidden`, `overflow-x: hidden`, or `overflow-y: hidden` to `<header>` or any parent container that hosts floating dropdown menus, popovers, or notification bells.**

### The Technical Reason (CSS Overflow Level 3 Specification)
Per the W3C CSS Overflow Module Level 3 specification:
- If either `overflow-x` or `overflow-y` is set to `hidden`, `scroll`, or `auto`, the other axis **CANNOT compute to `visible`**—the browser automatically computes it to `auto` or `hidden`.
- When `overflow-x: hidden` is placed on `<header>`:
  1. The browser forces `overflow-y: auto`.
  2. Because the header has a fixed or constrained height (`h-20` / 80px or `h-16` / 64px), any absolute dropdown menu (such as Profile Menu `w-56 mt-2` or `NotificationBell` popup `w-96 top-full mt-2`) extends beyond the header's boundary.
  3. The browser spawns an ugly **internal vertical scrollbar** on the right side of the navbar.
  4. The dropdown is **clipped inside the 80px header box**, rendering it completely invisible to the user. To the user, clicking the profile button or bell appears to do nothing!

### Correct Header & Dropdown Implementation Pattern

```tsx
// src/components/layout/Navbar.tsx
<header
  className={`sticky top-0 z-40 w-full max-w-full overflow-visible transition-all duration-200 ${
    scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-brand-warm-border" : "bg-transparent"
  }`}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-20">
      {/* Brand Mark with eager preload */}
      <BrandLogo href="/" size="md" priority />

      {/* Navigation */}
      ...

      {/* Action Zone: Dropdowns with z-50 float freely */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </div>
  </div>
</header>
```

### Where to Handle Horizontal Overflow: Use `overflow-x: clip` (Never `overflow-x: hidden`)
- **CRITICAL**: `overflow-x: hidden` on `<html>` or `<body>` creates an internal scroll container boundary that **completely breaks and disables `position: sticky`** for all child elements, causing sticky navbars to unstick and scroll away!
- **Always use `overflow-x: clip` (or `overflow-x-clip`)** on `<html>` and `<body>` (in `globals.css` and `layout.tsx`). Unlike `hidden`, `clip` prevents elements from overflowing horizontally outside the viewport **without** establishing a new scroll container and **without** breaking `position: sticky`!
- **Page Container Wrappers**: Any parent `div` that encloses `<Navbar />` (e.g. in `src/app/page.tsx`, `legal/layout.tsx`, `templates/page.tsx`) must ALSO use `overflow-x-clip` (or `overflow-visible`), NEVER `overflow-x-hidden`. Any `overflow-x: hidden` on an ancestor element breaks viewport sticky positioning.
- Sticky navigation headers must always be `sticky top-0 z-40 w-full max-w-full overflow-visible`.

---

## 3. Fixed Platform Asset Instant-Loading Formula

### The Problem with Default Next.js Image Optimization for Static Assets
- In Next.js, `<Image src="/brand/logo.png" />` without `unoptimized={true}` rewrites URLs to `/_next/image?url=%2Fbrand%2Flogo.png&w=...&q=...`.
- On serverless platforms (Vercel), `/_next/image` invokes an on-demand serverless function. On cold starts or network congestion, this introduces a **2–5 second delay**, causing logos, badges, and preset avatars to flash blank or pop in late.
- Local static assets in `public/` are **already pre-optimized WebP, SVG, and PNG** files (< 50KB). Routing them through a serverless transformation pipeline introduces unnecessary latency and cost.

### The 4-Tier Instant Loading Formula

1. **`unoptimized={true}` on all Static Platform Images**:
   Always pass `unoptimized={true}` (or simply `unoptimized`) to `<Image>` when rendering fixed platform assets:
   - `/brand/logo.png` (Brand logo)
   - `/images/badges/*.webp` (Gamification badges)
   - `/avatars/presets/*.svg` (Platform preset characters)
   - `/landing/**/*.png` (Landing page illustrations, product mockups)

   ```tsx
   <Image
     src="/brand/logo.png"
     alt="Suprilo"
     width={36}
     height={36}
     priority
     unoptimized={true}
     className="w-full h-full object-contain"
   />
   ```

2. **HTML `<head>` Preloading for Critical Brand Assets**:
   In `src/app/layout.tsx`:
   ```tsx
   <head>
     <link rel="preload" href="/brand/logo.png" as="image" type="image/png" fetchPriority="high" />
   </head>
   ```

3. **1-Year Immutable CDN Cache Headers (`next.config.ts`)**:
   Ensure all static directories have `Cache-Control: public, max-age=31536000, immutable`:
   ```ts
   async headers() {
     return [
       {
         source: "/brand/:path*",
         headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
       },
       {
         source: "/images/:path*",
         headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
       },
       {
         source: "/avatars/:path*",
         headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
       },
       {
         source: "/landing/:path*",
         headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
       },
     ];
   }
   ```

4. **Service Worker Cache-First Layer (`public/sw.js`)**:
   The service worker pre-caches core assets on `install` and intercepts GET requests for `/brand/`, `/images/badges/`, `/avatars/presets/`, and `/landing/` to serve them from Cache Storage in **0ms**.

---

## 4. Gamification & Numeric Precision Standards

### The Floating-Point Division Bug
In JavaScript IEEE-754 arithmetic, calculating progress percentages like:
`(375 / 750) * 100` or `(xpInLevel / delta) * 100`
can yield `50.000000000000004%` or `33.333333333333336%`. Displaying raw floats degrades platform quality and breaks UI layout spacing.

### Mandatory Rules for Gamification Numbers
1. **Always Round Progress Percentages to Nearest Integer**:
   - In `src/types/badges.ts` (`getLevelProgress`):
     ```ts
     const rawPercent = (xpInCurrentLevel / currentLevel.deltaToNext) * 100;
     const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
     ```
   - In UI JSX templates (`CreatorMetaOverviewCard.tsx`, `LevelProgressBar.tsx`):
     ```tsx
     <span>{Math.round(levelInfo.progressPercent)}% progress toward {nextTitle}</span>
     ```

2. **XP and Currency Formatting**:
   - Always format large numbers with thousands separators using `.toLocaleString()`:
     ```tsx
     <p>{totalXp.toLocaleString()} XP</p>
     ```

3. **Level Display**:
   - Creator Level number: `<span className="font-black text-sm text-brand-dark whitespace-nowrap">Level {level}</span>`

---

## 5. Badge, Pill & Tag Typography & Wrapping Rules

### The Squished Pill Bug
When a pill tag contains a multi-word title (e.g. `Celebration Specialist`, `Rising Artisan`) inside a flex parent that lacks explicit wrap and whitespace rules:
- Narrow columns (such as 4-column desktop grids or mobile screens) squeeze the pill.
- The text wraps onto two lines (`Celebration` / `Specialist`), ballooning the height of the pill and overlapping adjacent text.

### Mandatory Pill Pattern
```tsx
<div className="flex items-center flex-wrap gap-1.5 min-w-0">
  <span className="font-black text-sm text-brand-dark whitespace-nowrap">
    Level {level}
  </span>
  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 whitespace-nowrap shrink-0 inline-flex items-center leading-none">
    {title}
  </span>
</div>
```

Key classes:
- `whitespace-nowrap`: Prevents the two words from breaking onto separate lines.
- `shrink-0`: Prevents flex layout from compressing the pill below its natural text width.
- `leading-none`: Prevents unwanted line-height padding artifacts inside the pill.
- `flex-wrap`: Allows the pill to drop neatly to the next row if the card is extremely narrow, rather than overflowing.

### Modal Headers & Brand Pill Badge Containment
> **Crucial Rule**: Never use `space-y-*` with multiple `inline-flex` children (e.g. `BrandLogo` and a badge pill). In Tailwind, `space-y-*` applies `margin-top` via adjacent sibling selector `~`, but on inline elements without a flex wrapper, the browser keeps them on the same horizontal baseline while shifting one vertically, causing the pill to horizontally collide with and overlap the brand name (`Suprilo`).

**Mandatory Modal Header Pattern**:
```tsx
{/* Brand Logo & Subtle Badge */}
<div className="flex flex-col items-center justify-center gap-2.5 pt-2 text-center">
  <BrandLogo size="md" priority />

  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20 shrink-0 whitespace-nowrap leading-none">
    <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
    <span>Start Creating Surprises</span>
  </span>
</div>
```
Benefits:
- `display: flex` with `flex-col` positions the brand mark on top (centered) and the feature pill tag cleanly **below** it (centered).
- `gap-2.5` enforces an exact 10px vertical distance between the brand name and the pill.
- Completely prevents any possibility of horizontal collision or overlap across all screen sizes.

---

## 6. Mobile Viewport & Horizontal Overflow Prevention

### Target Breakpoints & Viewport Constraints
- **Primary Mobile Target**: iPhone 14/15/16 Viewport: **393px width**.
- **Minimum Mobile Viewport**: 360px (Android small screens).
- **Desktop Grid Breakpoint**: 1024px (`lg`), 1280px (`xl`).

### Guidelines to Prevent Horizontal Overflow
1. **Dynamic User Text**:
   Always apply `break-words [overflow-wrap:anywhere] [word-break:break-word]` to user bios, display names, and card messages to prevent unbroken strings from pushing flex containers wider than 393px.
2. **Flex Columns Holding Text**:
   Always include `min-w-0 flex-1 w-full max-w-full` on flex child containers so they properly honor their parent's width constraints.
3. **No Hardcoded Pixel Widths Exceeding Viewport**:
   Use `w-full max-w-sm sm:max-w-md` or `w-[calc(100vw-2rem)]` for modals and popovers, never fixed `w-[450px]` without responsive fallbacks.
4. **Touch Targets**:
   All interactive buttons, hamburger icons, and tabs must have a minimum touch target size of **44x44px** (using padding like `p-2.5` or `min-h-[44px]`).

---

## 7. Color Palette, Elevation & Shadows

| Element | Background / Color | Border / Stroke | Shadow |
| :--- | :--- | :--- | :--- |
| **Card (Primary)** | `bg-white` | `border-brand-warm-border` (`#F3EDE8`) | `shadow-card` (`0 4px 20px -2px rgba(23,21,42,0.06)`) |
| **Pill Sub-container** | `bg-brand-warm-subtle` (`#FAF7F5`) | `border-brand-warm-border` | `shadow-xs` |
| **Primary Action Button**| `bg-gradient-to-r from-brand-pink to-brand-pink-hover` (`#FF4D6D`) | None | `shadow-md hover:shadow-brand-pink/25` |
| **Dropdown / Popover** | `bg-white` | `border-brand-warm-border` | `shadow-xl` or `shadow-2xl`, `z-50` |
| **Level Tier Pill** | `bg-amber-100 text-amber-900` | `border-amber-300` | None, `leading-none` |
| **Verified Badge** | `bg-emerald-50 text-emerald-700` | `border-emerald-200` | None |

---

## 9. Creation Studio Hub Architecture

The `/create` route follows the same desktop-sidebar + mobile slide-over pattern established in the Suprilo Control Center (`/profile`):

### 9.1 Layout Structure
- **Persistent Left Sidebar (`StudioSidebar.tsx`)**:
  - Pinned top action: **"Start from Scratch (Blank Canvas)"** with gradient accent for instant unconstrained creation.
  - Category List: Pinned **"General (Curated Mix)"** (`✨`) selected by default on initial arrival, followed by the 10 occasion categories (`🎂 Birthdays`, `💖 Love`, `👯 Friendship`, `😂 Funny/Roasts`, `🏆 Celebrations`, `💼 Workplace`, `🎁 Secret Reveals`, `🌸 Heartfelt`, `🎄 Holidays`, `🧩 Games`).
  - Active category highlight: `bg-brand-pink-light text-brand-pink shadow-xs font-bold border border-brand-pink/20`.
- **Slide-over Mobile Drawer (`StudioMobileNav.tsx`)**:
  - Accessible on `< 1024px` through sticky top header hamburger icon.
  - Automatically locks body scroll on mount and dismisses on category selection.
- **Main Showcase Grid (`TemplateStudioCard.tsx`)**:
  - Dual-state tactile card preview with metallic foil badge (`24K Gold Foil`, `Lavender Pink`, `Cosmic Purple`, `Mint Emerald`), recipient/message preview, and primary `Use This Template →` action.
  - "Shuffle Mix" button in General view using seeded PRNG re-roll.
  - Live client-side search input across template title, description, message, recipient, and tags.

---

## 10. Checklist for Every UI Pull Request / Turn

Before closing any UI work or committing changes, verify:
- [ ] **Navbar & Header Dropdowns**: Profile dropdown and Notification Bell open and display without clipping; no scrollbar appears on the header bar.
- [ ] **Static Image Optimization**: All local fixed assets (`/brand/`, `/images/badges/`, `/avatars/presets/`, `/landing/`) have `unoptimized={true}` and load in under 50ms without serverless spin-up.
- [ ] **Brand Logo Visibility**: Suprilo logo mark appears immediately beside "Suprilo" on all viewports without layout shifts.
- [ ] **Percentage Precision**: Any displayed progress percentage is rounded to an integer (`Math.round(...)`), with no floating-point decimals.
- [ ] **Pill & Badge Formatting**: Badges have `whitespace-nowrap shrink-0` and do not break into multiple lines or squish text.
- [ ] **iPhone Viewport Verification**: Inspect at 393px width; ensure zero horizontal overflow and no clipped elements.
- [ ] **Creation Studio Alignment**: Ensure all template routes (`/templates`) route through the unified `/create` Studio Hub.
- [ ] **Platform Documentation**: Any new UI convention or layout pattern has been reflected in `docs/SUPRILO_UI_DESIGN_SYSTEM.md`.

---
*Created and maintained under Suprilo Core Engineering Standards. Version 1.1.0 (November 2026).*

