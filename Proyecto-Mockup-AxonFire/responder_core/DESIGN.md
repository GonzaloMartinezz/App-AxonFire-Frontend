# Design System Document

## 1. Overview & Creative North Star: "The Tactical Command"

This design system is engineered for the high-stakes environment of emergency response. Moving beyond the "utility-first" template look, it adopts a **Tactical Command** philosophy. This Creative North Star treats the interface not as a static tool, but as a high-fidelity heads-up display (HUD). 

We achieve a signature feel by blending **Organic Brutalism**—characterized by bold, heavy elements and generous whitespace—with **Kinetic Depth**. Instead of traditional grids, the layout utilizes intentional asymmetry and overlapping "floating" surfaces (as seen in our navigation architecture) to create a sense of urgency and technical sophistication.

## 2. Colors & Surface Architecture

The palette is rooted in high-visibility safety standards, re-imagined through a premium lens of tonal depth.

### Color Tokens
- **Primary (Emergency):** `primary` (#af101a) and `primary_container` (#d32f2f). Use these for life-critical actions and active alerts.
- **Secondary (The Slate):** `secondary` (#546067) and `inverse_surface` (#263238). These provide the "Dark Charcoal" foundation for focus.
- **Accents:** `tertiary` (#8b4400 / Safety Orange) for high-priority status; `Success Green` (#388e3c) for operational readiness; `Alert Blue` (#1976d2) for logistical data.

### The "No-Line" Rule
To maintain an editorial, high-end aesthetic, **1px solid borders are prohibited** for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a card (`surface-container-highest`) should sit on a section background (`surface-container-low`) without a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers:
1.  **Base Layer:** `surface` (#f4faff) for the overall application canvas.
2.  **Sectional Layer:** `surface-container-low` (#e9f6fd) to group related content blocks.
3.  **Actionable Layer:** `surface-container-highest` (#d7e4ec) for interactive cards and list items.

### The "Glass & Gradient" Rule
Floating elements—specifically the bottom navigation and top-level modals—must use **Glassmorphism**. Apply a semi-transparent `secondary` or `surface` color with a `20px` backdrop-blur. 
*   **Signature Texture:** Main Call-to-Actions (CTAs) should utilize a subtle vertical gradient transitioning from `primary` to `primary_container`. This provides a "soul" and physical presence that flat colors lack.

## 3. Typography: Editorial Authority

We use **Inter** to bridge the gap between technical legibility and modern authority. 

- **Display & Headlines:** Use `display-sm` (2.25rem) for main dashboard headers. Reduce letter-spacing to `-0.02em` to create a dense, authoritative "editorial" look.
- **Title & Body:** `title-md` (1.125rem) is the workhorse for alert titles. `body-lg` (1rem) is the minimum for field readability.
- **Labels:** `label-md` (0.75rem) should be used sparingly for metadata, always in All-Caps with `+0.05em` letter-spacing to ensure clarity under stress.

The hierarchy is designed to be scanned in milliseconds. High-contrast pairings (e.g., `on_surface` text on `surface_container_highest` cards) ensure data remains legible even in high-glare outdoor environments.

## 4. Elevation & Depth

Hierarchy is achieved through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Depth is "stacked." Place a `surface_container_lowest` card atop a `surface_container_low` background to create a soft, natural lift.
- **Ambient Shadows:** For floating elements like the "New Alert" FAB, use extra-diffused shadows. 
    - **Shadow Spec:** `0px 12px 32px rgba(17, 29, 35, 0.08)`. The shadow color must be a tinted version of the `on_surface` token, mimicking natural light.
- **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.
- **Tactical Blur:** Background content must be blurred when overlays are active, forcing the user's cognitive focus onto the mission-critical task.

## 5. Components

### Buttons & Inputs
- **Primary FAB (Alert):** A large, circular `primary` button positioned centrally in the navigation bar. It should feature a soft `primary` glow (8% opacity) to signify its status as the "Life-Safety" action.
- **Segmented Controls:** Use `secondary_container` for unselected states and `inverse_surface` for selected states (as seen in the "Activas/Todas" filter). Corners must use the `full` (9999px) roundedness scale.
- **Input Fields:** Utilize `surface_container_low` for the field body. Forgo the bottom line; use a `md` (0.75rem) corner radius for a robust, "rugged" feel.

### Status Badges & Chips
- **Criticality Badges:** Use high-contrast fills (e.g., `primary` for CRÍTICA). Text must be `on_primary`, bold, and capitalized.
- **Status Chips:** Use de-saturated versions of the accent colors (e.g., `tertiary_fixed` for "En Progreso") to ensure they don't compete with the "Alert" red.

### Lists & Cards
- **The Divider Ban:** Strictly forbid the use of horizontal rules. Separate list items using the **Spacing Scale** (minimum 12px gap) or alternating surface tones (`surface_container_high` vs `surface_container_highest`).
- **Map Markers:** Utilize the `primary` and `tertiary` (Orange) tokens with a white `Ghost Border` to ensure they pop against the complex map background.

## 6. Do's and Don'ts

### Do
- **Do** use the `xl` (1.5rem) roundedness for main container cards to soften the "industrial" feel.
- **Do** prioritize the "Primary FAB" in the layout; it should be the most visually "heavy" element on the screen.
- **Do** use `on_surface_variant` for secondary metadata (like "17 hours ago") to create a clear typographic hierarchy.

### Don't
- **Don't** use pure black (#000000). Always use the `inverse_surface` (#263238) for dark backgrounds to maintain tonal richness.
- **Don't** use standard "drop shadows" with high opacity. They clutter the UI and reduce the "high-end" feel.
- **Don't** crowd the edges. Volunteer firefighters often use the app with gloves or one-handed; maintain a minimum 16px "Safe Zone" from the screen edge for all interactive elements.