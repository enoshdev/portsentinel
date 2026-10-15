---
version: alpha
name: Vercel Analysis
description: An analysis of Vercel's design language — the Geist system, a stark black-on-near-white developer-platform aesthetic where a single ink tone carries every heading, CTA, and border, and the only color the page allows itself is a multi-stop mesh gradient (cyan / blue / violet / magenta / amber) confined to the hero. Geist Sans drives tightly-tracked display type, Geist Mono labels the technical eyebrows, and pill-shaped black buttons mark the marketing CTAs while 6px square buttons handle app and nav chrome.
colors:
  primary: "#171717"
  on-primary: "#ffffff"
  ink: "#171717"
  body: "#4d4d4d"
  mute: "#8f8f8f"
  faint: "#a1a1a1"
  hairline: "#ebebeb"
  hairline-soft: "#f2f2f2"
  canvas: "#fafafa"
  canvas-elevated: "#ffffff"
  link: "#0070f3"
  link-deep: "#0761d1"
  link-soft: "#d3e5ff"
  error: "#ee0000"
  error-deep: "#c50000"
  warning: "#f5a623"
  warning-soft: "#ffefcf"
  warning-deep: "#ab570a"
  violet: "#7928ca"
  violet-soft: "#d8ccf1"
  cyan: "#50e3c2"
  cyan-soft: "#aaffec"
  pink: "#ff0080"
  magenta: "#eb367f"
  gradient-develop-start: "#007cf0"
  gradient-develop-end: "#00dfd8"
  gradient-preview-start: "#7928ca"
  gradient-preview-end: "#ff0080"
  gradient-ship-start: "#ff4d4d"
  gradient-ship-end: "#f9cb28"
typography:
  display-xl:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 48px
    letterSpacing: -2.4px
  heading-lg:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -1.28px
  heading-md:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.4px
  label-sm:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: -0.28px
  mono-eyebrow:
    fontFamily: Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0
  body-lg:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0
  body-md:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
  body-sm:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0
  button-lg:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0
  button-md:
    fontFamily: Geist, Arial, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0
  code:
    fontFamily: Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0
rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 16px
  pill-category: 64px
  pill: 100px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 64px
  4xl: 96px
  section: 128px
components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    borderColor: "{colors.hairline}"
    padding: "{spacing.sm} {spacing.lg}"
  nav-link:
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.pill}"
    padding: "0px 14px"
  button-secondary:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.pill}"
    padding: "0px 14px"
  button-primary-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "0px 6px"
  button-ghost-sm:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "0px 6px"
  button-category-pill:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill-category}"
    padding: "0px 16px"
  button-icon-circular:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.full}"
    padding: "0px"
  text-input:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs} {spacing.sm}"
  feature-card:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  feature-card-elevated:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  pricing-card:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  code-block:
    backgroundColor: "{colors.canvas-elevated}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  logo-strip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-md}"
    padding: "{spacing.xl} {spacing.lg}"
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: "{spacing.section} {spacing.lg}"
  cta-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: "{spacing.4xl} {spacing.lg}"
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    borderColor: "{colors.hairline}"
    padding: "{spacing.3xl} {spacing.lg}"
---

# Overview
Vercel's Geist system is an exercise in subtraction. The page is a near-white sheet (`{colors.canvas}` — #fafafa) carrying near-black ink (`{colors.ink}` — #171717), and almost nothing else competes. Headings, body copy, primary buttons, and the thin 1px borders that define every card all draw from the same ink-and-grey ladder. The one place color is allowed to exist is the hero, where a soft multi-stop mesh gradient — cyan, blue, violet, magenta, amber — blooms behind or beside the headline as the brand's entire decorative system. Everywhere else, restraint.

Typography does the heavy lifting. Geist Sans sets the display headline in tightly-tracked weight-600 (the hero h1 runs -2.4px letter-spacing), and Geist Mono appears as small uppercase eyebrows labeling sections like a technical spec sheet. Buttons split into two shapes by context: the marketing CTAs are fully rounded black pills (`{rounded.pill}` — 100px, "Start Deploying" / "Get a Demo"), while nav and in-app controls use a tight 6px square (`{rounded.sm}`, "Sign Up" / "Log In"). The contrast between the rounded marketing pill and the square app button is itself a deliberate signal of which surface you're on.

