/**
 * LIVING TYPE — Handcrafted Multi-Body Viscoelastic Typography Engine
 * 
 * Each glyph is an independent physical soft-body with:
 * - Center-of-mass spring anchor dynamics
 * - Non-linear hyperelastic pull & fling
 * - Sliced jelly-mass bending curvature
 * - Squash & stretch (volume conservation)
 * - Inter-glyph elastic coupling tension
 * - Acoustic shockwave impulse transmission
 * - Soft dynamic contact shadow
 */

import { soundEngine } from './sound';

export const MATERIAL_PRESETS = {
  silicone: {
    name: 'Silicone Rubber',
    description: 'Supple, bouncy elastomer with juicy squash & stretch',
    stiffness: 120.0,
    damping: 9.5,
    sliceStiffness: 180.0,
    sliceDamping: 11.0,
    coupling: 0.18,
    squashStrength: 0.75,
    maxStretch: 2.2,
    shockImpulse: 280.0,
  },
  gel: {
    name: 'Viscous Gel',
    description: 'Heavy mass with slow, wave-like lingering recoil',
    stiffness: 55.0,
    damping: 6.0,
    sliceStiffness: 90.0,
    sliceDamping: 7.0,
    coupling: 0.32,
    squashStrength: 0.50,
    maxStretch: 2.6,
    shockImpulse: 190.0,
  },
  taut: {
    name: 'Taut Spring',
    description: 'High tensile resistance with snappy instant twang',
    stiffness: 240.0,
    damping: 16.0,
    sliceStiffness: 320.0,
    sliceDamping: 18.0,
    coupling: 0.10,
    squashStrength: 0.90,
    maxStretch: 1.8,
    shockImpulse: 360.0,
  },
};

export const COLOR_THEMES = {
  obsidian: {
    name: 'Obsidian Noir',
    bg: '#0C0C0E',
    text: '#F5F4F0',
    textMuted: 'rgba(245, 244, 240, 0.4)',
    accent: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.65)',
    tether: 'rgba(245, 244, 240, 0.25)',
    wave: 'rgba(245, 244, 240, 0.35)',
  },
  alabaster: {
    name: 'Alabaster Paper',
    bg: '#F6F5F1',
    text: '#141416',
    textMuted: 'rgba(20, 20, 22, 0.4)',
    accent: '#000000',
    shadow: 'rgba(0, 0, 0, 0.12)',
    tether: 'rgba(20, 20, 22, 0.20)',
    wave: 'rgba(20, 20, 22, 0.30)',
  },
};

const NUM_SLICES = 12;

