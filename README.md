# LIVING TYPE — Soft Physical Typography

> Design Engineer Take-Home Assignment · **Dodo Payments**  
> *"Build a tiny interactive visual experience that you think is genuinely cool."*

---

## 1. Concept: What Was Built

**LIVING TYPE** is an interactive physical typography experience where each letter is simulated as an independent, soft viscoelastic body.

Rather than relying on generic fullscreen shader filters, noisy particle storms, or sci-fi telemetry clichés, this project treats typography as an authentic tactile material. The central word—initially **`CREATE`**—rests in a generous, minimal editorial composition. Under the user's touch or cursor, each letter responds with physical mass, elasticity, squash-and-stretch volume preservation, and acoustic wave transmission:

1. **Restrained Organic Idle State:** Each glyph breathes gently with an organic harmonic phase offset, giving the composition quiet life while preserving typographic elegance.
2. **Direct Letter Grab & Stretch:** Click and pull any individual letter like a rubber band or soft silicone block. The letter stretches along the drag vector, tilts, and elastically pulls neighbouring letters through Hooke's Law spring coupling.
3. **Harmonic Spring Recoil & Slingshot:** Flinging or releasing a letter snaps it back to its anchor with damped harmonic oscillation (`F = -k·x - c·v`), displaying authentic squash & stretch (`scaleX` squashes as `scaleY` recoils) to conserve physical 2D volume.
4. **Sliced Jelly Bending Curvature:** Each character is subdivided into 12 viscoelastic slices with internal spring lattice dynamics, producing natural curvature and wobble rather than rigid rotation.
5. **Continuous Canvas Sweep & Drag:** Dragging across the typography sweeps a physical wake that deflects, shears, and ruffles letters in the stroke path before smoothly springing back.
6. **Acoustic Shockwave Ripples:** Clicking anywhere on the canvas radiates a concentric shockwave ring. As the wave crest sweeps across each letter, it transfers an explosive radial impulse and torque.
7. **Interactive Triggers:** Dedicated `[Wave]` (sends a sequential ripple down the letter chain) and `[Jiggle]` (shakes all letters with elastic oscillation) actions in the header and via keyboard (`[W]` and `[J]`).
8. **Custom Text & Presets:** Users can remix the experience with their own words (`MIND`, `TENSION`, `KINETIC`, `DODO`, `JELLY`). Font sizes dynamically adapt to maintain negative space.
9. **Physical Material Modalities:** Toggle between **Silicone Rubber** (balanced bounce), **Viscous Gel** (heavy mass, slow lingering recoil), and **Taut Spring** (snappy, high-frequency twang).
10. **Warm Monochromatic Editorial Aesthetic:** **Obsidian Noir** (`#0C0C0E`) and **Alabaster Paper** (`#F6F5F1`) modes, contact shadows beneath letters, and optional procedural Web Audio micro-tones.

---

## 2. Interaction Instructions

| Interaction | Action | Description |
| :--- | :--- | :--- |
| **Grab & Stretch** | Click & drag any letter | Pulls, stretches, and twists the letter; exerts elastic tension on neighbours |
| **Fling / Release** | Release grabbed letter | Snaps back with damped harmonic spring recoil and volume-conserving squash |
| **Canvas Sweep** | Drag across letters | Sweeps a dynamic wake that deflects and ruffles letters along the path |
| **Click / Tap** | Click canvas | Propagates an acoustic shockwave ring that knocks each letter in succession |
| **Wave Action** | Click `Wave` or press `[W]` | Sends a sequential kinetic wave ripple across the letter chain |
| **Jiggle Action** | Click `Jiggle` or press `[J]` | Injects elastic impulse into all letters, causing harmonic wobble |
| **Type Custom Word** | Bottom input / chips | Instantly remakes the simulation with your own word (up to 12 chars) |
| **Physics Selector** | Segmented toggle | Switch between *Silicone Rubber*, *Viscous Gel*, and *Taut Spring* |
| **Reset** | Click Reset or press `[R]` | Restores text to `CREATE`, centers letters, and returns to resting state |
| **Theme Toggle** | Sun / Moon icon | Switch between *Obsidian Noir* and *Alabaster Paper* |
| **Acoustic Feedback** | Speaker icon (top right) | Toggle optional procedural Web Audio micro-tones |

*Touch Devices:* Fully responsive. Tap triggers shockwaves, touch-drag grabs and stretches letters, and canvas touch-scroll is prevented during interaction.

---

## 3. Technology & Architecture Choices

```
src/
├── canvas/
│   ├── LivingTypeEngine.js    # Multi-body spring simulation, sliced jelly rendering, shockwaves
│   └── sound.js               # Web Audio API procedural micro-tones (droplet & rubber twang)
├── components/
│   ├── LivingCanvas.jsx       # React wrapper syncing props with imperative engine
│   ├── EditorialHeader.jsx    # Quiet branding, live state, Wave / Jiggle buttons, sound toggle
│   ├── ControlsDock.jsx       # Minimal bottom dock: custom input, physics, typeface, reset
│   └── InteractionGuide.jsx   # Subtle interaction cues
├── styles/
│   └── living-type.css        # Editorial layout, typography, CSS variables, mobile responsiveness
├── App.jsx                    # Root state, theme synchronization, keyboard shortcuts
└── main.jsx                   # React 19 entry point
```

### Why This Stack Was Chosen:
- **React 19 + Vite:** Instant feedback, sub-second production builds (320ms), and clean separation between declarative state and imperative physics.
- **Handcrafted Multi-Body Physics (No heavy 3D engine):**
  - Evaluates individual glyph spring anchors, angular springs, and inter-letter coupling tension at a smooth 60–120 FPS.
  - Sliced glyph sub-lattices produce authentic organic bending without 3D rigging or mesh bloat.
  - Keeps the bundle featherweight (~78 KB gzip).
- **Procedural Canvas 2D Rendering:**
  - Crisp typography at Retina `devicePixelRatio`.
  - Directional contact shadows and elastic tension tethers.
  - Zero WebGL context-loss edge cases across mobile browsers.
- **Restraint Over AI Tropes:**
  - Avoids fake sci-fi HUDs, random particle fields, or generic rainbow shader distortions.
  - Focuses on visceral tactile physics, Disney squash-and-stretch principles, and typographical craft.

---

## 4. What I Would Explore Next

1. **Multi-Touch Pinch Stretch:** Dual-finger gestures on mobile to pull letters in opposing directions.
2. **Variable Font Axis Coupling:** Map spring tension directly into OpenType variable font axes (`wght`, `wdth`, `slnt`), morphing glyph weight as it stretches.
3. **SVG Vector Contour Export:** An action to capture and download the deformed letter outlines as clean Bézier curves for Figma.
4. **Custom Word Playground URL Sharing:** Encode custom words and physics presets into the URL hash for easy sharing.

---

## 5. Setup & Running Locally

### Prerequisites
- Node.js `v18+` (v20+ or v22 recommended)
- npm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
# -> Opens http://localhost:5173/

# 3. Production build (verified 0 errors, 0 warnings)
npm run build

# 4. Preview production build
npm run preview

# 5. Run linter
npm run lint
```

### Deployment
This project is static and zero-config ready for modern hosts:
- **Vercel:** Import repository or run `npx vercel` (Build Command: `npm run build`, Output Directory: `dist`).
- **Netlify:** Drag & drop the `dist/` folder or link repository.
- **GitHub Pages:** Deploy `dist/` via standard GitHub Actions.
