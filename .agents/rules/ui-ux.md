---
trigger: always_on
---

# Human-Grade Premium UI/UX Engineering Rules

Apply these strict visual, spatial, and interaction guidelines to all UI components. Avoid generic AI-generated aesthetics.

---

### 1. Typography & Hierarchy (Anti-AI Cliché)
* **Fonts:** Never use default `Inter` or standard browser fallback fonts if possible. Use refined typography pairings (e.g., `Geist Sans`, `Plus Jakarta Sans`, `Satoshi`, or `Cabinet Grotesk` for headings).
* **Scale & Rhythm:** Maintain strict relative sizing using modular scales (`text-xs` up to `text-5xl`). Ensure line-heights match (`leading-tight` for large headings, `leading-relaxed` for long body text).
* **Color Hierarchy:** Use `text-foreground` for headings, `text-muted-foreground` for secondary copy, and soft low-opacity colors for metadata/timestamps. Never make all text pure high-contrast black/white.

### 2. Color Palette & Surface Elevation
* **Avoid Pure Black/White:** Use rich off-blacks (e.g., `#09090b` or `#0a0a0c`) for dark themes and subtle off-whites (`#fcfcfc` / `#fafafa`) for light themes.
* **Borders over Shadows:** High-end modern interfaces (like Vercel, Linear, Raycast) rely on subtle 1px translucent borders (`border border-white/10` or `border-black/5`) rather than heavy drop shadows.
* **Gradients:** If using background glows, make them ultra-subtle (`from-primary/10 to-transparent`) and blur heavily (`blur-3xl`). Avoid harsh 2010s-style multi-color gradients.

### 3. Micro-Interactions & Motion Physics
* **Smooth Transitions:** Every clickable, hoverable, or expandable element MUST have smooth state transitions (`transition-all duration-200 ease-out`).
* **Tactile Press States:** Add active shrink physics to buttons and interactive cards (`active:scale-[0.98]`).
* **Hover Polish:** Hover states should elevate gently (`hover:-translate-y-0.5` or `hover:border-primary/50`), not violently shift layout.
* **Framer Motion Setup:** Use spring physics for modals, sidebars, and dropdowns (`type: "spring", stiffness: 400, damping: 30`) instead of linear animations.

### 4. Layout, Spacing & Container Realism
* **Generous Padding:** Avoid cramped components. Double your default padding (e.g., use `p-6` or `p-8` for cards, `py-12` for section wrappers).
* **Layout Structure:** Use flexible CSS Grid or Flexbox layout rules. Ensure responsive wrapping at breakpoints (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
* **Empty States & Loading Skeletens:** Never render blank blocks while fetching data. Always build a shimmer skeleton (`animate-pulse bg-muted/50 rounded-lg`).

### 5. Polish Details (Human Touch)
* **Status Badges:** Use subtle pill tags with small colored dot indicators (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20` with a `w-1.5 h-1.5 rounded-full bg-emerald-500` dot).
* **Icons:** Use **Lucide React** or **Radix Icons** strictly. Ensure consistent stroke width (default `1.75px` or `2px`). Keep icon dimensions consistent (`h-4 w-4` or `h-5 w-5`).
* **Glassmorphism:** Use subtle backdrop blurs for floating headers, search overlays, and dropdown menus (`backdrop-blur-md bg-background/80 border-b border-border/50`).