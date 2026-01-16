---
description: Design system rules for High-Quality Editorial UI ("Digital Paper")
---

# High-Quality Editorial UI ("Digital Paper") Rules

This design system aims for a content-first, distraction-free, and typographical aesthetic similar to Notion, Claude, or Medium.

## Core Philosophy
- **Digital Paper**: Interface feels like a premium sheet of paper.
- **Chrome Recedes**: Buttons, nav bars, and containers should be minimal.
- **Content First**: Typography is the main design element.
- **Monochromatic Pro**: Single accent color. Functional, not decorative.

## 1. Typography System

### Font Stack
- **Primary (UI/Sans)**: `Inter` (or Geist/SF Pro). Used for UI controls, inputs, metadata.
- **Secondary (Headings/Editorial)**: `Playfair Display` (or Merriweather/Tiempos). Used for Page Titles, Section Headers.
- **Mono**: `JetBrains Mono` or `SF Mono`.

### Scale & Leading
| Element | Font | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|---|
| H1 | Serif | 2rem (32px) | Semibold (600) | 1.2 | -0.02em |
| H2 | Serif | 1.5rem (24px) | Medium (500) | 1.3 | -0.01em |
| Body | Sans | 1rem (16px) | Regular (400) | **1.6** | 0em |
| Caption | Sans | 0.8125rem | Regular | 1.5 | +0.01em |

**Constraint**: Body text max-width ~60-80 chars (600-700px).

## 2. Color Palette (Monochromatic Focus)

### Backgrounds
- **Dark Mode (Default)**: `#0F1115` (Deep Grey) + `#181A1F` (Surface).
- **Light Mode**: `#FFFFFF` (Pure White) + `#F3F3F3` (Surface).
- **Hover**: Subtle darkening.

### Ink (Text)
- **Primary**: `#E0E0E0` (Dark Mode) / `#202020` (Light Mode).
- **Secondary**: `#858585` (VS Code Grey).
- **Borders**: Minimal, `#2B2D31`.

### Accent (Single Color)
- **Primary Action**: 
    - Dark Mode: **Royal Blue** (`#3B82F6`).
    - Light Mode: **Dark Slate Blue** (`#2E3B55`).
- **Usage**: Active states, primary buttons, focus rings.
- **Pipeline Stages**: All use the Single Accent. No rainbow colors.

## 3. Components

### Buttons ("Ghost" Style)
- **Default**: Transparent bg, `#333` text, hover `#F0F0F0` bg.
- **Call to Action**: Solid Single Accent. 
- **Radius**: `4px` (Sharp/Technical).

### Inputs
- **Style**: Minimal. Bordered.
- **Focus**: Accent border.

### Cards
- **Border**: 1px solid subtle.
- **Shadow**: NONE by default. Subtle on hover.
- **Radius**: `4px` - `6px`.

## 4. Spacing & Rhythm
- **Grid**: 4pt baseline.
- **Rhythm**: 24px/32px between sections. 4px/8px between related items.

## 5. Motion
- **Speed**: Very Fast (100-150ms).
- **Easing**: `ease-out`. 
- **Effect**: Snappy, functional.
