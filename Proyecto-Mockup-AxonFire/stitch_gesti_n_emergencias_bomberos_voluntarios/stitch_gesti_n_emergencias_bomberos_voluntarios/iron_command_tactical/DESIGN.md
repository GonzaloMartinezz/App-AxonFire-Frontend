```markdown
# Tactical Management Design System

## 1. Overview & Creative North Star
**Creative North Star: "The Tactical Vanguard"**

In high-stakes emergency management, clarity is not just an aesthetic choice—it is a functional imperative. This design system moves away from the "standard dashboard" fatigue by adopting an editorial, high-contrast aesthetic that feels both authoritative and technologically advanced. 

We break the traditional "boxed" template through **The Tactical Vanguard** philosophy:
*   **Intentional Asymmetry:** Utilizing wide margins and offset typography to lead the eye to critical data.
*   **Atmospheric Depth:** A foundation of deep tactical greys (`surface`) layered with vibrant, blurred mesh gradients of emergency red (`primary_container`) and professional blue (`secondary_container`) to simulate a high-tech command center.
*   **Solid Reliability:** Components are built with structural integrity, favoring tight radii and heavy-weight typography to convey stability under pressure.

## 2. Colors
Our palette is rooted in the "Dark Tactical Grey" base, providing a low-light environment that reduces eye strain during long shifts while making vibrant alerts pop.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Layout boundaries must be defined solely through background color shifts or tonal transitions. To separate a navigation rail from a main dashboard, use `surface_container_low` against a `surface` background.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of equipment. 
*   **Foundation:** `surface` (#111316)
*   **Level 1 (Sub-sections):** `surface_container_low`
*   **Level 2 (Cards/Primary Content):** `surface_container`
*   **Level 3 (Pop-overs/Active Focus):** `surface_container_highest`

### The Glass & Gradient Rule
To elevate the login and critical alert screens, apply **Glassmorphism**:
*   **Surface:** Use `surface_container` with 60-80% opacity.
*   **Effect:** Apply a `backdrop-blur` (16px to 32px).
*   **Underlay:** Position a mesh gradient transitioning from `primary_container` (#D32F2F) to `secondary_container` (#005DB7) behind the glass layer to provide "visual soul."

## 3. Typography
We utilize a dual-font strategy to balance technical precision with high-impact readability.

*   **Display & Headlines (Space Grotesk):** This is our "Technical Bold" voice. Use `display-lg` and `headline-md` for mission-critical status updates and login branding. It feels engineered and modern.
*   **Body & Titles (Inter):** Our workhorse. `inter` provides maximum legibility for incident reports and data entry.
*   **Hierarchy as Authority:** Use `title-lg` in All Caps for section headers to evoke a military/tactical brief. Maintain high contrast by using `on_surface` for primary text and `on_surface_variant` only for secondary metadata.

## 4. Elevation & Depth
Depth is a tool for focus, not just decoration.

### The Layering Principle
Achieve lift by stacking. Place a `surface_container_lowest` card inside a `surface_container_high` area to create a "recessed" feel for input fields. Conversely, lift active elements by moving up the tier scale.

### Ambient Shadows
Shadows should be rare and sophisticated. When a "floating" element (like a modal) is required:
*   **Blur:** 40px - 60px.
*   **Opacity:** 8% `on_surface`.
*   **Color:** Tint the shadow with a hint of `primary` to suggest the glow of emergency lights.

### The "Ghost Border" Fallback
If a container requires a perimeter for accessibility, use a **Ghost Border**:
*   **Token:** `outline_variant` at 15% opacity.
*   **Rule:** 100% opaque, high-contrast borders are strictly prohibited.

## 5. Components

### Buttons (Tactical Actions)
*   **Primary:** Solid `primary_container` (#D32F2F) with `on_primary_container` text. Use `md` (0.375rem) roundedness. It should feel like a physical "Ignition" button.
*   **Secondary:** Glass-style. `surface_container_high` at 40% opacity with a `backdrop-blur`.
*   **Tertiary:** No background. Bold `inter` label with a `primary` color underscore on hover.

### Input Fields (Data Entry)
*   **Container:** `surface_container_highest` with a `sm` (0.125rem) bottom-only border in `primary` when focused.
*   **Label:** Use `label-md` floating above the field in `on_surface_variant`.
*   **Visual Polish:** In the login focus, inputs should be slightly translucent to allow the mesh gradient to bleed through minimally.

### Cards & Lists
*   **No Dividers:** Use `8px` or `16px` of vertical white space to separate list items. 
*   **Indication:** Use a vertical 4px bar of `primary` on the far left of a card to indicate an "Active Incident."

### Tactical Chips
*   **Status:** High-saturation backgrounds (`primary` for Fire, `secondary` for Police) with high-contrast text. Square off the corners to `sm` (0.125rem) to maintain the technical aesthetic.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts where the heading is pushed to the far left and data is centered.
*   **Do** leverage the `surface_container` tiers to create a "dashboard within a dashboard" look.
*   **Do** use large `display` type for single, critical numbers (e.g., "Active Units: 14").

### Don't
*   **Don't** use standard "card-on-grey-background" patterns. Merge sections using color tiers.
*   **Don't** use rounded corners above `xl` (0.75rem). We want "Solid and Reliable," not "Soft and Consumer."
*   **Don't** use pure black (#000000). Always use the tactical grey foundation of `surface` (#111316).
*   **Don't** use icons without accompanying text labels unless they are globally recognized emergency symbols.

---
**Director's Note:** This system is designed to feel like a high-end piece of specialized hardware. Every pixel must feel intentional, every layer must have a purpose, and the contrast between the dark tactical base and the vibrant emergency accents should feel like a beacon in the dark.```