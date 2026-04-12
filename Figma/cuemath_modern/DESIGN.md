# Design System Document: The Premium Educational Curator

## 1. Overview & Creative North Star
This design system is engineered to elevate the educational experience from a standard utility to a premium digital journey. Moving away from the "bright and basic" look of traditional EdTech, we embrace the **Creative North Star: The Academic Atelier**. 

Like a curated gallery or a high-end architectural studio, the interface prioritizes breathing room, sophisticated layering, and intentional asymmetry. We reject the rigid, boxy grids of the past. Instead, elements are treated as dynamic, physical objects—stacked, floating, and overlapping—to create a sense of depth and discovery. The system balances the vibrant energy of Cuemath’s orange with the authoritative weight of midnight blue, ensuring the brand feels both "Exciting" and "Expert."

---

## 2. Colors
Our palette is a dialogue between action and authority. We utilize Material Design token logic but apply it with editorial restraint.

### Palette Strategy
- **Primary Action (#7B5800 / #FFBA07):** Used exclusively for high-intent actions and critical brand moments.
- **Secondary Authority (#495F84 / #001B3D):** Provides the "midnight" depth required for a professional, trustworthy feel.
- **Tertiary Growth (#006D33 / #00E472):** Reserved for success states and progress indicators.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. 
Boundaries must be defined through:
1. **Background Color Shifts:** Use `surface-container-low` (#F3F3F6) against a `surface` (#F9F9FC) background to define a new content area.
2. **Tonal Transitions:** Use soft, bleed-edge background changes to separate the header from the body.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
- **Base:** `surface` (#F9F9FC)
- **Secondary Section:** `surface-container-low` (#F3F3F6)
- **Interactive Card:** `surface-container-lowest` (#FFFFFF)
- **Active/Hover State:** `surface-container-high` (#E8E8EA)

### Signature Textures
- **The Glass Rule:** For floating modals or navigation bars, use `surface` colors at 80% opacity with a `24px` backdrop-blur.
- **Tonal Gradients:** CTAs should never be flat. Apply a subtle linear gradient from `primary` (#7B5800) to `primary_container` (#FFBA07) at a 135° angle to add "soul" and dimension.

---

## 3. Typography
We use **Inter** as our typographic workhorse, leaning into its high-readability and neutral Swiss DNA to allow the content to lead.

- **Display (Display-LG/MD):** Set with tight letter-spacing (-0.02em). Use these for bold, inspirational headers that break the grid.
- **Headline (Headline-LG/MD):** The "Voice of the Curator." Use these for section titles. Pair with generous top-margin to create editorial "white space."
- **Body (Body-LG/MD):** The "Information Layer." Always use `on_surface_variant` (#504532) for long-form text to reduce eye strain and increase the "premium" feel over pure black.
- **Label (Label-MD/SM):** Set in All-Caps with +0.05em tracking when used for metadata or small eyebrow titles.

---

## 4. Elevation & Depth
Depth is not an effect; it is a structural necessity. We move away from "drop shadows" toward **Ambient Occlusion**.

- **The Layering Principle:** Achieve lift by stacking surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft lift without a single pixel of shadow.
- **Ambient Shadows:** When an element must float (e.g., a primary FAB), use a multi-layered shadow:
  - `Box-shadow: 0 4px 20px rgba(73, 95, 132, 0.04), 0 12px 40px rgba(73, 95, 132, 0.08);`
  - Note the tint: Shadows should use a transparent version of `secondary` (#495F84) rather than black.
- **The Ghost Border:** If a boundary is required for accessibility, use `outline_variant` (#D5C4AC) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (Primary to Primary-Container), 12px rounded corners, `on_primary` text. No border.
- **Secondary:** `surface-container-high` background with `primary` text. 
- **Tertiary:** Ghost style. No background. `primary` text with a subtle underline on hover.

### Input Fields
- **Container:** `surface-container-lowest`. 
- **State:** On focus, the background remains white, but a 2px "Ghost Border" of `primary` appears at 40% opacity.
- **Label:** Floating label using `label-md` specs.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines.
- **Implementation:** Separate list items using `16px` of vertical white space or a 2% tonal shift in background color on alternating rows. 
- **Shape:** All cards must use `xl` (1.5rem / 24px) or `lg` (1rem / 16px) corner radius to maintain the "Modern & Trustworthy" aesthetic.

### Educational Progress Modules (Custom)
- **The "Curator" Track:** Use a thick (8px) `tertiary_container` stroke for progress bars, featuring a `primary` glow on the leading edge to signify momentum.
- **Interactive Chips:** Use `secondary_container` with `on_secondary_container` text. When selected, transition to `primary` with a soft ambient shadow.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts. Place a large `display-lg` headline off-center to create visual interest.
- **Do** use Glassmorphism for overlays to keep the user grounded in the "Academic Atelier."
- **Do** lean into the 12px–24px border radius scale to keep the interface feeling approachable.

### Don't
- **Don't** use pure #000000 for text. Use the `on_surface` or `on_surface_variant` tokens to maintain a high-end, "printed" feel.
- **Don't** use standard 1px grey dividers. If you feel the need for a line, use a wide margin instead.
- **Don't** crowd the interface. If a screen feels "full," it is over-designed. Increase the `surface` spacing.
- **Don't** use high-intensity orange for everything. It is a "spice" color, not a "main course" color. Secondary midnight blue should do the heavy lifting.