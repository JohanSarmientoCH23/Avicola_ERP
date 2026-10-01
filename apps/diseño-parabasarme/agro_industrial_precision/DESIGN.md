---
name: Agro-Industrial Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#414944'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#717974'
  outline-variant: '#c0c8c3'
  surface-tint: '#396755'
  primary: '#002b1e'
  on-primary: '#ffffff'
  primary-container: '#114232'
  on-primary-container: '#7eae99'
  inverse-primary: '#a0d1bb'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#372000'
  on-tertiary: '#ffffff'
  tertiary-container: '#543300'
  on-tertiary-container: '#e49200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbedd6'
  primary-fixed-dim: '#a0d1bb'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#204f3e'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  label-data-md:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-ui:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.25rem
  margin-mobile: 1rem
  margin-desktop: 1.5rem
---

## Brand & Style

This design system serves high-throughput agro-industrial operations, specifically enterprise egg production and layer poultry facilities. The platform bridges biological monitoring, logistics, veterinary compliance, and financial accounting. 

The aesthetic is Modern Industrial Precision: utilitarian, authoritative, and frictionless. It avoids generic corporate lightness or rural cliches in favor of an exacting, high-density control environment built for farm managers, agronomists, and supply chain analysts working across sunlight, harsh industrial office monitors, and field tablets. The interface evokes rigorous scientific control, biosecurity compliance, and relentless operational uptime.

## Colors

The palette grounds high-velocity biological and financial metrics with deep botanical structure and high-visibility status indicators.

- **Primary (`#114232`, hover `#0F382A`):** Deep Forest Green. Anchors navigation rails, master actions, primary buttons, and key structural headers. Signals authority and agricultural grounding.
- **Secondary / Success (`#10B981`, surface `#ECFDF5`, border `#A7F3D0`):** Crisp Emerald. Used for positive yield trends, target lay rates, biosecurity approvals, and active sensor status.
- **Tertiary / Warning (`#F59E0B`, surface `#FFFBEB`, border `#FDE68A`):** Warm Amber. Denotes feed conversion drift, temperature thresholds, shedding flags, and approaching vaccine deadlines.
- **Critical Alert (`#EF4444`, surface `#FEF2F2`, border `#FECACA`):** Crimson. Reserved strictly for mortality spikes, quarantine alerts, cold chain failures, and system exceptions.
- **Neutrals & Surfaces:**
  - Base Canvas: `#F8FAFC` (Slate 50)
  - Surface Elevation 1: `#FFFFFF`
  - Surface Muted / Table Rows Alternate: `#F1F5F9` (Slate 100)
  - Structural Borders: `#E2E8F0` (Slate 200)
  - Border Emphasis: `#CBD5E1` (Slate 300)
  - Text Muted: `#64748B` (Slate 500)
  - Text Secondary: `#334155` (Slate 700)
  - Text Primary: `#0F172A` (Slate 900)

## Typography

Typography prioritizes scannability across dense data grids and metric dashboards. 

Inter provides clean, balanced proportions for structural UI elements, forms, and general content. Enable OpenType tabular figures (`tnum`) across all tabular views in Inter to prevent jitter when values refresh in real-time.

JetBrains Mono is used as a specialized data typography engine for batch numbers, lot IDs, sensor readings, hen-day percentages, feed conversion ratios (FCR), and financial ledgers. All mono labels render with strict monospace balance to facilitate instant vertical column scanning.

## Layout & Spacing

The layout is built on an ultra-compact 4px baseline rhythm optimized for high information density without visual crowding.

- **Desktop (>= 1280px):** Fluid 12-column workspace with a fixed 260px collapsible primary navigation rail. Gutters are fixed at 20px (`1.25rem`) with outer padding at 24px (`1.5rem`). Content zones scale up to 1920px max before locking center-aligned.
- **Tablet (768px - 1279px):** 8-column layout. Primary rail collapses into an icon-only bar (64px). Margin drops to 16px (`1rem`), gutters remain 16px. Table views employ pinned sticky primary columns with horizontal overflow scrolling.
- **Mobile (< 768px):** 4-column layout. Navigation transitions to a bottom sheet bar or full-screen drawer. Gutters drop to 12px (`0.75rem`). Metric tiles convert to 2x2 grids or vertically stacked swipeable card decks.

