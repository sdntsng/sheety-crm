# design_system.md: "Digital Paper" Aesthetic

This document outlines the design principles and tokens for the SheetyCRM "Digital Paper" aesthetic. This visual language mimics a physical workspace, treating the screen as a desk and UI elements as paper artifacts.

## 1. Core Philosophy: "Retro-Modern Office"

The aesthetic combines the tactility of physical paper workflows with the precision of modern Swiss typography.

*   **The Metaphor:** The screen is a desk.
*   **The Materials:** Rice paper, cardstock, ink, graphite, tape, and highlighters.
*   **The Vibe:** An organized, analog workspace digitized.

## 2. Typography

We use a distinctive pairing:

*   **Primary (UI/Body):** `Outfit`
    *   **Usage:** Headings, labels, body text.
    *   **Why:** A modern geometric sans-serif that brings personality and a premium feel, avoiding the generic look of Inter/Roboto.
    *   **Styling:** Bold weights, clean geometry.

*   **Secondary (Data/Code):** `JetBrains Mono`
    *   **Usage:** Data values, dates, badges, inputs, status indicators.
    *   **Why:** Evokes typewriters and technical ledgers.
    *   **Styling:** All-caps for labels, distinct borders.

## 3. Color Palette

### Surfaces
*   **`--bg-paper` (#F9F7F1):** The desk surface. Warm, natural white/beige with a grain texture.
*   **`--bg-card` (#FFFFFF):** Fresh sheets of paper or index cards. Pure white to pop against the warm background.
*   **`--bg-hover` (#F0EFE9):** A slightly darkened paper tone for interactive states.

### Ink & Pencil
*   **`--text-primary` (#1A1918):** "Ink Black". Start, high contrast, non-pure black.
*   **`--text-secondary` (#5A5855):** "Graphite". For secondary text, borders, and dashed lines.
*   **`--text-muted` (#8C8984):** "Faded Ink". For placeholders and disabled states.

### Highlighters (Accents)
*   **`--accent-blue` (#2A5D94):** Fountain pen blue (Links, Primary Actions).
*   **`--accent-red` (#C53030):** Grading pen red (Errors, Alerts).
*   **`--accent-yellow` (#FEF08A):** Highlighter yellow (Badges, Emphasis).

## 4. Visual Elements

### Shadows
We avoid soft, diffuse shadows in favor of **hard, directional shadows** to simulate physical depth (paper cutouts).
*   **Card:** `2px 2px 0px rgba(0,0,0,0.08)`
*   **Hover:** `4px 4px 0px rgba(0,0,0,0.12)` (The paper "lifts" closer to the light)

### Borders
*   **Solid:** Defined edges (`1px solid var(--border-pencil)`).
*   **Dashed:** For perforated lines or "tear-off" sections.
*   **Double:** For structural emphasis (Headers, Important Sections).

### Texture
A global SVG noise filter is applied to `--bg-paper` opacity `0.04` to create grain without compromising readability.

## 5. Components

### The Binder Header
Replaces the traditional sidebar. A horizontal strip that feels like the spine of a binder or a ruler on a desk.
*   **Nav Items:** Uppercase, monospace, underlined on hover.
*   **Logo:** Stark, bold sans-serif.

### Index Cards (Opportunities)
Represents discrete units of work.
*   **Layout:** Information arranged in a grid or list.
*   **Interaction:** Subtle rotation (`0.5deg`) on hover to feel organic.
*   **Stamps:** Statuses are styled as ink stamps (rotated, bordered).

### The Ledger (Leads Table)
Represents a record book.
*   **Styling:** Strong horizontal lines, dashed vertical separators.
*   **Font:** Monospace for all cell data.
