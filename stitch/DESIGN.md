# Design System Specification: The Luminous Void

## 1. Overview & Creative North Star
**Creative North Star: The Luminous Void**
This design system is built on the philosophy of "Depth through Illumination." Rather than using traditional borders and rigid grids to contain information, we use light, tonal layering, and atmospheric gradients to guide the user’s eye. It is an editorial approach to a high-tech aesthetic—moving away from the flat, "template" look of standard SaaS platforms toward a bespoke, immersive experience that feels both infinite and structured.

To achieve this, we prioritize **intentional asymmetry** and **breathing room**. We do not fill space; we curate it. Elements should feel like they are floating in a deep, pressurized environment, lit by the vibrant energy of the primary and secondary accents.

---

## 2. Colors
The palette is rooted in a deep, nocturnal foundation, punctuated by high-chroma accents that signify action and intelligence.

*   **Foundation:** The core is `surface` (`#080e1d`). This is our "true north" for the background.
*   **Accents:** We utilize a dual-tone strategy. `primary` (`#a3a6ff`) represents logic and stability, while `secondary` (`#c180ff`) adds a layer of creative energy.
*   **The "No-Line" Rule:** To maintain a premium editorial feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit against a `surface` background to create a natural, soft transition.
*   **The "Glass & Gradient" Rule:** Main CTAs and featured elements must use gradients (e.g., `primary` to `primary-container`) to provide "soul." For floating cards, use semi-transparent surface colors with a `backdrop-blur` of 12px–20px to create a frosted glass effect.

### Surface Hierarchy & Nesting
Depth is achieved by "stacking" surface tiers from dark to light:
1.  **Lowest:** `surface-container-lowest` (`#000000`) – Used for deep background recesses.
2.  **Base:** `surface` (`#080e1d`) – The standard canvas.
3.  **Raised:** `surface-container` (`#12192b`) – For primary content cards.
4.  **Highest:** `surface-container-highest` (`#1d253b`) – For interactive elements or popovers.

---

## 3. Typography
The typography system uses a high-contrast pairing to balance technical precision with approachable warmth.

*   **Display & Headlines (Plus Jakarta Sans):** Used for all `display-` and `headline-` scales. This typeface provides a modern, geometric authority. For `display-lg` (3.5rem), use tighter letter spacing (-0.02em) to create an "editorial" impact.
*   **Body & Labels (Manrope):** Used for `body-`, `title-`, and `label-` scales. Manrope’s slightly condensed nature ensures high readability in dark-themed environments where light text can "bloom" or bleed visually.
*   **Intentional Scale:** Use `display-lg` for hero statements to create a clear entry point, then drop significantly to `body-lg` for descriptions. This "leap" in scale creates the high-end, custom-designed feel.

---

## 4. Elevation & Depth
In this design system, shadows are not "darkness"—they are "occlusion."

*   **The Layering Principle:** Place a `surface-container-low` card on a `surface` section. The change in hex code provides the "lift" without the need for a stroke.
*   **Ambient Shadows:** When a floating effect is required (e.g., a modal or primary dropdown), use extra-diffused shadows. 
    *   *Spec:* `0px 20px 40px rgba(0, 0, 0, 0.4)`
    *   The shadow should feel like natural ambient light, never a harsh grey drop shadow.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Subtle Glows:** For primary interactive elements, apply a soft outer glow using the `primary_dim` color at 20% opacity. This mimics the appearance of a light source within the UI.

---

## 5. Components

### Buttons
*   **Primary:** Pill-shaped (`rounded-full`). Gradient fill from `primary` to `primary_container`. Text color: `on_primary`. Apply a 10px blur glow on hover using `primary`.
*   **Secondary:** Pill-shaped. Background: `surface_container_high`. Border: "Ghost Border" (15% `outline`).
*   **Tertiary:** Ghost style. No background. Underline only on hover.

### Input Fields
*   **Structure:** Use `surface_container_low` for the input track. 
*   **States:** On focus, the border transitions to a 1px `primary_dim` with a 4px soft outer glow. Forbid the use of "standard" blue focus rings; use the system's `primary` accents.

### Cards & Sections
*   **Layout:** Never use horizontal divider lines. Separate content using the Spacing Scale (e.g., `16` / 5.5rem for sections).
*   **Rounding:** Containers use `DEFAULT` (1rem). Featured hero elements or "pill" badges use `full` (9999px).

### The "Pulse" Badge (Special Component)
*   Used for status updates (e.g., "v1.0 is Live"). Small, pill-shaped badge using `secondary_container` background and `on_secondary_container` text. Place a 4px solid `secondary` dot to the left of the text to signify "active" status.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. For example, left-align your headlines but right-align your supporting body text to create a dynamic diagonal visual flow.
*   **Do** embrace negative space. If a section feels crowded, increase the padding to the next step in the spacing scale (e.g., move from `12` to `16`).
*   **Do** use `text-wrap: balance` on large headlines to ensure editorial elegance.

### Don't:
*   **Don't** use 100% white (`#FFFFFF`) for body text. Use `on_surface_variant` (`#a5aabf`) to reduce eye strain and maintain the atmospheric mood.
*   **Don't** use sharp 90-degree corners. Everything must feel organic; use at least the `sm` (0.5rem) rounding for even the smallest elements.
*   **Don't** use "pure" grey. Every neutral in this system is tinted with navy to ensure the "Luminous Void" feels like a single, cohesive environment.