export class LivingTypeEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      text: 'CREATE',
      fontFamily: 'Syne',
      materialKey: 'silicone',
      themeKey: 'obsidian',
      onStatsUpdate: null,
      ...options,
    };

    // State
    this.text = (this.options.text || 'CREATE').toUpperCase();
    this.fontFamily = this.options.fontFamily || 'Syne';
    this.materialKey = this.options.materialKey || 'silicone';
    this.material = MATERIAL_PRESETS[this.materialKey] || MATERIAL_PRESETS.silicone;
    this.themeKey = this.options.themeKey || 'obsidian';
    this.theme = COLOR_THEMES[this.themeKey] || COLOR_THEMES.obsidian;

    // Simulation Timing
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.animFrameId = null;

    // Glyphs array
    this.glyphs = [];
    this.fontSize = 120;
    this.totalTextWidth = 0;

    // Pointer Interaction State
    this.pointer = { x: -1000, y: -1000 };
    this.prevPointer = { x: -1000, y: -1000 };
    this.pointerVelocity = { x: 0, y: 0 };
    this.isPointerInside = false;

    // Active Grab State
    this.grabbedGlyph = null;
    this.grabOffset = { x: 0, y: 0 };
    this.grabStartPos = { x: 0, y: 0 };
    this.hasMovedGrab = false;

    // Acoustic Shockwaves (Bounded ring buffer)
    this.shockwaves = [];
    this.maxShockwaves = 6;

    // Performance telemetry
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsTime = performance.now();

    // Event listeners
    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handlePointerLeave = this.onPointerLeave.bind(this);
    this.handleResize = this.onResize.bind(this);

    this.init();
  }

  init() {
    this.bindEvents();
    this.onResize();
    this.setupGlyphs();
    this.startLoop();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        this.setupGlyphs();
      });
    }
  }

  setText(newText) {
    const formatted = (newText || 'CREATE').toUpperCase();
    if (this.text !== formatted) {
      this.text = formatted;
      this.setupGlyphs();
    }
  }

  setFontFamily(newFont) {
    if (this.fontFamily !== newFont) {
      this.fontFamily = newFont;
      this.setupGlyphs();
    }
  }

  setMaterial(key) {
    if (MATERIAL_PRESETS[key]) {
      this.materialKey = key;
      this.material = MATERIAL_PRESETS[key];
    }
  }

  setTheme(key) {
    if (COLOR_THEMES[key]) {
      this.themeKey = key;
      this.theme = COLOR_THEMES[key];
    }
  }

  reset() {
    this.text = 'CREATE';
    this.materialKey = 'silicone';
    this.material = MATERIAL_PRESETS.silicone;
    this.shockwaves = [];
    this.grabbedGlyph = null;
    this.setupGlyphs();
  }

  /**
   * Pre-renders each glyph to its own high-definition offscreen canvas
   * and initializes individual spring-body coordinates.
   */
  setupGlyphs() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Dynamic Font Size Calculation
    const targetWidth = width * 0.78;
    let baseFontSize = Math.min(width * 0.22, height * 0.32);

    // Probe text measurement
    const probeCanvas = document.createElement('canvas');
    const probeCtx = probeCanvas.getContext('2d');
    let fontWeight = '700';
    let fontStyle = 'normal';
    if (this.fontFamily.toLowerCase().includes('serif')) {
      fontWeight = '400';
      fontStyle = 'italic';
    }

    probeCtx.font = `${fontStyle} ${fontWeight} ${baseFontSize}px "${this.fontFamily}", sans-serif`;
    let measuredWidth = probeCtx.measureText(this.text).width;

    if (measuredWidth > targetWidth) {
      baseFontSize = baseFontSize * (targetWidth / measuredWidth);
    }
    this.fontSize = Math.max(baseFontSize, 36);

    const fontString = `${fontStyle} ${fontWeight} ${this.fontSize}px "${this.fontFamily}", sans-serif`;
    probeCtx.font = fontString;

    // Calculate individual letter positions & bounds
    const chars = this.text.split('');
    const charMetrics = chars.map((char) => {
      const metrics = probeCtx.measureText(char);
      return {
        char,
        width: metrics.width,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || this.fontSize * 0.7,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || this.fontSize * 0.2,
      };
    });

    const letterSpacing = this.fontSize * 0.04;
    const totalW = charMetrics.reduce((sum, m) => sum + m.width, 0) + (chars.length - 1) * letterSpacing;
    this.totalTextWidth = totalW;

    let startX = (width - totalW) / 2;
    const centerY = height / 2;

    // Create or reconcile glyph objects
    this.glyphs = charMetrics.map((metric, i) => {
      const charWidth = metric.width;
      const charHeight = this.fontSize * 1.35;
      const anchorX = startX + charWidth / 2;
      const anchorY = centerY;
      startX += charWidth + letterSpacing;

      // Rasterize glyph to offscreen buffer
      const glyphBuffer = document.createElement('canvas');
      glyphBuffer.width = Math.ceil(charWidth * 1.4 * dpr);
      glyphBuffer.height = Math.ceil(charHeight * 1.4 * dpr);
      const gctx = glyphBuffer.getContext('2d');
      gctx.scale(dpr, dpr);

      gctx.font = fontString;
      gctx.textAlign = 'center';
      gctx.textBaseline = 'middle';
      gctx.fillStyle = '#FFFFFF';
      gctx.fillText(metric.char, (charWidth * 1.4) / 2, (charHeight * 1.4) / 2);

      // Slices for jelly bending curvature
      const slices = [];
      const sliceH = (charHeight * 1.4) / NUM_SLICES;
      for (let s = 0; s < NUM_SLICES; s++) {
        slices.push({
          y: s * sliceH,
          h: sliceH + 1, // 1px overlap to prevent raster seams
          dx: 0,
          dy: 0,
          vdx: 0,
          vdy: 0,
        });
      }

      return {
        char: metric.char,
        index: i,
        buffer: glyphBuffer,
        bufferWidth: charWidth * 1.4,
        bufferHeight: charHeight * 1.4,
        width: charWidth,
        height: charHeight,
        anchorX,
        anchorY,
        x: anchorX,
        y: anchorY,
        vx: 0,
        vy: 0,
        rotation: 0,
        vRotation: 0,
        scaleX: 1,
        scaleY: 1,
        vScaleX: 0,
        vScaleY: 0,
        isGrabbed: false,
        slices,
        // Entry animation offset
        entryDelay: i * 0.04,
      };
    });
  }

  triggerShockwave(x, y, customAmp = 1.0) {
    const now = (performance.now() - this.startTime) / 1000.0;
    const newWave = {
      x,
      y,
      startTime: now,
      speed: 850, // pixels per second
      maxRadius: Math.max(this.canvas.width, this.canvas.height) * 0.75,
      amplitude: customAmp,
      duration: 1.4,
      decay: 2.5,
    };

    if (this.shockwaves.length >= this.maxShockwaves) {
      this.shockwaves.shift();
    }
    this.shockwaves.push(newWave);
    soundEngine.playRipple();
  }

  triggerWave() {
    if (this.glyphs.length === 0) return;
    const firstGlyph = this.glyphs[0];
    this.triggerShockwave(firstGlyph.x - 60, firstGlyph.y, 1.3);

    this.glyphs.forEach((g, i) => {
      setTimeout(() => {
        g.vy -= 160;
        g.vRotation += (Math.random() - 0.5) * 0.35;
        for (let s = 0; s < g.slices.length; s++) {
          g.slices[s].vdy += -30;
        }
      }, i * 70);
    });
  }

  jiggle() {
    this.glyphs.forEach((g) => {
      g.vx += (Math.random() - 0.5) * 240;
      g.vy += (Math.random() - 0.5) * 240;
      g.vRotation += (Math.random() - 0.5) * 0.6;
      for (let s = 0; s < g.slices.length; s++) {
        g.slices[s].vdx += (Math.random() - 0.5) * 35;
      }
    });
    soundEngine.playRelease(2.5);
  }

  onPointerDown(e) {
    const { x, y } = this.getCanvasCoords(e);
    this.pointer = { x, y };
    this.isPointerInside = true;
    this.hasMovedGrab = false;

    // Check if clicked directly on or near a glyph
    let closestGlyph = null;
    let closestDist = Infinity;

    for (const g of this.glyphs) {
      const d = Math.hypot(x - g.x, y - g.y);
      const hitRadius = Math.max(g.width, g.height) * 0.65;
      if (d < hitRadius && d < closestDist) {
        closestDist = d;
        closestGlyph = g;
      }
    }

    if (closestGlyph) {
      this.grabbedGlyph = closestGlyph;
      closestGlyph.isGrabbed = true;
      this.grabStartPos = { x, y };
      this.grabOffset = { x: closestGlyph.x - x, y: closestGlyph.y - y };
      this.isCanvasDragging = false;
    } else {
      // Begin canvas sweep drag
      this.isCanvasDragging = true;
      this.canvasDragStart = { x, y };
      this.canvasDragMoved = 0;
    }
  }

  onPointerMove(e) {
    const { x, y } = this.getCanvasCoords(e);
    this.pointer = { x, y };
    this.isPointerInside = true;

    if (this.grabbedGlyph) {
      const dragDist = Math.hypot(x - this.grabStartPos.x, y - this.grabStartPos.y);
      if (dragDist > 4) {
        this.hasMovedGrab = true;
      }
    } else if (this.isCanvasDragging) {
      const dx = x - this.canvasDragStart.x;
      const dy = y - this.canvasDragStart.y;
      this.canvasDragMoved = Math.hypot(dx, dy);

      // Sweep across letters: apply drag wake
      for (const g of this.glyphs) {
        const d = Math.hypot(x - g.x, y - g.y);
        const sweepRadius = 180;
        if (d < sweepRadius) {
          const factor = (1 - d / sweepRadius);
          g.vx += this.pointerVelocity.x * factor * 0.25;
          g.vy += this.pointerVelocity.y * factor * 0.25;
          g.vRotation += (this.pointerVelocity.x * 0.002) * factor;
          for (let s = 0; s < g.slices.length; s++) {
            g.slices[s].vdx += this.pointerVelocity.x * factor * 0.1;
          }
        }
      }
    }
  }

  onPointerUp(e) {
    const { x, y } = this.getCanvasCoords(e);

    if (this.grabbedGlyph) {
      const g = this.grabbedGlyph;
      g.isGrabbed = false;

      if (!this.hasMovedGrab) {
        // Simple tap on glyph -> trigger local shockwave ripple!
        this.triggerShockwave(g.x, g.y);
      } else {
        // Fling / Recoil: transfer pointer velocity into spring bounce
        g.vx += this.pointerVelocity.x * 0.85;
        g.vy += this.pointerVelocity.y * 0.85;
        g.vRotation += (this.pointerVelocity.x * 0.006);
        soundEngine.playRelease(Math.hypot(this.pointerVelocity.x, this.pointerVelocity.y) * 0.05);
      }

      this.grabbedGlyph = null;
    } else if (this.isCanvasDragging) {
      this.isCanvasDragging = false;
      if (this.canvasDragMoved < 8) {
        // Click on negative space -> acoustic shockwave ripple!
        this.triggerShockwave(x, y);
      }
    }
  }

  onPointerLeave() {
    this.isPointerInside = false;
    this.isCanvasDragging = false;
    if (this.grabbedGlyph) {
      this.grabbedGlyph.isGrabbed = false;
      this.grabbedGlyph = null;
    }
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.setupGlyphs();
  }

  bindEvents() {
    const el = this.canvas;
    el.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    el.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('resize', this.handleResize);

    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  unbindEvents() {
    const el = this.canvas;
    el.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    el.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('resize', this.handleResize);
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.035);
      this.lastTime = now;

      this.updatePhysics(dt, now);
      this.render(now);
      this.updateTelemetry(now);

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  updatePhysics(dt, now) {
    if (dt <= 0) return;
    const currentTime = (now - this.startTime) / 1000.0;
    const mat = this.material;

    // Track pointer velocity
    const rawVx = (this.pointer.x - this.prevPointer.x) / dt;
    const rawVy = (this.pointer.y - this.prevPointer.y) / dt;
    this.pointerVelocity.x += (rawVx - this.pointerVelocity.x) * Math.min(dt * 18, 1);
    this.pointerVelocity.y += (rawVy - this.pointerVelocity.y) * Math.min(dt * 18, 1);
    this.prevPointer = { ...this.pointer };

    // Shockwave Propagation & Impulse Transfer
    for (const wave of this.shockwaves) {
      const elapsed = currentTime - wave.startTime;
      if (elapsed > 0 && elapsed < wave.duration) {
        const waveRadius = elapsed * wave.speed;
        const waveStrength = Math.exp(-elapsed * wave.decay) * wave.amplitude;

        for (const g of this.glyphs) {
          const dx = g.x - wave.x;
          const dy = g.y - wave.y;
          const dist = Math.hypot(dx, dy);
          const delta = Math.abs(dist - waveRadius);

          // Impulse window (when wave crest sweeps across letter center)
          const waveWidth = 70;
          if (delta < waveWidth) {
            const factor = (1 - delta / waveWidth) * waveStrength;
            const normX = dist > 0.001 ? dx / dist : 0;
            const normY = dist > 0.001 ? dy / dist : -1;

            // Direct impulse
            const impulse = mat.shockImpulse * factor * dt * 25;
            g.vx += normX * impulse;
            g.vy += normY * impulse;

            // Torque
            g.vRotation += (normX * 0.4) * factor;

            // Slices compression
            for (let s = 0; s < g.slices.length; s++) {
              g.slices[s].vdx += normX * factor * 8;
              g.slices[s].vdy += normY * factor * 8;
            }
          }
        }
      }
    }

    // Clean expired shockwaves
    this.shockwaves = this.shockwaves.filter((w) => currentTime - w.startTime < w.duration);

    // Multi-Glyph Spring Physics Simulation
    const numGlyphs = this.glyphs.length;

    for (let i = 0; i < numGlyphs; i++) {
      const g = this.glyphs[i];

      // 1. Idle Restrained Breathing
      const idleTime = currentTime * 1.8 + i * 0.45;
      const idleOffsetY = Math.sin(idleTime) * 3.5;
      const idleRot = Math.cos(idleTime * 0.8) * 0.012;

      // 2. Cursor Hover Proximity Attraction / Gaze
      let hoverForceX = 0;
      let hoverForceY = 0;
      let hoverRotTarget = 0;

      if (this.isPointerInside && !g.isGrabbed) {
        const dCursor = Math.hypot(this.pointer.x - g.x, this.pointer.y - g.y);
        const hoverRadius = 220;

        if (dCursor < hoverRadius) {
          const normD = 1 - dCursor / hoverRadius;
          const hoverPull = normD * normD * 28;
          const angleToPtr = Math.atan2(this.pointer.y - g.y, this.pointer.x - g.x);

          hoverForceX = Math.cos(angleToPtr) * hoverPull;
          hoverForceY = Math.sin(angleToPtr) * hoverPull;
          hoverRotTarget = (this.pointer.x - g.x) * 0.0008;

          // Velocity wake (stirring the letters as cursor moves fast)
          const pSpeed = Math.hypot(this.pointerVelocity.x, this.pointerVelocity.y);
          if (pSpeed > 80) {
            hoverForceX += this.pointerVelocity.x * normD * 0.08;
            hoverForceY += this.pointerVelocity.y * normD * 0.08;
          }
        }
      }

      // 3. Direct Grab or Spring Restitution
      if (g.isGrabbed) {
        // Follow pointer with hyperelastic resistance
        const targetX = this.pointer.x + this.grabOffset.x;
        const targetY = this.pointer.y + this.grabOffset.y;

        const dispX = targetX - g.anchorX;
        const dispY = targetY - g.anchorY;
        const stretchDist = Math.hypot(dispX, dispY);

        // Hyperelastic non-linear resistance clamp
        const maxDist = g.height * mat.maxStretch;
        let scaleFactor = 1.0;
        if (stretchDist > maxDist) {
          scaleFactor = maxDist / stretchDist;
        }

        g.x = g.anchorX + dispX * scaleFactor;
        g.y = g.anchorY + dispY * scaleFactor;
        g.vx = (g.x - g.anchorX) * 0.1;
        g.vy = (g.y - g.anchorY) * 0.1;

        // Dynamic tilt towards drag vector
        const dragAngle = Math.atan2(dispY, dispX);
        const tiltStrength = Math.min(stretchDist / 200, 0.45);
        g.rotation += ((dragAngle * tiltStrength) - g.rotation) * Math.min(dt * 12, 1);

        // Squash and stretch volume preservation
        const stretchRatio = Math.min(stretchDist / 180, 0.85);
        const targetScaleY = 1.0 + stretchRatio * mat.squashStrength;
        const targetScaleX = 1.0 / targetScaleY;
        g.scaleX += (targetScaleX - g.scaleX) * Math.min(dt * 15, 1);
        g.scaleY += (targetScaleY - g.scaleY) * Math.min(dt * 15, 1);

        // Displace slices towards pull point for jelly curvature
        for (let s = 0; s < g.slices.length; s++) {
          const sliceNorm = (s / (g.slices.length - 1)) - 0.5; // -0.5 to 0.5
          const targetSliceDx = sliceNorm * (dispX * 0.35);
          g.slices[s].dx += (targetSliceDx - g.slices[s].dx) * Math.min(dt * 18, 1);
        }

      } else {
        // Damped Harmonic Oscillator (Hooke's Law: F = -k·x - c·v)
        const targetX = g.anchorX + hoverForceX;
        const targetY = g.anchorY + idleOffsetY + hoverForceY;

        const k = mat.stiffness;
        const c = mat.damping;

        const ax = -k * (g.x - targetX) - c * g.vx;
        const ay = -k * (g.y - targetY) - c * g.vy;

        g.vx += ax * dt;
        g.vy += ay * dt;
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // Angular Spring
        const targetRot = idleRot + hoverRotTarget;
        const rotK = mat.stiffness * 0.8;
        const rotC = mat.damping * 0.9;
        const aRot = -rotK * (g.rotation - targetRot) - rotC * g.vRotation;
        g.vRotation += aRot * dt;
        g.rotation += g.vRotation * dt;

        // Squash & Stretch Spring Decay back to (1.0, 1.0)
        const scaleK = 180.0;
        const scaleC = 12.0;
        const aScaleX = -scaleK * (g.scaleX - 1.0) - scaleC * g.vScaleX;
        const aScaleY = -scaleK * (g.scaleY - 1.0) - scaleC * g.vScaleY;
        g.vScaleX += aScaleX * dt;
        g.vScaleY += aScaleY * dt;
        g.scaleX += g.vScaleX * dt;
        g.scaleY += g.vScaleY * dt;

        // Internal Jelly Slice Springs
        for (let s = 0; s < g.slices.length; s++) {
          const sl = g.slices[s];
          const sliceK = mat.sliceStiffness;
          const sliceC = mat.sliceDamping;
          const asx = -sliceK * sl.dx - sliceC * sl.vdx;
          const asy = -sliceK * sl.dy - sliceC * sl.vdy;
          sl.vdx += asx * dt;
          sl.vdy += asy * dt;
          sl.dx += sl.vdx * dt;
          sl.dy += sl.vdy * dt;
        }
      }

      // 4. Inter-Glyph Elastic Chain Coupling
      // Pull adjacent letters elastically when one is displaced
      if (i > 0) {
        const prev = this.glyphs[i - 1];
        const dispDiffX = (g.x - g.anchorX) - (prev.x - prev.anchorX);
        const couplingForceX = dispDiffX * mat.coupling * 20 * dt;
        if (!prev.isGrabbed) prev.vx += couplingForceX;
        if (!g.isGrabbed) g.vx -= couplingForceX;
      }
      if (i < numGlyphs - 1) {
        const next = this.glyphs[i + 1];
        const dispDiffX = (g.x - g.anchorX) - (next.x - next.anchorX);
        const couplingForceX = dispDiffX * mat.coupling * 20 * dt;
        if (!next.isGrabbed) next.vx += couplingForceX;
        if (!g.isGrabbed) g.vx -= couplingForceX;
      }
    }
  }

  render(now) {
    const { ctx, canvas } = this;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const thm = this.theme;
    const currentTime = (now - this.startTime) / 1000.0;

    // Clear background
    ctx.fillStyle = thm.bg;
    ctx.fillRect(0, 0, w, h);

    // 1. Draw Acoustic Shockwaves
    for (const wave of this.shockwaves) {
      const elapsed = currentTime - wave.startTime;
      if (elapsed > 0 && elapsed < wave.duration) {
        const r = elapsed * wave.speed;
        const alpha = Math.max(0, 1 - elapsed / wave.duration) * 0.45;

        ctx.save();
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = thm.wave;
        ctx.lineWidth = Math.max(1, 2.5 * (1 - elapsed / wave.duration));
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Draw Elastic Tether Hairlines when letters are pulled far
    for (const g of this.glyphs) {
      const disp = Math.hypot(g.x - g.anchorX, g.y - g.anchorY);
      if (disp > 15) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(g.anchorX, g.anchorY);
        // Subtle bezier curve representing spring tension
        const midX = (g.anchorX + g.x) / 2;
        const midY = (g.anchorY + g.y) / 2;
        ctx.quadraticCurveTo(midX, midY, g.x, g.y);
        ctx.strokeStyle = thm.tether;
        ctx.lineWidth = Math.max(0.5, 1.5 * Math.min(disp / 100, 1));
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Soft Dynamic Contact Shadows beneath each letter
    for (const g of this.glyphs) {
      const dispY = g.y - g.anchorY;
      const shadowY = g.anchorY + g.height * 0.45;
      const shadowScale = Math.max(0.2, 1 - Math.abs(dispY) / 300);
      const shadowAlpha = Math.max(0.04, 0.28 * shadowScale);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        g.x,
        shadowY,
        (g.width * 0.6) * shadowScale * g.scaleX,
        (this.fontSize * 0.08) * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = thm.shadow;
      ctx.globalAlpha = shadowAlpha;
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Viscoelastic Sliced Glyphs
    for (const g of this.glyphs) {
      ctx.save();

      // Transform to letter center of mass
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rotation);
      ctx.scale(g.scaleX, g.scaleY);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = g.bufferWidth;
      const bh = g.bufferHeight;
      const halfW = bw / 2;
      const halfH = bh / 2;

      // Draw each horizontal slice with internal jelly displacement
      for (const sl of g.slices) {
        const sy = sl.y;
        const sh = sl.h;

        // Destination slice position on canvas with jelly bending
        const dx = -halfW + sl.dx;
        const dy = -halfH + sy + sl.dy;

        ctx.drawImage(
          g.buffer,
          0,
          sy * dpr,
          bw * dpr,
          sh * dpr,
          dx,
          dy,
          bw,
          sh
        );
      }

      ctx.restore();
    }
  }

  updateTelemetry(now) {
    this.frameCount++;
    if (now - this.lastFpsTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;

      if (this.options.onStatsUpdate) {
        let state = 'Resting';
        let activeChar = null;

        if (this.grabbedGlyph) {
          state = `Tugging ‘${this.grabbedGlyph.char}’`;
          activeChar = this.grabbedGlyph.char;
        } else if (this.shockwaves.length > 0) {
          state = 'Shockwave Ripple';
        } else if (this.isPointerInside) {
          state = 'Viscoelastic Hover';
        }

        const totalDisp = this.glyphs.reduce(
          (sum, g) => sum + Math.hypot(g.x - g.anchorX, g.y - g.anchorY),
          0
        );

        this.options.onStatsUpdate({
          fps: this.fps,
          state,
          activeChar,
          tension: (totalDisp / (this.glyphs.length || 1)).toFixed(1),
        });
      }
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.unbindEvents();
  }
}
