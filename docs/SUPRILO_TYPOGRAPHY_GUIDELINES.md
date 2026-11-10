# Suprilo Typography & Word-Spacing Architecture Guidelines

> **Mandatory Rule for All Future Engineering & UI Work**:
> Every text element across Suprilo (headings, body, cards, badges, modals, and buttons) must always preserve clear, legible, and distinct spacing between words.

---

## 1. Root Cause Analysis of Word Spacing Collapses

When combining:
1. **Geometric Heading Fonts** (`Plus Jakarta Sans` with bold weights 700/800)
2. **Negative Letter-Spacing** (`tracking-tight` at `-0.025em` or aggressive `-0.02em` in CSS)

Letters with rightward overhangs (such as lowercase `r`) extend into the space character, causing adjacent capitalized words to appear fused together visually (e.g. `Creator Identity` looked like `CreatorIdentity`, `Creator Meta` looked like `CreatorMeta`).

---

## 2. Permanent Architectural Solution

### A. Global CSS Protection (`src/app/globals.css`)

The following rules are permanently active in `src/app/globals.css`:

```css
body {
  word-spacing: 0.05em; /* Guarantees readable word spacing across all body copy */
}

/* Headings and elements styled with the heading font */
h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: var(--font-heading), system-ui, -apple-system, sans-serif;
  letter-spacing: -0.005em;
  word-spacing: 0.12em; /* Enforces generous, distinct gaps between words in bold headings */
}

/* Overrides to prevent negative tracking from ever collapsing word spacing */
.tracking-tight,
.tracking-tighter {
  word-spacing: 0.12em;
}
```

### B. Heading Class Conventions

- **Prefer `tracking-normal` for Section Titles**: Always use `tracking-normal` (or let the heading inherit base typography) on section titles and card headers instead of `tracking-tight`.
- **Badge Inline Grouping**: When grouping titles with pill badges, wrap the title text in its own `<span>` and keep the badge as an `inline-flex` with `whitespace-nowrap shrink-0`:
  ```tsx
  <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-normal inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
    <span>Creator Identity</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
      Public Info
    </span>
  </h3>
  ```

---

## 3. Long Unbroken Strings & Bio Text Overflow Protection

### A. Root Cause of Horizontal Overflow
When users enter long continuous strings or URLs (e.g. 50-100 unbroken test characters without spaces):
- Standard Tailwind `break-words` (`overflow-wrap: break-word`) does not prevent flexbox `min-content` intrinsic width expansion.
- The flex column expands to the intrinsic width of the longest word (~400px), causing the parent card container to stretch horizontally beyond the mobile viewport (e.g. 360px).
- Because the card container expands, flex items (like `Member since` and `Last active` pills) stay on one line instead of wrapping, and the overflowing edge gets clipped by `overflow-hidden`, cutting off dates (e.g. `Nov 10, 20[26]`).

### B. Mandatory Layout Rules for User Bios & Dynamic Text
1. **Bio Paragraph Classes**: Always use:
   ```tsx
   <p className="text-xs sm:text-sm text-brand-dark/80 font-medium pt-1 max-w-lg leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
     {bio}
   </p>
   ```
   `[overflow-wrap:anywhere]` forces soft wrap opportunities at every character, preventing the intrinsic `min-content` width from ever exceeding the container.

2. **Flex Parent Constraints**: Flex column wrappers holding dynamic text must always include:
   ```tsx
   className="space-y-2 flex-1 min-w-0 w-full max-w-full"
   ```

3. **Metadata Pill Groups**: Always ensure pill wrappers have `w-full max-w-full flex-wrap` and pills have `max-w-full shrink-0`:
   ```tsx
   <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-brand-muted w-full max-w-full">
     <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-warm-subtle border border-brand-warm-border max-w-full shrink-0">
       ...
     </div>
   </div>
   ```