## Elevation & Depth

This system avoids heavy drop shadows to prevent visual noise in analytical views. Depth is communicated primarily through structural borders, tonal shifts, and low-opacity ambient occlusion:

- **Flat / Base Layer:** Canvas background (`#F8FAFC`). No elevation, no border.
- **Level 1 (Cards, Panel Containers, Table Blocks):** Background `#FFFFFF`, bordered by 1px solid `#E2E8F0`. Shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hovered Rows, Interactive Metric Tiles, Flyouts):** Background `#FFFFFF`, border `#CBD5E1`. Shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Slide-over Shed Drawers, Popovers):** Background `#FFFFFF`, border `#CBD5E1`. Shadow: `0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.04)`.
- **Active Selection / Focus:** Never rely on elevation alone; always pair with a 2px offset ring in `#114232` or a 1px border shift to `#10B981`.

## Shapes

The design uses tight, controlled corners (`0.25rem` / `4px` baseline) conveying operational precision and maximizing visible pixel area for dense data tables and chart canvases.

- **Inputs, Buttons, Micro Badges:** 4px (`rounded-sm`).
- **Cards, Panels, Grid Containers:** 6px to 8px (`rounded-md`).
- **Status Pills & Metric Indicators:** Full pill (`9999px`) exclusively for state badges and live status dots to contrast immediately against structural rectangular panels.

## Components

### Buttons
- **Primary:** Background `#114232`, text `#FFFFFF`, font Inter 14px Medium. Hover `#0F382A`. Active `#0B2A20`. Focus outline 2px `#10B981` offset 2px. Height 36px (compact) / 40px (default).
- **Secondary / Outline:** Background `#FFFFFF`, border 1px solid `#E2E8F0`, text `#334155`. Hover background `#F8FAFC`, border `#CBD5E1`.
- **Ghost:** Background transparent, text `#334155`. Hover background `#F1F5F9`.
- **Destructive:** Background `#EF4444`, text `#FFFFFF`. Hover `#DC2626`.

### Inputs & Form Elements
- **Text Inputs:** Height 36px. Border 1px solid `#E2E8F0`, background `#FFFFFF`, text `#0F172A`, placeholder `#94A3B8`. Active focus border `#114232` with `box-shadow: 0 0 0 1px #114232`.
- **Checkboxes & Radios:** 16x16px boxes. Unchecked: border 1.5px `#CBD5E1`, background `#FFFFFF`. Checked: background `#114232`, checkmark `#FFFFFF`. Focus ring 2px `#10B981` offset 2px.

### Specialized Agricultural KPI Badges
- **Structure:** Pill shape (`rounded-full`), height 20px, horizontal padding 8px, font JetBrains Mono 11px Medium.
- **Variants:**
  - *Optimal Yield / Active Lot:* Background `#ECFDF5`, text `#065F46`, border 1px solid `#A7F3D0`. Includes a 6px pulsating dot in `#10B981`.
  - *Threshold Warning (Feed/Temperature):* Background `#FFFBEB`, text `#92400E`, border 1px solid `#FDE68A`.
  - *Critical Biological Hazard (Mortality Spike):* Background `#FEF2F2`, text `#991B1B`, border 1px solid `#FECACA`.
  - *Neutral / Scheduled:* Background `#F1F5F9`, text `#475569`, border 1px solid `#E2E8F0`.

### Tables & Data Grids
- **Header:** Height 36px, background `#F8FAFC`, text `#64748B`, font Inter 11px SemiBold, uppercase, tracking 0.05em, bottom border 1px solid `#E2E8F0`.
- **Row:** Height 40px (compact) or 48px (standard), background `#FFFFFF`, alternating `#F8FAFC`, border-bottom 1px solid `#F1F5F9`. Hover background `#F1F5F9`.
- **Numeric Cells:** Monospace JetBrains Mono right-aligned with inline delta indicator badges (e.g., `+1.4%` in secondary green or `-0.8%` in crimson).

### Cards & Metric Panels
- Border 1px solid `#E2E8F0`, background `#FFFFFF`, padding 16px. Top accent border line (2px) mapped to status: Primary Green for healthy flock performance, Amber for warning tiers, Crimson for biosecurity alarms. Contains micro-sparklines along card base without padding offsets.