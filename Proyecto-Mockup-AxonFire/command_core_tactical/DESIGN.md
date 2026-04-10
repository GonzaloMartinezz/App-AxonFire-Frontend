# Design System Specification: Editorial Tactical Grey

## 1. Overview & Creative North Star
### The Creative North Star: "The Tactical Monolith"
This design system moves away from the airy, fragile aesthetics of consumer apps toward a "Tactical Monolith" approach. It is built for high-stakes environments where clarity is a requirement, not a feature. By utilizing a "Tactical Dark Mode" philosophy—interpreting light grey not as a background, but as a solid, physical surface—we create an interface that feels like a precision-engineered instrument.

We break the "standard template" look through intentional tonal layering and high-contrast accents. This system rejects the hamburger menu in favor of a centralized, authoritative bottom navigation, ensuring all mission-critical actions are within immediate reach. The aesthetic is rugged yet sophisticated, blending the utility of industrial equipment with the high-end polish of editorial typography.

---

## 2. Colors
Our palette is anchored by deep tactical greys and a high-alert primary red. This creates a psychological environment of "Ready-State" awareness.

### Color Tokens
*   **Background (`#f9f9fb`):** The primary tactical surface. It is a matte, non-reflective grey that provides depth without the harshness of white.
*   **Primary (`#af101a` / `#d32f2f`):** Reserved strictly for critical actions, emergency alerts, and active states.
*   **Surface Containers:**
    *   `surface_container_lowest`: `#ffffff` (Used for floating glass elements)
    *   `surface_container_low`: `#f3f3f5` (Default card base)
    *   `surface_container_high`: `#e8e8ea` (Nested detail areas)
    *   `surface_container_highest`: `#e2e2e4` (Deeply recessed utility areas)

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. Use `surface_container_low` elements sitting on a `surface` background to define shape. If a container needs more prominence, use `surface_container_highest` for an inset look.

### The "Glass & Gradient" Rule
To elevate the tactical feel, floating components (like the Bottom Navigation or Modal overlays) must utilize **Glassmorphism**. Use `surface_container_lowest` with a 70-80% opacity and a `20px` backdrop-blur. 
*   **Signature Texture:** Main Action Buttons should use a subtle vertical gradient from `primary` (#af101a) to `primary_container` (#d32f2f) to provide a "machined" feel rather than a flat digital fill.

---

## 3. Typography
The system utilizes **Inter** exclusively. It is chosen for its geometric clarity and high legibility under duress.

*   **Display (lg/md/sm):** Used for critical status counts (e.g., "3 Active Emergencies"). Set with tight tracking (-0.02em) to feel dense and authoritative.
*   **Headline (lg/md/sm):** Bold, functional headers. Use these to anchor the top of views in the absence of a side drawer.
*   **Title (lg/md/sm):** Specifically for card headers and navigation labels. 
*   **Body (lg/md/sm):** Standardized for data entry and mission logs.
*   **Label (md/sm):** High-contrast, often all-caps, used for status tags (e.g., "PENDING", "IN-ROUTE").

The hierarchy is driven by weight. Functional data is always `Medium` or `Semi-Bold` weight to ensure it survives low-light or high-vibration environments.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than structural lines.

### The Layering Principle
Think of the UI as a series of stacked, precision-cut plates. 
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (Section):** `surface_container_low`
3.  **Level 2 (Active Element/Card):** `surface_container_lowest`

### Ambient Shadows
Shadows must be "Ambient Only." 
*   **Values:** Blur: 24px–40px | Opacity: 4%–6% | Color: `on_surface` (tinted).
*   **Goal:** To make elements feel like they are naturally catching light, rather than being "lifted" by a software effect.

### The "Ghost Border" Fallback
If accessibility requirements demand a border (e.g., in high-glare environments), use a **Ghost Border**: `outline_variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Bottom Navigation (The Command Center)
The focal point of the UI. It must be centralized with no side-drawer dependency.
*   **Style:** Glassmorphic container (`surface_container_lowest` @ 80% opacity + blur).
*   **Radius:** `xl` (1.5rem) or `full` for a pill shape.
*   **Active State:** Use the `primary` red for the active icon and a small 4px "dot" indicator below it.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`). Radius: `md` (0.75rem).
*   **Secondary:** `surface_container_highest` fill with `on_surface` text. No border.
*   **Tertiary:** Transparent background, `primary` text weight `Bold`.

### Tactical Cards
*   **Rule:** Forbid divider lines.
*   **Spacing:** Use `1.5rem` (xl) vertical padding between content blocks to create separation.
*   **Nesting:** Place `label-sm` tags in the top right of cards using `secondary_container` for status.

### Input Fields
*   **Base:** `surface_container_high`. 
*   **Active:** `outline` focus ring (Ghost Border style).
*   **Error:** Background shifts to `error_container` with a `primary` red label.

---

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetry in typography. A large `display-md` headline can sit flush left with secondary data tucked into the right column.
*   **DO** lean on `ROUND_TWELVE` (0.75rem) for all standard containers to maintain the "Rugged Modern" feel.
*   **DO** use white space as a structural element. If two things are different, put more space between them rather than a line.

### Don't
*   **DON'T** use hamburger menus. If the navigation doesn't fit in the bottom bar, reconsider the information architecture.
*   **DON'T** use pure black (#000000) for text. Use `on_surface` (#1a1c1d) to maintain the tonal grey harmony.
*   **DON'T** use shadows on cards that are resting on the background; reserve shadows only for floating overlays or global navigation.