# Design Guidelines: Conversation Health Monitoring Dashboard

## Design Approach
**Reference-Based: Linear.app Inspiration**

This dashboard draws inspiration from Linear.app's refined, engineering-focused aesthetic. The design prioritizes clarity, efficiency, and visual hierarchy while maintaining an elegant, minimal aesthetic that engineers appreciate.

## Core Design Principles
1. **Information Density with Breathing Room**: Present rich data without overwhelming users through strategic white space
2. **Instant Scanability**: Color-coded health indicators and clear visual hierarchy enable rapid assessment
3. **Progressive Disclosure**: Every metric is clickable for drill-down exploration
4. **Dark-First Interface**: Optimized for extended usage sessions

## Color Palette

**Dark Mode (Primary)**
- Background: 220 15% 8% (deep charcoal)
- Surface: 220 15% 12% (elevated panels)
- Surface Hover: 220 15% 15%
- Border: 220 10% 20% (subtle dividers)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 65%

**Health Status Colors**
- Healthy/Success: 142 76% 45% (vibrant green)
- Warning: 38 92% 50% (amber yellow)
- Failure/Critical: 0 84% 60% (vivid red)
- Neutral/Info: 217 91% 60% (soft blue)

**Accent Colors** (Use sparingly)
- Primary Action: 217 91% 60% (blue - for CTAs and interactive elements)
- Hover State: 217 91% 65%

## Typography

**Font Stack**
- Primary: Inter (via Google Fonts)
- Monospace: JetBrains Mono (for IDs, timestamps, code-like elements)

**Type Scale**
- Hero Numbers: text-5xl font-bold (big number cards)
- Page Headers: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Body Text: text-sm font-normal
- Captions/Meta: text-xs text-gray-400
- Monospace Data: font-mono text-sm

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Tight spacing: gap-2, p-2
- Component internal: p-4, gap-4
- Component margins: mb-6, mt-6
- Section spacing: py-12, py-16
- Page padding: p-6 to p-8

**Grid Systems**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Pattern cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Standard gap: gap-4 to gap-6

**Container Strategy**
- Full-width background panels
- Content constrained to max-w-7xl mx-auto
- Consistent px-6 horizontal padding

## Component Library

**Big Number Cards**
- Large numerical display (text-4xl to text-5xl) in center
- Label below in text-sm text-gray-400
- Small trend indicator (arrow + percentage)
- Subtle border, rounded-lg
- Hover state: slight elevation + border color shift
- Entire card clickable

**Data Tables**
- Zebra striping (subtle, optional on row hover)
- Sticky headers
- Monospace font for IDs and timestamps
- Color-coded health score badges (pill-shaped)
- Row hover: background shift + cursor pointer
- Compact row height (py-3)

**Charts**
- Line charts: Thin strokes (2px), smooth curves
- Sparklines: Minimal, inline with text
- Color matches health status
- Tooltip on hover with precise values
- Grid lines: very subtle (opacity-10)

**Status Badges**
- Pill-shaped (rounded-full)
- Small (text-xs px-2.5 py-1)
- Color-coded background with darker text
- No border (solid fill)

**Modals/Sidebars**
- Slide-in from right for conversation detail
- Dark overlay (bg-black/50)
- Close on overlay click or ESC
- Width: 60% viewport on desktop, full on mobile

**Kanban Cards** (Failures Page)
- Compact card design (p-4)
- Conversation ID in mono font at top
- Health score badge
- Truncated preview text (2 lines)
- Drag handle indicator
- Hover: lift effect (shadow-lg)

**Filters/Controls**
- Inline filter buttons (rounded-md, px-3 py-2)
- Active state: filled background
- Date range picker: calendar dropdown
- Filters stack on mobile, inline on desktop

**Navigation**
- Sidebar navigation (fixed left)
- Icons + labels
- Active page: subtle background fill + accent border-l
- Collapsed state on mobile (hamburger)

**Forms** (Settings Page)
- Full-width inputs with labels above
- Dark input backgrounds (surface color)
- Focus: accent color border
- Helper text below in text-xs text-gray-400
- Action buttons right-aligned

## Interactions & Animations

**Micro-interactions** (Use sparingly)
- Number counting animation on card load (0 → final value, 0.8s)
- Smooth transitions on hover (transition-all duration-200)
- Chart animations on reveal (draw from left, 1s)

**No Animations**
- Page transitions (instant)
- Filter changes (instant updates)
- No loading spinners unless data fetch >500ms

## Page-Specific Layouts

**Overview Page**
- Top row: 4 big number cards (grid-cols-4)
- Second row: Line chart (col-span-2) + Alert feed (col-span-2)
- Third row: Top 5 patterns with sparklines (full-width)

**Conversations List**
- Filters bar at top (sticky)
- Full-width table below
- Pagination at bottom
- Export button (top-right)

**Patterns Page**
- Grid of pattern cards (3 columns on desktop)
- "Emerging Patterns" section at top (highlighted background)
- Sort controls (top-right): By frequency, By trend, Alphabetical

**Failures Page**
- Kanban columns: 4 columns (Loops | Frustration | Nonsense | Abrupt Ends) + Resolved
- Trends chart above board (full-width, compact)
- Column headers with count badges

**Settings Page**
- Left sidebar: section navigation (API Keys, Slack, Alerts, Team)
- Right content area: forms and controls
- Save button fixed at bottom-right

## Images
No hero images required. This is a data-focused dashboard where information density and clarity take precedence over marketing imagery.