Surfaces barely lift. Cards are white (`{colors.canvas-elevated}`) on the #fafafa canvas, separated by a 1px hairline (`{colors.hairline}` — #ebebeb) and, at most, a whisper-soft layered shadow. Feature sections are built from precise grids of these hairline cards, often holding thin node-graph or code-editor illustrations rendered in the same ink-on-white palette. The page reads like documentation that happens to be selling something — engineered, exact, and confident enough to let a single gradient be the only flourish.

## Key Characteristics
- A single near-black ink (`{colors.ink}`) carries headings, body, primary CTAs, and borders on a near-white canvas (`{colors.canvas}`) — near-zero chromatic chrome.
- The multi-stop mesh gradient (cyan → blue → violet → magenta → amber) is the entire decorative system, confined to the hero.
- Two button shapes by context: rounded black pills (`{rounded.pill}`) for marketing CTAs, tight 6px squares (`{rounded.sm}`) for nav/app controls.
- Geist Sans for tightly-tracked display type (`{typography.display-xl}` at -2.4px), Geist Mono for uppercase technical eyebrows (`{typography.mono-eyebrow}`).
- Hairline-bordered white cards (`{colors.hairline}` on `{colors.canvas-elevated}`) in precise grids; depth via 1px border + whisper shadow, never heavy elevation.
- The classic Vercel gradient trio (develop/preview/ship) survives as a named accent system: `{colors.gradient-develop-start}`→end, preview, ship.
- Color-block page rhythm: white hero with mesh gradient → logo strip → hairline feature-card grid → code-editor band → template cards → black-text CTA band → grey footer.

## Colors
> Source pages analyzed: the home page, the AI Gateway page, the customers page, and the pricing page. The ink/canvas/hairline trio recurs on every page; the accent blue (`{colors.link}`) surfaces on pricing, and the mesh-gradient stops live in the hero.

