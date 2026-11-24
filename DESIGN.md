---
name: DevPlayground Core
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1b1c'
  on-surface-variant: '#424753'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#727785'
  outline-variant: '#c2c6d5'
  surface-tint: '#005ac1'
  primary: '#0058bd'
  on-primary: '#ffffff'
  primary-container: '#2771df'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006e2c'
  on-secondary: '#ffffff'
  secondary-container: '#86f898'
  on-secondary-container: '#00722f'
  tertiary: '#b51b15'
  on-tertiary: '#ffffff'
  tertiary-container: '#d9372b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#89fa9b'
  secondary-fixed-dim: '#6ddd81'
  on-secondary-fixed: '#002108'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930004'
  background: '#fcf9f8'
  on-background: '#1b1b1c'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0em
  subhead-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '300'
    lineHeight: 24px
    letterSpacing: 0.02em
  subhead-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '300'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.08em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system reflects the collaborative, technical, and creative atmosphere of Google Developer Groups. It bridges industrial console utility with modular, playground-inspired structures. The brand identity is open, structured, and developer-first—delivering the clarity expected of developer tooling while maintaining the playfulness of community building.

The design movement combines **Brutalism** with **Modern Clean Console** ergonomics:
- **Geometry:** Completely sharp (0px corner radius), flat modular containers, and structured grid lines that evoke code blocks, terminal consoles, and design tokens.
- **Palette Logic:** Direct functional color coding using the Google developer spectrum (Blue, Green, Yellow, Red) paired with pastel wash surfaces and halftone transition highlights.
- **Atmosphere:** Clean, daylight-oriented `#f0f0f0` off-white base with deep `#1e1e1e` ink contrasts. Visual structure is driven by crisp borders and color-coded containment blocks rather than diffused shadows or soft blurs.

## Colors

The palette directly implements the Google Developer Group tonal hierarchy across three distinct tonal tiers: **500 Core**, **Halftone**, and **Pastel**, grounded by a dual neutral baseline.

### Palette Breakdown
- **Google Blue Spectrum:**
  - Primary Core: `#4285f4` (Interactive states, dominant headers, primary actions)
  - Halftone: `#57caff` (Hover states, badges, highlight lines)
  - Pastel: `#c3ecf6` (Surface tint for informational cards, code callouts, selection backgrounds)
- **Google Green Spectrum:**
  - Secondary Core: `#34a853` (Success badges, active status indicators, validated state panels)
  - Halftone: `#5cdb6d` (Secondary accentuation, live markers)
  - Pastel: `#ccf6c5` (Success alert banners, positive change callouts)
- **Google Yellow Spectrum:**
  - Accent / Warning: `#fbbc04` (Attention markers, workshop tracks, pending status)
  - Halftone: `#ffd427` (Warning hover, high-visibility badges)
  - Pastel: `#ffe7a5` (Notice containers, track indicator blocks)
- **Google Red Spectrum:**
  - Tertiary Core: `#ea4335` (Destructive actions, error states, critical tags)
  - Halftone: `#ff7daf` (Hot actions, energetic tag highlights)
  - Pastel: `#f8d8d8` (Error callout blocks, critical alerts)
- **Neutrals:**
  - Canvas Base (Off-White): `#f0f0f0` (Default background)
  - Surface Pure: `#ffffff` (Elevated card surfaces, nested code inputs)
  - Console Ink (Black 02): `#1e1e1e` (Primary typography, structural 1px/2px borders)
  - Structural Muted: `#757575` (Secondary metadata, mono labels)

## Typography

Typography establishes an intentional contrast between bold, humanistic geometry and monospaced technical precision:

- **Headlines (`Plus Jakarta Sans Bold`):** Sturdy, modern, geometric sans delivering confident, friendly authority.
- **Subheads & Metadata (`JetBrains Mono Light`):** Emulates terminal output, command prompts, and code documentation. Used for path breadcrumbs, parameter tags, section indices, and metadata.
- **Body Text (`Plus Jakarta Sans Normal`):** Clean, neutral readability optimized for technical explanations, event descriptions, and interface interaction.

All code blocks, parameter values, numeric stats, and category badges must enforce monospaced styling to reinforce the console aesthetic.

## Layout & Spacing

The layout is built upon an uncompromising, rigid 12-column grid system emphasizing modular panel tiling.

