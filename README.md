# Word Game

## Technologies Used

- **React 19**: Declarative user interface, state management, and component architecture.
- **Vite 6**: Fast build tooling, bundling, and hot module replacement.
- **WebGL & Custom GLSL Shaders**: GPU-accelerated viscoelastic typography displacement, dynamic chromatic dispersion, and surface sheen rendering.
- **HTML5 Canvas 2D API**: High-resolution rasterization, offscreen texture generation, real-time alpha collision mapping, and kinetic arcade particles.
- **Web Audio API**: Procedural sound synthesis engine for grand piano acoustic modeling, slingshot transients, harmonic overtones, and milestone fanfares.
- **Lucide React**: Vector interface icons.
- **Modern CSS**: Fluid typography, CSS custom properties, and responsive layout styling.

---

## Flow Diagram

```mermaid
flowchart TD
    subgraph User Interaction
        A[User Input] --> B1[Pointer Move / Drag / Tap]
        A --> B2[Text Typing / Word Selection]
        A --> B3[Arcade Game Mode Trigger]
    end

    subgraph Core Canvas Engine
        B1 --> C1[LivingTypeEngine]
        B2 --> C2[Offscreen Canvas 2D Text Rasterizer]
        C2 --> C3[WebGL Texture Upload]
        C3 --> C4[Vertex & Fragment GLSL Shaders]
        C1 --> C4
        C4 --> D1[Rendered Viscoelastic Typography]
    end

    subgraph Arcade Engine
        B3 --> E1[ArcadeEngine]
        C2 --> E2[TextCollisionMap (O(1) Alpha Grid)]
        E2 --> E3[Continuous Orb-to-Letter Collision]
        B1 --> E4[Tensile Slingshot Physics]
        E4 --> E5[Projectile Orbs & Floating Targets]
        E5 --> E3
        E3 --> E6[Dynamic Speed Escalation & Milestones]
        E6 --> E7[Arcade HUD & Celebration Render]
    end

    subgraph Audio Engine
        B1 -.-> F1[SoundEngine (Web Audio API)]
        B2 -.-> F1
        E3 -.-> F1
        E6 -.-> F1
        F1 --> F2[Concert Grand Piano Synthesis & Acoustic Feedback]
    end
```

---

## How to Run

### Prerequisites
- Node.js (version 18 or higher)
- npm, pnpm, or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```
