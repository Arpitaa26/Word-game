import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from './shaders';
import { soundEngine } from './sound';

export const MATERIAL_PRESETS = {
  silicone: {
    name: 'Silicone',
    description: 'Soft, supple viscoelastic bounce with balanced elasticity',
    modeIndex: 0,
    hoverStrength: 0.045,
    hoverRadius: 0.35,
    dragRadius: 0.42,
    springStiffness: 85.0,
    springDamping: 9.0,
    rippleSpeed: 0.40,
    rippleAmp: 0.048,
    rippleFreq: 26.0,
    rippleDecay: 1.4,
    rippleWidth: 0.13,
    idleSpeed: 0.50,
    idleAmp: 0.85,
    chromaticDispersion: 1.0,
    sheen: 0.75,
  },
  fluidInk: {
    name: 'Fluid Gel',
    description: 'Viscous liquid vorticity, swirling currents & undulating fluid waves',
    modeIndex: 1,
    hoverStrength: 0.075,
    hoverRadius: 0.48,
    dragRadius: 0.52,
    springStiffness: 38.0,
    springDamping: 5.5,
    rippleSpeed: 0.28,
    rippleAmp: 0.085,
    rippleFreq: 18.0,
    rippleDecay: 0.85,
    rippleWidth: 0.18,
    idleSpeed: 0.65,
    idleAmp: 1.4,
    chromaticDispersion: 1.6,
    sheen: 0.95,
  },
  latexTension: {
    name: 'Tension',
    description: 'High tensile resistance with snappy, rapid elastic recoil',
    modeIndex: 2,
    hoverStrength: 0.032,
    hoverRadius: 0.26,
    dragRadius: 0.32,
    springStiffness: 160.0,
    springDamping: 14.0,
    rippleSpeed: 0.52,
    rippleAmp: 0.035,
    rippleFreq: 34.0,
    rippleDecay: 2.2,
    rippleWidth: 0.10,
    idleSpeed: 0.40,
    idleAmp: 0.55,
    chromaticDispersion: 0.6,
    sheen: 0.5,
  },
};

export const COLOR_THEMES = {
  obsidian: {
    name: 'Obsidian Noir',
    bg: [0.043, 0.043, 0.051],
    text: [0.965, 0.961, 0.949],
    accent: [0.78, 0.76, 0.72],
    hexBg: '#0B0B0D',
    hexText: '#F6F5F2',
  },
  alabaster: {
    name: 'Alabaster Paper',
    bg: [0.965, 0.961, 0.945],
    text: [0.04, 0.04, 0.045],
    accent: [0.22, 0.22, 0.22],
    hexBg: '#F6F5F1',
    hexText: '#0A0A0C',
  },
};