### Brand & Accent
- Ink (`{colors.primary}` / `{colors.ink}` — #171717): the brand's defining near-black. Headings, primary CTA fill, logo, and the darkest text tier. Paired with `{colors.on-primary}` (white).
- Vercel Blue (`{colors.link}` — #0070f3): the link and accent blue — inline links, pricing highlights, focus signals. Darker press tone `{colors.link-deep}` (#0761d1), pale wash `{colors.link-soft}` (#d3e5ff).
- Violet (`{colors.violet}` — #7928ca), Cyan (`{colors.cyan}` — #50e3c2), Pink (`{colors.pink}` — #ff0080), Magenta (`{colors.magenta}` — #eb367f): the chromatic accent family, used sparingly for illustration accents and as mesh-gradient stops, never as chrome fills.

### Surface
- Canvas (`{colors.canvas}` — #fafafa): the default page background — the near-white sheet everything sits on.
- Elevated (`{colors.canvas-elevated}` — #ffffff): pure white for cards, buttons, inputs, and code blocks lifted off the canvas.
- Hairline-Soft Surface (`{colors.hairline-soft}` — #f2f2f2): the faintest grey fill for subtle alternating panels and inset wells.

### Text
- Ink (`{colors.ink}` — #171717): primary headings and high-emphasis text.
- Body (`{colors.body}` — #4d4d4d): standard paragraph and secondary copy, nav links.
- Mute (`{colors.mute}` — #8f8f8f): lower-emphasis captions, logo-strip labels, metadata.
- Faint (`{colors.faint}` — #a1a1a1): the lowest tier — placeholders, disabled labels.

### Borders
- Hairline (`{colors.hairline}` — #ebebeb): the 1px border on every card, input, and divider — the structural workhorse of the system.

### Semantic
- Error (`{colors.error}` — #ee0000): validation / destructive, with a deep press tier `{colors.error-deep}` (#c50000).
- Warning (`{colors.warning}` — #f5a623): caution states, with soft `{colors.warning-soft}` and deep `{colors.warning-deep}` tiers.
- Success maps to `{colors.link}` (#0070f3) — the blue doubles as the positive/active signal.

### Brand Gradient
Three named two-stop gradients form the legacy Vercel gradient identity, surviving as illustration and accent washes:
- Develop: `{colors.gradient-develop-start}` (#007cf0) → `{colors.gradient-develop-end}` (#00dfd8) — blue to cyan.
- Preview: `{colors.gradient-preview-start}` (#7928ca) → `{colors.gradient-preview-end}` (#ff0080) — violet to pink.
- Ship: `{colors.gradient-ship-start}` (#ff4d4d) → `{colors.gradient-ship-end}` (#f9cb28) — red to amber.
These, blended together, form the hero's multi-stop mesh.

---

# PortSentinel Extensions (Strict adherence to existing tokens)

## 1. Status Chip Specifications
The status chips live strictly inside the Vercel Geist palette:
- **Normal**: Background `{colors.hairline-soft}` (#f2f2f2), text `{colors.body}` (#4d4d4d), border `{colors.hairline}` (#ebebeb), with a small 6px dot in `{colors.mute}` (#8f8f8f).
- **Suspicious**: Background `{colors.warning-soft}` (#ffefcf), text `{colors.warning-deep}` (#ab570a), border `#fae0b0`, with a 6px dot in `{colors.warning}` (#f5a623).
- **Confirmed Scan**: Background `rgba(238, 0, 0, 0.08)` (light red wash), text `{colors.error-deep}` (#c50000), border `rgba(238, 0, 0, 0.2)`, with a 6px dot in `{colors.error}` (#ee0000).
- **Blocked**: Solid ink chip `{colors.ink}` (#171717) background, white `{colors.on-primary}` (#ffffff) text, lock icon, border `{colors.ink}` (#171717). Reads unequivocally as a locked gate.
- Dimensions: Height 24px, radius `{rounded.sm}` (6px), typography Geist Mono 12px weight 500 (`{typography.mono-eyebrow}`). Never color alone; always icon/dot + label.

## 2. Table Rules
- Background: pure white `{colors.canvas-elevated}` (#ffffff) framed by 1px hairline `{colors.hairline}` (#ebebeb).
- Header row: Canvas fill `{colors.canvas}` (#fafafa), text `{colors.mute}` (#8f8f8f), font Geist Mono 12px weight 500, border bottom `{colors.hairline}` (#ebebeb).
- Data cells: Typography `{typography.code}` (Geist Mono 13px/14px weight 400), text `{colors.ink}` (#171717) and `{colors.body}` (#4d4d4d).
- Row hover: Subtle fill `{colors.hairline-soft}` (#f2f2f2) without displacement.

## 3. Chart Rules (60-Min Sliding Timeline)
- Surface: White hairline card (`{colors.canvas-elevated}`, 1px `{colors.hairline}`, `{rounded.md}` 12px).
- Main line: Clean 2px stroke in ink `{colors.ink}` (#171717) with no gradients or drop shadows.
- Dashed thresholds: 1px dashed hairline stroke at 30, 60, and 80.
- Markers: Solid ink dots with a 1.5px white ring at Suspicious, Confirmed, and Blocked event points.
- Comparison line: 1.5px dashed stroke in `{colors.faint}` (#a1a1a1) along 0 alerts.

## 4. Sidebar Specification
- Width: Fixed 220px, background `{colors.canvas}` (#fafafa), right border 1px hairline `{colors.hairline}` (#ebebeb).
- Nav items: 6px square buttons (`{rounded.sm}`), text `{colors.body}` (#4d4d4d), hover/active fill `{colors.hairline-soft}` (#f2f2f2) and text `{colors.ink}` (#171717).

## 5. Modal Specification
- Background: `{colors.canvas-elevated}` (#ffffff), border 1px `{colors.hairline}` (#ebebeb), radius `{rounded.md}` (12px).
- Elevation: Level-2 floating layered shadow: `0px 2px 2px rgba(0, 0, 0, 0.04), 0px 8px 16px -4px rgba(0, 0, 0, 0.08)`.
- Backdrop: Subtle overlay `rgba(0, 0, 0, 0.35)`.

## 6. Logo Rules
- Geometric radar ring on a 24x24 base with one calibrated gap, and a single solid dot at the end of the gap representing an isolated covert scan probe.
- Pure black ink stroke (`#171717`), stroke-based, no gradients, no glows.
- Wordmark: "PortSentinel" in Geist 600 with tight negative tracking (`-0.4px`).