### Grid & Density Rules
- **Desktop (1024px+):** 12-column fluid grid, `1.5rem` (24px) gutters, and `3rem` (48px) page margins. Content containers max out at 1440px width.
- **Tablet (768px - 1023px):** 8-column grid with `1rem` (16px) gutters and `1.5rem` (24px) canvas margins.
- **Mobile (< 768px):** 4-column grid with `1rem` (16px) gutters and `1rem` (16px) canvas margins. Multi-column cards collapse to single-column modular blocks.

### Composition Principles
- Panels must appear as interlocking blocks separated by explicit gutters or tight 1px solid borders.
- Density is compact to standard: avoid oversized whitespace that diffuses focus; prioritize clear vertical rhythm aligned to multiples of 4px and 8px.

## Elevation & Depth

This design system avoids soft dropshadows, blurred layers, and rounded extrusions. Depth is conveyed strictly through **tonal planes**, **hard-edge offsets**, and **high-contrast borders**:

- **Borders over Shadows:** All containers, cards, and modal dialogs are defined by solid `1px` or `2px` borders in `#1e1e1e`.
- **Hard-Edge Depth (Brutalist Accent):** When high interactive emphasis is required (e.g., active primary CTA or focused tool window), use a flat `3px 3px 0px 0px #1e1e1e` hard shadow offset.
- **Color-Coded Tonal Layering:**
  - Base layer: `#f0f0f0` (canvas).
  - Resting panel surface: `#ffffff` with a `1px solid #1e1e1e` perimeter.
  - Distinct block types use pastel fills (`#c3ecf6`, `#ccf6c5`, `#ffe7a5`, `#f8d8d8`) to visually group related developer activities (e.g., Cloud, Mobile, AI/ML, Web).

## Shapes

The shape system enforces absolute angularity:
- **Corner Radius:** `0px` universally across cards, buttons, chips, modal sheets, and text inputs.
- **Block Accents:** Sharp corner cutouts or block tabs are permissible for developer tags and track flags.
- **Icons & Badges:** Contained in square bounding boxes with crisp geometric alignments. No circular pills or squishy geometries are permitted.

## Components

### Buttons
- **Primary:** Solid `#4285f4` fill, `#ffffff` text, 0px radius, `1px solid #1e1e1e`. Hover triggers a `#57caff` shift with a `2px 2px 0px #1e1e1e` offset. Active shifts back to `0px` offset.
- **Secondary / Console:** Solid `#ffffff` fill, `#1e1e1e` text, `1px solid #1e1e1e`. Hover shifts background to `#f0f0f0`.
- **Destructive:** Solid `#ea4335` fill, `#ffffff` text, `1px solid #1e1e1e`. Hover shifts to `#ff7daf`.
- **Text Button:** Monospaced `JetBrains Mono`, underlined on hover, `#1e1e1e` color.

### Chips & Badges
- 0px border-radius, `1px solid #1e1e1e`, uppercase `label-caps` typography (`JetBrains Mono`).
- Category tints utilize pastel color backgrounds:
  - Web / Cloud: Background `#c3ecf6`, text `#1e1e1e`.
  - Android / Flutter: Background `#ccf6c5`, text `#1e1e1e`.
  - AI / ML / Spark: Background `#ffe7a5`, text `#1e1e1e`.
  - Security / Systems: Background `#f8d8d8`, text `#1e1e1e`.

### Input Fields & Controls
- **Text Inputs:** Background `#ffffff`, border `1px solid #1e1e1e`, 0px radius, padding `space-sm` `space-md`. Focus transitions to a `2px solid #4285f4` outline with no shadow.
- **Checkboxes & Radios:** Sharp square indicators. Checked state fills with `#4285f4` featuring a crisp white geometric cross or square dot inside. No rounded radio circles.

### Cards & Modular Blocks
- **Standard Card:** Background `#ffffff`, border `1px solid #1e1e1e`, padding `space-lg`.
- **Playground Feature Block:** Header band filled with one of the primary or halftone shades (`#4285f4`, `#34a853`, `#fbbc04`, `#ea4335`) containing inverted mono tags, with body content hosted on an Off-White or pastel wash surface below.

### Code / Terminal Panels
- Background `#1e1e1e`, text `#f0f0f0`, border `1px solid #1e1e1e`.
- Terminal header bar has a subtle `#333333` bottom border with monospaced path indicators (`~/gdg-console/`) in `#57caff`.