export class LivingTypeEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      text: 'CREATE',
      fontFamily: 'Syne',
      materialKey: 'silicone',
      themeKey: 'obsidian',
      onStatsUpdate: null,
      ...options,
    };

    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.texture = null;

    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.animFrameId = null;

    this.pointer = { x: 0.5, y: 0.5 };
    this.prevPointer = { x: 0.5, y: 0.5 };
    this.smoothPointer = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
    this.pointerVel = { x: 0, y: 0 };
    this.isPointerInside = false;
    this.pointerActive = 0.0;

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };
    this.isRecoiling = false;
    this.dragMovedDistance = 0;

    this.ripples = [];
    this.maxRipples = 8;

    this.materialKey = this.options.materialKey;
    this.material = MATERIAL_PRESETS[this.materialKey];
    this.themeKey = this.options.themeKey;
    this.theme = COLOR_THEMES[this.themeKey];

    this.text = this.options.text;
    this.fontFamily = this.options.fontFamily;

    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsUpdate = performance.now();

    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handlePointerLeave = this.onPointerLeave.bind(this);
    this.handleResize = this.onResize.bind(this);

    this.init();
  }

  init() {
    this.initWebGL();
    this.bindEvents();
    this.updateOffscreenText();
    this.onResize();
    this.startLoop();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        this.updateOffscreenText();
      });
    }
  }

  initWebGL() {
    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      this.gl = this.canvas.getContext('experimental-webgl');
    } else {
      this.gl = gl;
    }

    if (!this.gl) {
      throw new Error('[LivingType] WebGL context initialization failed');
    }

    const { gl: ctx } = this;

    const vertShader = this.compileShader(ctx.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = this.compileShader(ctx.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

    const prog = ctx.createProgram();
    ctx.attachShader(prog, vertShader);
    ctx.attachShader(prog, fragShader);
    ctx.linkProgram(prog);

    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
      const err = ctx.getProgramInfoLog(prog);
      ctx.deleteProgram(prog);
      throw new Error(`[LivingType] Program link error: ${err}`);
    }

    this.program = prog;
    ctx.useProgram(prog);

    const positionBuffer = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, positionBuffer);
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    ctx.bufferData(ctx.ARRAY_BUFFER, quadVertices, ctx.STATIC_DRAW);

    const aPos = ctx.getAttribLocation(prog, 'a_position');
    ctx.enableVertexAttribArray(aPos);
    ctx.vertexAttribPointer(aPos, 2, ctx.FLOAT, false, 0, 0);

    this.cacheUniforms();

    this.texture = ctx.createTexture();
    ctx.bindTexture(ctx.TEXTURE_2D, this.texture);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
  }

  compileShader(type, source) {
    const { gl } = this;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`[LivingType] Shader compilation error: ${err}`);
    }
    return shader;
  }

  cacheUniforms() {
    const { gl, program } = this;
    this.uniforms = {
      u_texture: gl.getUniformLocation(program, 'u_texture'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_pointer: gl.getUniformLocation(program, 'u_pointer'),
      u_pointer_vel: gl.getUniformLocation(program, 'u_pointer_vel'),
      u_pointer_active: gl.getUniformLocation(program, 'u_pointer_active'),
      u_hover_radius: gl.getUniformLocation(program, 'u_hover_radius'),
      u_hover_strength: gl.getUniformLocation(program, 'u_hover_strength'),
      u_drag_origin: gl.getUniformLocation(program, 'u_drag_origin'),
      u_drag_offset: gl.getUniformLocation(program, 'u_drag_offset'),
      u_drag_radius: gl.getUniformLocation(program, 'u_drag_radius'),
      u_drag_active: gl.getUniformLocation(program, 'u_drag_active'),
      u_ripple_count: gl.getUniformLocation(program, 'u_ripple_count'),
      u_idle_speed: gl.getUniformLocation(program, 'u_idle_speed'),
      u_idle_amp: gl.getUniformLocation(program, 'u_idle_amp'),
      u_chromatic_dispersion: gl.getUniformLocation(program, 'u_chromatic_dispersion'),
      u_sheen: gl.getUniformLocation(program, 'u_sheen'),
      u_color_bg: gl.getUniformLocation(program, 'u_color_bg'),
      u_color_text: gl.getUniformLocation(program, 'u_color_text'),
      u_color_accent: gl.getUniformLocation(program, 'u_color_accent'),
      u_material_mode: gl.getUniformLocation(program, 'u_material_mode'),
    };

    this.rippleUniforms = [];
    for (let i = 0; i < this.maxRipples; i++) {
      this.rippleUniforms.push({
        origin: gl.getUniformLocation(program, `u_ripples[${i}].origin`),
        startTime: gl.getUniformLocation(program, `u_ripples[${i}].startTime`),
        speed: gl.getUniformLocation(program, `u_ripples[${i}].speed`),
        amplitude: gl.getUniformLocation(program, `u_ripples[${i}].amplitude`),
        frequency: gl.getUniformLocation(program, `u_ripples[${i}].frequency`),
        decay: gl.getUniformLocation(program, `u_ripples[${i}].decay`),
        width: gl.getUniformLocation(program, `u_ripples[${i}].width`),
        duration: gl.getUniformLocation(program, `u_ripples[${i}].duration`),
      });
    }
  }

  updateOffscreenText() {
    const width = this.canvas.width || window.innerWidth * 2;
    const height = this.canvas.height || window.innerHeight * 2;

    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, width, height);

    const textToRender = (this.text || 'CREATE').trim();

    let fontWeight = '700';
    let fontStyle = 'normal';
    let letterSpacing = '-0.04em';

    if (this.fontFamily.toLowerCase().includes('serif')) {
      fontWeight = '400';
      fontStyle = 'italic';
      letterSpacing = '-0.02em';
    } else if (this.fontFamily.toLowerCase().includes('space')) {
      fontWeight = '700';
      letterSpacing = '0.02em';
    }

    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = letterSpacing;
    }

    const targetWidth = width * 0.72;
    let fontSize = Math.min(width * 0.22, height * 0.35);

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${this.fontFamily}", sans-serif`;
    let measured = ctx.measureText(textToRender).width;

    if (measured > targetWidth) {
      fontSize = fontSize * (targetWidth / measured);
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${this.fontFamily}", sans-serif`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillText(textToRender, centerX, centerY);

    const { gl } = this;
    if (gl && this.texture) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreenCanvas);
    }
  }

  setText(newText) {
    if (this.text !== newText) {
      this.text = newText;
      this.updateOffscreenText();
    }
  }

  setFontFamily(newFont) {
    if (this.fontFamily !== newFont) {
      this.fontFamily = newFont;
      this.updateOffscreenText();
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

  triggerRipple(x, y, customOpts = {}) {
    const currentTime = (performance.now() - this.startTime) / 1000.0;
    const mat = this.material;

    const newRipple = {
      x,
      y,
      startTime: currentTime,
      speed: customOpts.speed || mat.rippleSpeed,
      amplitude: customOpts.amplitude || mat.rippleAmp,
      frequency: customOpts.frequency || mat.rippleFreq,
      decay: customOpts.decay || mat.rippleDecay,
      width: customOpts.width || mat.rippleWidth,
      duration: 3.2,
    };

    if (this.ripples.length >= this.maxRipples) {
      this.ripples.shift();
    }
    this.ripples.push(newRipple);
    soundEngine.playRipple(x);
  }

  reset() {
    this.text = 'CREATE';
    this.materialKey = 'silicone';
    this.material = MATERIAL_PRESETS.silicone;
    this.ripples = [];
    this.dragOffset = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.isRecoiling = false;
    this.smoothPointer = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
    this.pointerVel = { x: 0, y: 0 };
    this.updateOffscreenText();
  }

  bindEvents() {
    const el = this.canvas;
    el.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    el.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    window.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    el.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('resize', this.handleResize);

    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  unbindEvents() {
    const el = this.canvas;
    el.removeEventListener('pointermove', this.handlePointerMove);
    el.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    el.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('resize', this.handleResize);
  }

  getNormalizedCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return { x, y };
  }

  onPointerMove(e) {
    const coords = this.getNormalizedCoords(e);
    this.pointer = coords;
    this.isPointerInside = true;

    if (this.isDragging) {
      const dx = coords.x - this.dragStart.x;
      const dy = coords.y - this.dragStart.y;
      this.dragOffset.x = dx;
      this.dragOffset.y = dy;
      this.dragMovedDistance += Math.hypot(dx, dy);
    }
  }

  onPointerDown(e) {
    const coords = this.getNormalizedCoords(e);
    this.isDragging = true;
    this.isRecoiling = false;
    this.dragStart = coords;
    this.dragOffset = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };
    this.dragMovedDistance = 0;
  }

  onPointerUp(e) {
    if (this.isDragging) {
      const coords = this.getNormalizedCoords(e);
      this.isDragging = false;

      if (this.dragMovedDistance < 0.015) {
        this.triggerRipple(coords.x, coords.y);
        this.dragOffset = { x: 0, y: 0 };
        this.dragVelocity = { x: 0, y: 0 };
        this.isRecoiling = false;
      } else {
        this.isRecoiling = true;
        this.dragVelocity.x = this.pointerVel.x * 0.5;
        this.dragVelocity.y = this.pointerVel.y * 0.5;
        soundEngine.playRelease(Math.hypot(this.pointerVel.x, this.pointerVel.y));
      }
    }
  }

  onPointerLeave() {
    this.isPointerInside = false;
  }

  onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    this.updateOffscreenText();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.05);
      this.lastTime = now;

      this.updatePhysics(dt);
      this.render(now);
      this.updateTelemetry(now);

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  updatePhysics(dt) {
    if (dt <= 0) return;

    const springK = 20.0;
    const dampingC = 6.8;

    const fx = (this.pointer.x - this.smoothPointer.x) * springK - this.smoothPointer.vx * dampingC;
    const fy = (this.pointer.y - this.smoothPointer.y) * springK - this.smoothPointer.vy * dampingC;

    this.smoothPointer.vx += fx * dt;
    this.smoothPointer.vy += fy * dt;
    this.smoothPointer.x += this.smoothPointer.vx * dt;
    this.smoothPointer.y += this.smoothPointer.vy * dt;

    const rawVx = (this.pointer.x - this.prevPointer.x) / dt;
    const rawVy = (this.pointer.y - this.prevPointer.y) / dt;
    this.pointerVel.x += (rawVx - this.pointerVel.x) * Math.min(dt * 8, 1);
    this.pointerVel.y += (rawVy - this.pointerVel.y) * Math.min(dt * 8, 1);
    this.prevPointer = { ...this.pointer };

    const targetActive = this.isPointerInside ? 1.0 : 0.0;
    this.pointerActive += (targetActive - this.pointerActive) * Math.min(dt * 3.8, 1.0);

    if (this.isRecoiling) {
      const k = this.material.springStiffness;
      const c = this.material.springDamping;

      const ax = -k * this.dragOffset.x - c * this.dragVelocity.x;
      const ay = -k * this.dragOffset.y - c * this.dragVelocity.y;

      this.dragVelocity.x += ax * dt;
      this.dragVelocity.y += ay * dt;

      this.dragOffset.x += this.dragVelocity.x * dt;
      this.dragOffset.y += this.dragVelocity.y * dt;

      const speed = Math.hypot(this.dragVelocity.x, this.dragVelocity.y);
      const dist = Math.hypot(this.dragOffset.x, this.dragOffset.y);
      if (speed < 0.001 && dist < 0.0005) {
        this.dragOffset = { x: 0, y: 0 };
        this.dragVelocity = { x: 0, y: 0 };
        this.isRecoiling = false;
      }
    }

    const currentTime = (performance.now() - this.startTime) / 1000.0;
    this.ripples = this.ripples.filter((r) => currentTime - r.startTime < r.duration);
  }

  render(now) {
    const { gl, uniforms } = this;
    if (!gl || !this.program) return;

    gl.useProgram(this.program);

    const currentTime = (now - this.startTime) / 1000.0;
    const mat = this.material;
    const thm = this.theme;

    gl.uniform2f(uniforms.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(uniforms.u_time, currentTime);

    gl.uniform2f(uniforms.u_pointer, this.smoothPointer.x, this.smoothPointer.y);
    gl.uniform2f(uniforms.u_pointer_vel, this.pointerVel.x * 0.05, this.pointerVel.y * 0.05);
    gl.uniform1f(uniforms.u_pointer_active, this.pointerActive);
    gl.uniform1f(uniforms.u_hover_radius, mat.hoverRadius);
    gl.uniform1f(uniforms.u_hover_strength, mat.hoverStrength);

    const isDragActive = this.isDragging || this.isRecoiling;
    gl.uniform2f(uniforms.u_drag_origin, this.dragStart.x, this.dragStart.y);
    gl.uniform2f(uniforms.u_drag_offset, this.dragOffset.x, this.dragOffset.y);
    gl.uniform1f(uniforms.u_drag_radius, mat.dragRadius);
    gl.uniform1f(uniforms.u_drag_active, isDragActive ? 1.0 : 0.0);

    gl.uniform1i(uniforms.u_ripple_count, this.ripples.length);
    for (let i = 0; i < this.maxRipples; i++) {
      const u = this.rippleUniforms[i];
      if (i < this.ripples.length) {
        const r = this.ripples[i];
        gl.uniform2f(u.origin, r.x, r.y);
        gl.uniform1f(u.startTime, r.startTime);
        gl.uniform1f(u.speed, r.speed);
        gl.uniform1f(u.amplitude, r.amplitude);
        gl.uniform1f(u.frequency, r.frequency);
        gl.uniform1f(u.decay, r.decay);
        gl.uniform1f(u.width, r.width);
        gl.uniform1f(u.duration, r.duration);
      } else {
        gl.uniform1f(u.startTime, -999.0);
      }
    }

    gl.uniform1i(uniforms.u_material_mode, mat.modeIndex !== undefined ? mat.modeIndex : 0);
    gl.uniform1f(uniforms.u_idle_speed, mat.idleSpeed);
    gl.uniform1f(uniforms.u_idle_amp, mat.idleAmp);
    gl.uniform1f(uniforms.u_chromatic_dispersion, mat.chromaticDispersion);
    gl.uniform1f(uniforms.u_sheen, mat.sheen);

    gl.uniform3f(uniforms.u_color_bg, thm.bg[0], thm.bg[1], thm.bg[2]);
    gl.uniform3f(uniforms.u_color_text, thm.text[0], thm.text[1], thm.text[2]);
    gl.uniform3f(uniforms.u_color_accent, thm.accent[0], thm.accent[1], thm.accent[2]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(uniforms.u_texture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  updateTelemetry(now) {
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      if (this.options.onStatsUpdate) {
        let state = 'Resting';
        if (this.isDragging) state = 'Tensile Drag';
        else if (this.isRecoiling) state = 'Spring Recoil';
        else if (this.ripples.length > 0) state = 'Harmonic Wave';
        else if (this.isPointerInside) state = 'Attraction';

        this.options.onStatsUpdate({
          fps: this.fps,
          state,
          ripples: this.ripples.length,
          strain: (Math.hypot(this.dragOffset.x, this.dragOffset.y) * 100).toFixed(1),
        });
      }
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.unbindEvents();

    const { gl } = this;
    if (gl) {
      if (this.texture) gl.deleteTexture(this.texture);
      if (this.program) gl.deleteProgram(this.program);
    }
  }
}
