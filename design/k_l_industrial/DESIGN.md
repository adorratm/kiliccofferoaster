---
name: Kılıç Industrial
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#dec0b9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a58b84'
  outline-variant: '#57423d'
  surface-tint: '#ffb4a2'
  primary: '#ffb4a2'
  on-primary: '#611200'
  primary-container: '#e46d4f'
  on-primary-container: '#550f00'
  inverse-primary: '#a33d23'
  secondary: '#c6c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#929090'
  on-tertiary-container: '#2a2a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#83260d'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 80px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: 0.02em
  display-lg-mobile:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 52px
  headline-md:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 36px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  meta-technical:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  column-gap: 24px
  section-padding: 120px
---

## Brand & Style

The design system is built upon a philosophy of **Engineered Precision** and **Artisanal Depth**. It targets a sophisticated audience that values the intersection of industrial manufacturing and the craft of specialty coffee. 

The visual style is a fusion of **Modern Brutalism** and **Boutique Luxury**. It avoids the "friendly" tropes of contemporary web design in favor of a raw, authoritative aesthetic. Key characteristics include high-contrast layouts, strict grid-based alignment, and an uncompromising rejection of soft edges. The interface should feel like a high-end industrial control panel—functional, technical, and premium.

Emotional responses should oscillate between "professional reliability" and "exclusive quality," evoking the atmosphere of a high-tech roastery floor at midnight.

## Colors

This design system utilizes a sophisticated dark palette designed for high-impact visual storytelling.

*   **Primary (#cc5b3e):** "Roast Orange." Used for primary calls to action, active states, and highlighting key brand moments. It represents the heat of the roaster and the vibrant acidity of the bean.
*   **Surface (#0a0a0a):** "Deep Carbon." The foundational background color. It provides a void-like depth that allows photography and typography to command attention.
*   **Accents (#e5e5e5):** "Off-white." Used for primary text and high-contrast UI borders. It ensures clinical clarity against the dark background.
*   **Secondary Surface (#1a1a1a):** Used for subtle layering and container separation to maintain depth without breaking the brutalist aesthetic.

## Typography

The typographic hierarchy is designed for impact and data-heavy clarity.

*   **Display & Headlines:** Use **Anton**. Its condensed, heavy forms reflect the weight of industrial machinery. Use uppercase exclusively for headlines to maintain a structured, "stamped" appearance.
*   **Body Text:** Use **Inter**. It provides a neutral, highly legible contrast to the aggressive headlines, ensuring that long-form content remains readable.
*   **Metadata & Technical Info:** Use **JetBrains Mono**. This monospaced font is used for coffee specifications (origin, altitude, roast date), pricing, and navigation labels to evoke a sense of engineered data.

## Layout & Spacing

The design system employs a **strict 12-column fluid grid** for desktop and a **4-column grid** for mobile. 

*   **Rhythm:** Based on an 8px square unit. All spacing—margins, padding, and gaps—must be a multiple of 8.
*   **Negative Space:** Use generous vertical padding between sections (120px+) to allow the brand's premium nature to breathe. 
*   **Borders:** Use 1px solid borders (`#e5e5e5` at 20% opacity or full opacity for emphasis) to define sections instead of shadows. Elements should feel "locked" into the grid.
*   **Alignment:** Hard edges are mandatory. Text and containers must align strictly to the vertical grid lines to maintain the "engineered" feel.

## Elevation & Depth

This system rejects shadows. Depth is achieved through **Tonal Layering** and **Line Work**.

*   **Layers:** Level 0 is the Deep Carbon background. Level 1 (containers/cards) uses the Secondary Surface (#1a1a1a).
*   **Outlines:** Hierarchy is established through border weight and contrast. Primary interactive elements use a 1px solid Off-white border. 
*   **Transparency:** Use subtle semi-transparent overlays for hover states on image-heavy blocks, but avoid the "softness" of glassmorphism. Surfaces should feel solid and opaque.

## Shapes

The shape language is strictly **Sharp**. There are no rounded corners in the design system. All containers, buttons, and input fields must use 0px border-radius. This reinforces the industrial, brutalist aesthetic and mimics the precision of metal-cut components.

## Components

*   **Buttons:** Rectangular, sharp-edged. Primary buttons use a solid Roast Orange background with black text. Secondary buttons use an Off-white 1px border with JetBrains Mono text.
*   **Input Fields:** Bottom-border only or full 1px border with no radius. Labels must be in JetBrains Mono, placed above the field in all-caps.
*   **Cards:** Use the Secondary Surface (#1a1a1a) with no shadow. Use a 1px border (#e5e5e5 at 10% opacity). Images within cards should have a slight desaturation or high-contrast treatment.
*   **Chips/Tags:** Monospaced text inside a thin 1px border. No background fill unless the tag is "Active."
*   **Lists:** Separated by 1px horizontal lines spanning the full width of the container. 
*   **Product Grid:** Use a "Technical Spec" layout where each item displays its origin data and roast level in a monospaced grid below the image.
*   **Specialty Component (The Roaster's Log):** A specialized data-table component using JetBrains Mono for displaying time-series roasting data, emphasizing the brand's commitment to "Engineered Precision."