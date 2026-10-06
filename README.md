# LIVING TYPE — Soft Physical Typography

> Design Engineer Take-Home Assignment · **Dodo Payments**  
> *"Build a tiny interactive visual experience that you think is genuinely cool."*

---

## 1. Concept: What Was Built

**LIVING TYPE** is an interactive generative typography experiment where letterforms behave as a soft, viscoelastic physical material.

Rather than treating digital type as static vector contours or burying it under generic particle storms and heavy shader noise, this project treats typography as an elastic physical substance. The central word—initially **`CREATE`**—rests in a generous, minimal editorial composition. Under the user's touch or cursor, it responds with physical mass, elasticity, surface tension, and acoustic wave propagation:

1. **Restrained Organic Idle State:** The typography softly breathes with subtle micro-current undulations, giving it an organic presence without distracting from its typographic clarity.
2. **Viscoelastic Cursor Proximity:** Moving the pointer near the typography produces a smooth magnetic attraction with spring-damper inertia. Moving away smoothly relaxes the type back into its resting state.
3. **Acoustic Shockwave Ripples:** Clicking or tapping anywhere initiates a concentric transverse wave that propagates through the letters, momentarily warping them before cleanly decaying.
4. **Tensile Drag & Harmonic Spring Recoil:** Dragging across the typography stretches the letters along the pointer path with tensile resistance. Releasing triggers a damped harmonic oscillation (`F = -k·x - c·v`) with natural overshoot and settling.
5. **Micro-Refractive Edge Strain:** During high-shear deformation, physical strain creates microscopic chromatic dispersion (0.5–1.5px) and embossed surface tension sheen. When idle, the letters return to 100% razor-sharp monochrome.
6. **Custom Text & Presets:** Users can remix the experience with their own short words (`MIND`, `TENSION`, `KINETIC`, `DODO`, `FORM`). Font sizes adapt dynamically to maintain negative space.
7. **Curated Material Feels:** Toggle between **Silicone** (balanced elastic bounce), **Fluid Gel** (viscous lingering ripples), and **Tension** (taut, snappy recoil).
8. **Editorial Framing & Palette:** Monochromatic gallery modes (**Obsidian Noir** & **Alabaster Paper**) with corner registration marks, telemetry HUD, and optional Web Audio micro-tones.

---

## 2. Interaction Instructions

| Interaction | Action | Description |
| :--- | :--- | :--- |
| **Hover** | Move cursor near letters | Letters deform softly toward the pointer with viscous spring drag |
| **Drag & Release** | Click + drag across type | Stretches letterforms with tensile shear; springs back with harmonic recoil |
| **Click / Tap** | Single click or tap | Propagates a circular acoustic wave ripple across letterforms |
| **Type Custom Word** | Bottom input / chips | Instantly adapts the simulation to any word up to 14 characters |
| **Material Switch** | Segmented toggle | Switch between *Silicone*, *Fluid Gel*, and *Tension* physics |
| **Reset** | Click Reset or press `[R]` | Restores text to `CREATE`, clears active ripples, returns to resting state |
| **Theme Toggle** | Sun / Moon icon | Switch between *Obsidian Noir* and *Alabaster Paper* |
| **Acoustic Feedback** | Speaker icon (top right) | Toggle optional procedural Web Audio micro-tones |

*Touch Devices:* Fully responsive. Tap triggers ripples, touch-drag stretches the elastomer, and viewport scrolling is prevented during canvas interaction.

---

## 3. Technology & Architecture Choices

```
src/
├── canvas/
│   ├── LivingTypeEngine.js    # WebGL context, physics simulation, offscreen text buffer
│   ├── shaders.js             # Vertex & Fragment GLSL shaders (viscoelastic displacement)
│   └── sound.js               # Web Audio API micro-acoustic synthesizer
├── components/
│   ├── LivingCanvas.jsx       # React wrapper syncing props with simulation engine
│   ├── EditorialHeader.jsx    # Discreet branding, live telemetry, and audio toggle
│   ├── ControlsDock.jsx       # Minimal bottom dock: custom input, material, font, reset
│   ├── EditorialCorners.jsx   # Corner registration marks & telemetry coordinates
│   └── InteractionGuide.jsx   # Subtle, non-intrusive interaction cues
├── styles/
│   └── living-type.css        # Editorial typography, Swiss layout, CSS variables
├── App.jsx                    # Root state, theme synchronization, keyboard shortcuts
└── main.jsx                   # React 19 entry point
```

### Why This Stack Was Chosen:
- **React 19 + Vite:** Instant build pipeline, zero boilerplate, and clean separation between declarative UI state and imperative rendering.
- **Custom WebGL GLSL Shaders (No heavy 3D engine):**
  - Evaluates continuous displacement fields directly on the GPU at 60–120 FPS.
  - Avoids importing Three.js or heavy bundle overhead for a 2D physical effect.
  - Sub-pixel smooth deformation with zero mesh polygon tearing.
- **Offscreen 2D Canvas Rasterization:**
  - Typesets any font, character, or ligature with `devicePixelRatio` sharpness.
  - Uploads dynamically to a WebGL texture whenever text or layout changes.
- **CPU Damped Harmonic Physics:**
  - Solves spring equations (`a = -k·x - c·v`) on CPU for cursor inertia and drag release recoil.
  - Allows precise control over settling tolerances and velocity injection.
- **Restraint Over Excess:**
  - Explicitly avoids generic AI aesthetics, neon gradients, glassmorphism, or particle confetti.
  - Typography remains the hero throughout.

---

## 4. What I Would Explore Next

With more time, here are the targeted directions I would explore:
1. **Multi-Touch Pinch Shear on Mobile:** Enable dual-finger gesture stretching to pinch and twist letter stems in 2D space.
2. **Variable Font Axis Coupling:** Bind variable font axes (Weight `wght`, Width `wdth`, Optical Size `opsz`, Slant `slnt`) directly to local strain rate and cursor proximity, blending geometric font interpolation with viscoelastic deformation.
3. **Audio-Reactive Mode:** Allow letter elasticity to respond to microphone input or ambient acoustic frequencies.
4. **SVG Path Vector Meshing:** Add an optional export mode that generates deformed SVG Bézier curves for direct export into design tools like Figma or Illustrator.

---

## 5. Setup & Running Locally

### Prerequisites
- Node.js `v18+` (v20+ or v22 recommended)
- npm or pnpm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview

# 5. Run linter
npm run lint
```

### Deployment
This project is static and zero-config ready for modern hosts:
- **Vercel:** Run `vercel` or link repository (Build command: `npm run build`, Output directory: `dist`).
- **Netlify:** Drag & drop the `dist/` folder or link repository.
- **GitHub Pages:** Deploy `dist/` directory via GitHub Actions.
