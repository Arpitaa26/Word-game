# Living Type

## Technologies Used

- **React 19**: Declarative user interface, state management, and component architecture.
- **Vite 6**: Fast build tooling, bundling, and hot module replacement.
- **WebGL & Custom GLSL Shaders**: GPU-accelerated viscoelastic typography displacement, dynamic chromatic dispersion, and surface sheen rendering.
- **HTML5 Canvas 2D API**: High-resolution rasterization, offscreen texture generation, and real-time alpha mapping.
- **Web Audio API**: Procedural acoustic resonance and physical feedback synthesis.
- **Modern CSS**: Fluid typography, editorial layout architecture, and responsive styling.

---

## Flow Diagram

```mermaid
flowchart TD
    subgraph User Interaction
        A[User Input] --> B1[Pointer Move / Approach]
        A --> B2[Pointer Drag / Stretch]
        A --> B3[Pointer Tap / Ripple]
        A --> B4[Keyboard Typing / Word Selection]
        A --> B5[Material Selection]
    end

    subgraph Core Typography Engine
        B1 --> C1[LivingTypeEngine]
        B2 --> C1
        B3 --> C1
        B5 --> C1
        B4 --> C2[Offscreen Canvas 2D Text Rasterizer]
        C2 --> C3[WebGL Texture Upload]
        C3 --> C4[Vertex & Fragment GLSL Shaders]
        C1 --> C4
        C4 --> D1[Rendered Physical Typography]
    end

    subgraph Audio Feedback
        B2 -.-> E1[SoundEngine]
        B3 -.-> E1
        B4 -.-> E1
        E1 --> E2[Procedural Acoustic Feedback]
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
