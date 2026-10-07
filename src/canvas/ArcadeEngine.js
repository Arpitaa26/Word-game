import { TextCollisionMap } from './collisionMap';
import { soundEngine } from './sound';

const STORAGE_KEY = 'living_type_arcade_highscore';
const MILESTONES = [500, 1000, 1500, 2000, 3000, 5000, 10000];

export class ArcadeEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      themeKey: 'obsidian',
      text: 'CREATE',
      mode: 'blitz',
      onScoreUpdate: null,
      onComboUpdate: null,
      onTimerUpdate: null,
      onGameOver: null,
      onSpellProgress: null,
      onWordComplete: null,
      onMilestoneReached: null,
      ...options,
    };

    this.collisionMap = new TextCollisionMap(180, 100);

    this.highScore = 0;
    try {
      this.highScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch {
      this.highScore = 0;
    }

    this.mode = this.options.mode;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.timer = 60.0;
    this.isGameOver = false;
    this.collectedLetters = [];

    this.milestonesReached = new Set();
    this.survivalScoreTimer = 0;

    this.gameSpeed = 1.0;
    this.gameTimeElapsed = 0;
    this.lastSpeedTier = 1.0;
    this.orbSpawnTimer = 0;

    this.orbs = [];
    this.targets = [];
    this.particles = [];
    this.popups = [];
    this.celebrationParticles = [];
    this.handledRipples = new Set();

    this.wasDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragOffset = { x: 0, y: 0 };

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.lastTime = performance.now();
    this.animId = null;

    this.init();
  }

  init() {
    this.resize();
    this.resetGame();
    this.startLoop();
  }

  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.options.mode = mode;
      this.resetGame();
    }
  }

  setText(text) {
    this.options.text = text;
    if (this.mode === 'spell') {
      this.resetGame();
    }
  }

  setTheme(themeKey) {
    this.options.themeKey = themeKey;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.initTargets();
  }

  resetGame() {
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.timer = 60.0;
    this.isGameOver = false;
    this.orbs = [];
    this.particles = [];
    this.popups = [];
    this.celebrationParticles = [];
    this.collectedLetters = [];
    this.milestonesReached.clear();
    this.handledRipples.clear();
    this.survivalScoreTimer = 0;
    this.gameSpeed = 1.0;
    this.gameTimeElapsed = 0;
    this.lastSpeedTier = 1.0;
    this.orbSpawnTimer = 0;

    this.initTargets();

    const startOrbs = this.mode === 'pinball' ? 5 : 4;
    for (let i = 0; i < startOrbs; i++) {
      this.spawnOrb();
    }

    this.syncCallbacks();
  }

  syncCallbacks() {
    if (this.options.onScoreUpdate) {
      this.options.onScoreUpdate(this.score, this.highScore);
    }
    if (this.options.onComboUpdate) {
      this.options.onComboUpdate(this.combo, this.comboTimer / 2.5);
    }
    if (this.options.onTimerUpdate) {
      this.options.onTimerUpdate(this.timer);
    }
    if (this.options.onSpellProgress) {
      this.options.onSpellProgress([...this.collectedLetters]);
    }
    if (this.options.onSpeedUpdate) {
      this.options.onSpeedUpdate(this.gameSpeed);
    }
  }

  initTargets() {
    this.targets = [];
    const w = this.width;
    const h = this.height;
    const isAlabaster = this.options.themeKey === 'alabaster';

    if (this.mode === 'spell') {
      const chars = (this.options.text || 'CREATE').toUpperCase().split('');
      const count = chars.length;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const baseSpan = Math.min(w, h);
        const rx = Math.min(w * 0.38, baseSpan * 0.44);
        const ry = Math.min(h * 0.28, baseSpan * 0.38);
        const cx = w * 0.5 + Math.cos(angle) * rx;
        const cy = h * 0.5 + Math.sin(angle) * ry;

        this.targets.push({
          id: i,
          type: 'letter',
          char: chars[i],
          letterIndex: i,
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          mass: 1.2,
          radius: 25,
          angle,
          orbitSpeed: 0.10,
          color: isAlabaster ? '#0A0A0C' : '#FFFFFF',
          isHit: false,
          respawnTimer: 0,
        });
      }
    } else {
      const count = this.mode === 'blitz' ? 7 : 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const distRatio = 0.34 + (i % 2 === 0 ? 0.08 : -0.06);
        const cx = w * 0.5 + Math.cos(angle) * (w * distRatio);
        const cy = h * 0.5 + Math.sin(angle) * (h * distRatio);

        const isGold = i % 3 === 0;
        const isStar = i === 1 || i === 4;

        this.targets.push({
          id: i,
          type: isStar ? 'star' : (isGold ? 'gold' : 'normal'),
          points: isStar ? 300 : (isGold ? 150 : 75),
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          mass: isStar ? 1.4 : (isGold ? 1.2 : 1.0),
          radius: isStar ? 24 : (isGold ? 22 : 20),
          angle,
          orbitSpeed: (0.07 + (i % 3) * 0.03) * (i % 2 === 0 ? 1 : -1),
          color: isAlabaster ? '#0A0A0C' : '#FFFFFF',
          isHit: false,
          respawnTimer: 0,
        });
      }
    }
  }

  spawnOrb(customX, customY, customVx, customVy, isProjectile = false) {
    const w = this.width;
    const h = this.height;

    const x = customX !== undefined ? customX : w * (0.25 + Math.random() * 0.5);
    const y = customY !== undefined ? customY : h * 0.18;
    const vx = customVx !== undefined ? customVx : (Math.random() - 0.5) * 150;
    const vy = customVy !== undefined ? customVy : (Math.random() * 50 + 40);

    const isAlabaster = this.options.themeKey === 'alabaster';
    const color = isProjectile
      ? (isAlabaster ? '#111115' : '#FFFFFF')
      : (isAlabaster ? '#222228' : '#F6F5F2');

    const newOrb = {
      id: Math.random(),
      x,
      y,
      vx,
      vy,
      radius: isProjectile ? 10 : (13 + Math.random() * 4),
      color,
      isProjectile,
      trail: [],
      life: isProjectile ? 4.5 : 9999,
    };

    this.orbs.push(newOrb);
    if (this.orbs.length > 16) {
      this.orbs.shift();
    }
  }

  addPopup(x, y, textVal, color = '#FFFFFF', scale = 1.0, life = 1.2) {
    this.popups.push({
      x,
      y,
      text: textVal,
      color,
      alpha: 1.0,
      scale,
      vy: -40,
      life,
    });
  }

  addParticles(x, y, count = 12, color = '#FFFFFF') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color,
        alpha: 1.0,
        life: Math.random() * 0.5 + 0.35,
      });
    }
  }

  spawnCelebrationParticles(count = 140) {
    const CELEBRATION_COLORS = [
      '#FFD700',
      '#FF3B30',
      '#00D2FF',
      '#00E676',
      '#FF9F0A',
      '#AF52DE',
      '#FF2D55',
      '#FFFFFF',
    ];

    const w = this.width;
    for (let i = 0; i < count; i++) {
      this.celebrationParticles.push({
        x: w * (0.05 + Math.random() * 0.9),
        y: -15 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 320,
        vy: Math.random() * -180 - 40,
        gravity: Math.random() * 60 + 90,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 3.5 + 2.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 7,
        size: Math.random() * 7 + 5,
        aspect: Math.random() * 0.5 + 0.4,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        life: Math.random() * 1.5 + 3.2,
        maxLife: 4.5,
        opacity: 1.0,
      });
    }
  }

  addScore(pts) {
    this.score += pts;

    for (const m of MILESTONES) {
      if (this.score >= m && !this.milestonesReached.has(m)) {
        this.milestonesReached.add(m);
        this.triggerMilestone(m);
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(STORAGE_KEY, this.score.toString());
      } catch {
}
    }

    this.syncCallbacks();
  }

  triggerMilestone(m) {
    soundEngine.playMilestone(m);
    this.spawnCelebrationParticles(140);

    const bannerTitle = m >= 1000
      ? `🏆 ${m.toLocaleString()} PTS! WORD GAME MASTER!`
      : `🎉 ${m} PTS MILESTONE! ELASTIC PRO!`;

    this.addPopup(this.width * 0.5, this.height * 0.32, bannerTitle, '#FFD700', 1.6, 2.5);

    if (this.options.onMilestoneReached) {
      this.options.onMilestoneReached(m);
    }
  }

  triggerTargetHit(tgt, hitX, hitY, isWave = false) {
    tgt.isHit = true;
    tgt.respawnTimer = this.mode === 'spell' ? 9999 : 1.2;

    const nextCombo = Math.min(this.combo + 1, 10);
    this.combo = nextCombo;
    this.comboTimer = 2.5;

    soundEngine.playTargetHit(tgt, nextCombo);

    const isAlabaster = this.options.themeKey === 'alabaster';
    const accentColor = isAlabaster ? '#111' : '#FFF';

    this.addParticles(hitX, hitY, 16, accentColor);

    if (this.mode === 'spell') {
      if (!this.collectedLetters.includes(tgt.letterIndex)) {
        this.collectedLetters.push(tgt.letterIndex);

        const pts = 150 * nextCombo;
        this.addScore(pts);
        this.addPopup(hitX, hitY - 30, `+${pts} [${tgt.char}]`, accentColor);

        const totalChars = (this.options.text || 'CREATE').length;
        if (this.collectedLetters.length >= totalChars) {
          soundEngine.playWordComplete();
          this.spawnCelebrationParticles(180);
          const wordBonus = 2500 * nextCombo;
          this.addScore(wordBonus);
          this.addPopup(this.width * 0.5, this.height * 0.4, `WORD COMPLETE! +${wordBonus}`, '#FFD700', 1.6, 2.5);

          if (this.options.onWordComplete) {
            this.options.onWordComplete();
          }
        }
      }
    } else {
      const basePts = tgt.points || 75;
      const awarded = basePts * nextCombo;
      this.addScore(awarded);

      if (this.mode === 'blitz' && !this.isGameOver) {
        this.timer = Math.min(this.timer + (nextCombo > 3 ? 2.5 : 1.2), 99.0);
      }

      const comboText = nextCombo > 1 ? ` (${nextCombo}x)` : '';
      const popLabel = isWave ? `WAVE! +${awarded}${comboText}` : `+${awarded}${comboText}`;
      this.addPopup(hitX, hitY - 26, popLabel, accentColor);
    }

    this.syncCallbacks();
  }

  update(dt, now, engine) {
    if (dt <= 0) return;

    if (!this.isGameOver) {
      this.gameTimeElapsed += dt;

      const calculatedSpeed = 1.0 + (this.gameTimeElapsed * 0.012) + (this.score / 2500) * 0.35;
      this.gameSpeed = Math.min(Math.max(calculatedSpeed, 1.0), 2.2);

      const currentTier = Math.floor(this.gameSpeed * 5) / 5;
      if (currentTier > this.lastSpeedTier && currentTier >= 1.2) {
        this.lastSpeedTier = currentTier;
        this.addPopup(
          this.width * 0.5,
          this.height * 0.36,
          `⚡ SPEED UP! ${currentTier.toFixed(1)}X`,
          '#00F0FF',
          1.5,
          2.0
        );
        soundEngine.playPianoNote(880.00, 0.85, 1.2);
        setTimeout(() => {
          soundEngine.playPianoNote(1046.50, 0.9, 1.0);
        }, 80);
      }

      if (this.options.onSpeedUpdate) {
        this.options.onSpeedUpdate(this.gameSpeed);
      }

      this.survivalScoreTimer += dt;
      const tickInterval = 0.25 / this.gameSpeed;
      if (this.survivalScoreTimer >= tickInterval) {
        this.survivalScoreTimer = 0;
        const pts = Math.round(3 * this.gameSpeed);
        this.addScore(pts);
      }
    }

    if (engine) {
      if (engine.offscreenCanvas && engine.offscreenCanvas.width > 0) {
        this.collisionMap.update(engine.offscreenCanvas);
      }

      if (engine.ripples && engine.ripples.length > 0) {
        const w = this.width;
        const h = this.height;
        engine.ripples.forEach((r) => {
          const rippleAge = (now - engine.startTime) / 1000.0 - r.startTime;
          if (rippleAge > 0 && rippleAge < 0.25) {
            const rippleKey = `${r.startTime.toFixed(2)}_${r.x.toFixed(2)}`;
            if (!this.handledRipples.has(rippleKey)) {
              this.handledRipples.add(rippleKey);
              soundEngine.playShockwaveBurst();

              const rx = r.x * w;
              const ry = r.y * h;
              this.addParticles(rx, ry, 14, this.options.themeKey === 'alabaster' ? '#333' : '#FFF');
              this.addPopup(rx, ry - 20, 'SHOCKWAVE!', this.options.themeKey === 'alabaster' ? '#111' : '#FFF');

              this.orbs.forEach((orb) => {
                const dx = orb.x - rx;
                const dy = orb.y - ry;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < w * 0.45) {
                  const blastForce = (1.0 - dist / (w * 0.45)) * 480;
                  orb.vx += (dx / dist) * blastForce;
                  orb.vy += (dy / dist) * blastForce;
                }
              });

              this.targets.forEach((tgt) => {
                const dx = tgt.x - rx;
                const dy = tgt.y - ry;
                const dist = Math.hypot(dx, dy) || 1;
                const blastRadius = w * 0.46;
                if (dist < blastRadius) {
                  const force = (1.0 - dist / blastRadius) * 580;
                  tgt.vx += (dx / dist) * force;
                  tgt.vy += (dy / dist) * force;
                }

                if (!tgt.isHit && dist < tgt.radius + 55) {
                  this.triggerTargetHit(tgt, tgt.x, tgt.y, true);
                }
              });
            }
          }
        });
      }

      if (this.wasDragging && !engine.isDragging) {
        const dragDist = Math.hypot(this.dragOffset.x, this.dragOffset.y);
        const pixelDragX = this.dragOffset.x * this.width;
        const pixelDragY = this.dragOffset.y * this.height;
        const dragDistPx = Math.hypot(pixelDragX, pixelDragY);

        if (dragDist > 0.015 || dragDistPx > 15) {
          const launchSpeed = Math.min(Math.max(dragDistPx * 15.0, 1600), 3400) * (1.0 + (this.gameSpeed - 1.0) * 0.45);
          const aimAngle = Math.atan2(-pixelDragY, -pixelDragX);
          const aimVx = Math.cos(aimAngle) * launchSpeed;
          const aimVy = Math.sin(aimAngle) * launchSpeed;

          const launchX = (this.dragStart.x + this.dragOffset.x) * this.width;
          const launchY = (this.dragStart.y + this.dragOffset.y) * this.height;

          soundEngine.playSlingshotLaunch(Math.min(dragDistPx / 15, 12));
          this.spawnOrb(launchX, launchY, aimVx, aimVy, true);
          this.addPopup(launchX, launchY - 25, 'MAX SPEED SNAP!', '#00F0FF', 1.6, 2.0);
          this.addParticles(launchX, launchY, 16, this.options.themeKey === 'alabaster' ? '#00A0B0' : '#00F0FF');

          this.orbs.forEach((orb) => {
            const dx = orb.x - launchX;
            const dy = orb.y - launchY;
            const dist = Math.hypot(dx, dy);
            if (dist < this.width * 0.35) {
              orb.vx += aimVx * 0.7;
              orb.vy += aimVy * 0.7;
            }
          });

          this.targets.forEach((tgt) => {
            const dx = tgt.x - launchX;
            const dy = tgt.y - launchY;
            const dist = Math.hypot(dx, dy);
            if (dist < this.width * 0.35) {
              tgt.vx += aimVx * 0.5;
              tgt.vy += aimVy * 0.5;
            }
          });
        }
      }

      this.wasDragging = engine.isDragging;
      this.dragStart = { ...engine.dragStart };
      this.dragOffset = { ...engine.dragOffset };
    }

    if (this.mode === 'blitz' && !this.isGameOver) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
        this.isGameOver = true;
        if (this.options.onGameOver) {
          this.options.onGameOver(true);
        }
      }
      if (this.options.onTimerUpdate) {
        this.options.onTimerUpdate(this.timer);
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
        if (this.options.onComboUpdate) {
          this.options.onComboUpdate(1, 0);
        }
      } else {
        if (this.options.onComboUpdate) {
          this.options.onComboUpdate(this.combo, this.comboTimer / 2.5);
        }
      }
    }

    const dragOffsetX = engine?.dragOffset?.x || 0;
    const dragOffsetY = engine?.dragOffset?.y || 0;
    const dragVelX = (engine?.dragVelocity?.x || 0) * this.width;
    const dragVelY = (engine?.dragVelocity?.y || 0) * this.height;

    const simDt = dt * this.gameSpeed;
    const gravity = (this.mode === 'pinball' ? 140 : 80) * (0.85 + this.gameSpeed * 0.15);

    this.targets.forEach((tgt) => {
      tgt.vy += (gravity * 0.7) * simDt;

      if (engine?.isRecoiling || engine?.isDragging) {
        tgt.vx += dragVelX * 0.4;
        tgt.vy += dragVelY * 0.4;
      }

      if (engine?.isPointerInside && engine?.pointer) {
        const px = engine.pointer.x * this.width;
        const py = engine.pointer.y * this.height;
        const pDist = Math.hypot(tgt.x - px, tgt.y - py);
        const touchRadius = tgt.radius + 36;
        if (pDist < touchRadius && pDist > 0.001) {
          const pnx = (tgt.x - px) / pDist;
          const pny = (tgt.y - py) / pDist;
          const pushForce = (1.0 - pDist / touchRadius) * 450;
          tgt.vx += pnx * pushForce;
          tgt.vy += pny * pushForce;
        }
      }

      const currentSpeed = Math.hypot(tgt.vx, tgt.vy);
      if (currentSpeed > 450) {
        tgt.vx *= 0.99;
        tgt.vy *= 0.99;
      }

      tgt.x += tgt.vx * simDt;
      tgt.y += tgt.vy * simDt;

      const pad = tgt.radius + 8;
      if (tgt.x < pad) {
        tgt.x = pad;
        tgt.vx = Math.max(Math.abs(tgt.vx) * 0.92, 120);
      } else if (tgt.x > this.width - pad) {
        tgt.x = this.width - pad;
        tgt.vx = -Math.max(Math.abs(tgt.vx) * 0.92, 120);
      }

      if (tgt.y < pad + 60) {
        tgt.y = pad + 60;
        tgt.vy = Math.max(Math.abs(tgt.vy) * 0.92, 100);
      } else if (tgt.y > this.height - pad - 60) {
        tgt.y = this.height - pad - 60;
        tgt.vy = -Math.max(Math.abs(tgt.vy) * 0.95, 210);
        if (Math.abs(tgt.vx) < 40) {
          tgt.vx = (Math.random() - 0.5) * 160;
        }
      }

      const normX = tgt.x / this.width;
      const normY = tgt.y / this.height;
      const normRadius = tgt.radius / this.width;

      const col = this.collisionMap.testCircle(normX, normY, normRadius, dragOffsetX, dragOffsetY);
      if (col.hit && col.normal) {
        tgt.x += col.normal.x * (col.depth * this.width + 1.5);
        tgt.y += col.normal.y * (col.depth * this.height + 1.5);

        const vdotn = tgt.vx * col.normal.x + tgt.vy * col.normal.y;
        if (vdotn < 0) {
          tgt.vx -= 1.8 * vdotn * col.normal.x;
          tgt.vy -= 1.8 * vdotn * col.normal.y;

          if (engine?.isRecoiling || engine?.isDragging) {
            tgt.vx += dragVelX * 1.2;
            tgt.vy += dragVelY * 1.2;
          }

          this.addParticles(tgt.x, tgt.y, 4, tgt.color);
        } else {
          tgt.vx += col.normal.x * 120 + (Math.random() - 0.5) * 60;
          tgt.vy += col.normal.y * 120 - 60;
        }
      }

      const postSpeed = Math.hypot(tgt.vx, tgt.vy);
      const minCruisingSpeed = (this.mode === 'pinball' ? 140 : 110) * (0.9 + this.gameSpeed * 0.12);
      const maxSpeed = 1200 * this.gameSpeed;

      if (postSpeed < minCruisingSpeed) {
        if (postSpeed > 0.1) {
          const boost = minCruisingSpeed / postSpeed;
          tgt.vx *= boost;
          tgt.vy *= boost;
        } else {
          tgt.vx = (Math.random() - 0.5) * 160;
          tgt.vy = -160;
        }
      } else if (postSpeed > maxSpeed) {
        const clamp = maxSpeed / postSpeed;
        tgt.vx *= clamp;
        tgt.vy *= clamp;
      }

      if (tgt.respawnTimer > 0) {
        tgt.respawnTimer -= dt;
        if (tgt.respawnTimer <= 0) {
          tgt.isHit = false;
        }
      }
    });

    const targetCount = this.targets.length;
    for (let i = 0; i < targetCount; i++) {
      const tgtA = this.targets[i];
      if (tgtA.isHit && this.mode === 'spell') continue;
      for (let j = i + 1; j < targetCount; j++) {
        const tgtB = this.targets[j];
        if (tgtB.isHit && this.mode === 'spell') continue;
        const dx = tgtB.x - tgtA.x;
        const dy = tgtB.y - tgtA.y;
        const dist = Math.hypot(dx, dy);
        const minDist = tgtA.radius + tgtB.radius;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist + 1.0;
          tgtA.x -= nx * overlap * 0.5;
          tgtA.y -= ny * overlap * 0.5;
          tgtB.x += nx * overlap * 0.5;
          tgtB.y += ny * overlap * 0.5;

          const kx = tgtA.vx - tgtB.vx;
          const ky = tgtA.vy - tgtB.vy;
          const p = nx * kx + ny * ky;
          if (p > 0) {
            tgtA.vx -= p * nx * 1.05;
            tgtA.vy -= p * ny * 1.05;
            tgtB.vx += p * nx * 1.05;
            tgtB.vy += p * ny * 1.05;
          }
        }
      }
    }

    this.orbs = this.orbs.filter((orb) => {
      orb.life -= dt;
      return orb.life > 0;
    });

    const orbCount = this.orbs.length;
    for (let i = 0; i < orbCount; i++) {
      const orbA = this.orbs[i];
      for (let j = i + 1; j < orbCount; j++) {
        const orbB = this.orbs[j];
        const dx = orbB.x - orbA.x;
        const dy = orbB.y - orbA.y;
        const dist = Math.hypot(dx, dy);
        const minDist = orbA.radius + orbB.radius;
        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) + 1.0;

          orbA.x -= nx * overlap * 0.5;
          orbA.y -= ny * overlap * 0.5;
          orbB.x += nx * overlap * 0.5;
          orbB.y += ny * overlap * 0.5;

          const kx = orbA.vx - orbB.vx;
          const ky = orbA.vy - orbB.vy;
          const p = nx * kx + ny * ky;
          if (p > 0) {
            orbA.vx -= p * nx * 1.05;
            orbA.vy -= p * ny * 1.05;
            orbB.vx += p * nx * 1.05;
            orbB.vy += p * ny * 1.05;
          }
        }
      }
    }

    this.orbs.forEach((orb) => {
      orb.vy += gravity * simDt;

      const currentSpeed = Math.hypot(orb.vx, orb.vy);
      if (currentSpeed > 500 && !orb.isProjectile) {
        orb.vx *= 0.99;
        orb.vy *= 0.99;
      }

      orb.x += orb.vx * simDt;
      orb.y += orb.vy * simDt;

      orb.trail.push({ x: orb.x, y: orb.y, alpha: 1.0 });
      if (orb.trail.length > 7) orb.trail.shift();

      const pad = orb.radius + 6;
      if (orb.x < pad) {
        orb.x = pad;
        orb.vx = Math.max(Math.abs(orb.vx) * 0.92, 140);
      } else if (orb.x > this.width - pad) {
        orb.x = this.width - pad;
        orb.vx = -Math.max(Math.abs(orb.vx) * 0.92, 140);
      }

      if (orb.y < pad + 60) {
        orb.y = pad + 60;
        orb.vy = Math.max(Math.abs(orb.vy) * 0.92, 110);
      } else if (orb.y > this.height - pad - 60) {
        orb.y = this.height - pad - 60;
        orb.vy = -Math.max(Math.abs(orb.vy) * 0.95, 230);
        if (Math.abs(orb.vx) < 50) {
          orb.vx = (Math.random() - 0.5) * 180;
        }
      }

      const normX = orb.x / this.width;
      const normY = orb.y / this.height;
      const normRadius = orb.radius / this.width;

      const col = this.collisionMap.testCircle(normX, normY, normRadius, dragOffsetX, dragOffsetY);

      if (col.hit && col.normal) {
        orb.x += col.normal.x * (col.depth * this.width + 1.5);
        orb.y += col.normal.y * (col.depth * this.height + 1.5);

        const vdotn = orb.vx * col.normal.x + orb.vy * col.normal.y;
        if (vdotn < 0) {
          orb.vx -= 1.85 * vdotn * col.normal.x;
          orb.vy -= 1.85 * vdotn * col.normal.y;

          if (engine?.isRecoiling || engine?.isDragging) {
            orb.vx += dragVelX * 1.4;
            orb.vy += dragVelY * 1.4;
          }

          soundEngine.playOrbBounce(orb.x);
          this.addParticles(orb.x, orb.y, 5, orb.color);
        } else {
          orb.vx += col.normal.x * 130 + (Math.random() - 0.5) * 80;
          orb.vy += col.normal.y * 130 - 80;
        }
      }

      const postSpeed = Math.hypot(orb.vx, orb.vy);
      const minCruisingSpeed = (this.mode === 'pinball' ? 200 : 160) * (0.9 + this.gameSpeed * 0.15);
      const maxSpeed = orb.isProjectile ? 3600 : (1200 * this.gameSpeed);

      if (postSpeed < minCruisingSpeed) {
        if (postSpeed > 0.1) {
          const boost = minCruisingSpeed / postSpeed;
          orb.vx *= boost;
          orb.vy *= boost;
        } else {
          orb.vx = (Math.random() - 0.5) * 180;
          orb.vy = -200;
        }
      } else if (postSpeed > maxSpeed) {
        const clamp = maxSpeed / postSpeed;
        orb.vx *= clamp;
        orb.vy *= clamp;
      }

      this.targets.forEach((tgt) => {
        if (tgt.isHit && this.mode === 'spell') return;
        const dx = tgt.x - orb.x;
        const dy = tgt.y - orb.y;
        const dist = Math.hypot(dx, dy);
        const minDist = tgt.radius + orb.radius;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;

          const orbMass = 1.0;
          const tgtMass = tgt.mass || 1.2;
          const totalMass = orbMass + tgtMass;

          const relVx = orb.vx - tgt.vx;
          const relVy = orb.vy - tgt.vy;
          const normalVel = relVx * nx + relVy * ny;

          const overlap = minDist - dist + 2.0;
          orb.x -= nx * overlap * 0.45;
          orb.y -= ny * overlap * 0.45;
          tgt.x += nx * overlap * 0.55;
          tgt.y += ny * overlap * 0.55;

          if (normalVel > 0) {
            const restitution = 1.45;
            const impulse = (normalVel * (1 + restitution)) / totalMass;

            orb.vx -= impulse * tgtMass * nx;
            orb.vy -= impulse * tgtMass * ny;

            tgt.vx += impulse * orbMass * nx + nx * 220;
            tgt.vy += impulse * orbMass * ny + ny * 220;
          } else {
            orb.vx -= nx * 140;
            orb.vy -= ny * 140;
            tgt.vx += nx * 200;
            tgt.vy += ny * 200;
          }

          if (!tgt.isHit) {
            this.triggerTargetHit(tgt, tgt.x, tgt.y, false);
          }
        }
      });
    });

    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.alpha -= dt / p.life;
      return p.alpha > 0;
    });

    this.popups = this.popups.filter((pop) => {
      pop.y += pop.vy * dt;
      pop.alpha -= dt / pop.life;
      pop.scale += dt * 0.3;
      return pop.alpha > 0;
    });

    this.celebrationParticles = this.celebrationParticles.filter((c) => {
      c.life -= dt;
      if (c.life <= 0) return false;

      c.wobble += c.wobbleSpeed * dt;
      c.rotation += c.rotSpeed * dt;

      c.x += Math.sin(c.wobble) * 45 * dt + c.vx * dt;
      c.y += c.vy * dt;
      c.vy += c.gravity * dt;
      c.vx *= 0.985;

      c.opacity = Math.min(c.life / 0.8, 1.0);
      return c.y < this.height + 40;
    });
  }

  render(engine) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const isAlabaster = this.options.themeKey === 'alabaster';
    const mainStroke = isAlabaster ? 'rgba(10, 10, 12, ' : 'rgba(246, 245, 242, ';

    if (engine && engine.isDragging && this.dragOffset) {
      const startX = engine.dragStart.x * w;
      const startY = engine.dragStart.y * h;
      const pullX = (engine.dragStart.x + this.dragOffset.x) * w;
      const pullY = (engine.dragStart.y + this.dragOffset.y) * h;
      const pullDist = Math.hypot(this.dragOffset.x * w, this.dragOffset.y * h);

      const aimMultiplier = Math.max(pullDist * 0.02, 2.6);
      const aimX = startX - (pullX - startX) * aimMultiplier;
      const aimY = startY - (pullY - startY) * aimMultiplier;

      ctx.beginPath();
      ctx.arc(startX, startY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isAlabaster ? '#0A0A0C' : '#FFFFFF';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX, pullY, pullX, pullY);
      ctx.strokeStyle = `${mainStroke}0.7)`;
      ctx.lineWidth = Math.min(Math.max(pullDist * 0.04, 2), 6);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([6, 8]);
      ctx.moveTo(pullX, pullY);
      ctx.lineTo(aimX, aimY);
      ctx.strokeStyle = `${mainStroke}0.9)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(aimX, aimY, 8 + Math.sin(performance.now() * 0.008) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pullX, pullY, 13, 0, Math.PI * 2);
      ctx.fillStyle = isAlabaster ? '#0A0A0C' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = isAlabaster ? '#333' : '#E2DFD7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.targets.forEach((tgt) => {
      if (tgt.isHit && this.mode === 'spell') return;

      ctx.save();
      if (tgt.isHit) {
        ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.02) * 0.25;
      }
      ctx.translate(tgt.x, tgt.y);

      if (tgt.type === 'letter') {
        ctx.beginPath();
        ctx.arc(0, 0, tgt.radius, 0, Math.PI * 2);
        ctx.fillStyle = isAlabaster ? 'rgba(10, 10, 12, 0.06)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = `${mainStroke}0.45)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, tgt.radius + 5 + Math.sin(performance.now() * 0.004 + tgt.id) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `${mainStroke}0.2)`;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isAlabaster ? '#0A0A0C' : '#FFFFFF';
        ctx.font = '700 16px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tgt.char, 0, 1);
      } else {
        const pulse = Math.sin(performance.now() * 0.005 + tgt.id) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, tgt.radius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = isAlabaster ? 'rgba(10, 10, 12, 0.05)' : 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = `${mainStroke}0.4)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, tgt.radius * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = `${mainStroke}0.8)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = `${mainStroke}0.65)`;
        ctx.font = '700 9px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${tgt.points}`, 0, 0);
      }

      ctx.restore();
    });

    this.orbs.forEach((orb) => {
      if (orb.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(orb.trail[0].x, orb.trail[0].y);
        for (let i = 1; i < orb.trail.length; i++) {
          ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
        }
        ctx.strokeStyle = `${mainStroke}0.16)`;
        ctx.lineWidth = orb.radius * 0.85;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = isAlabaster ? '#0A0A0C' : '#F6F5F2';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = isAlabaster ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = `${mainStroke}0.25)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    this.particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = isAlabaster ? `rgba(10, 10, 12, ${p.alpha})` : `rgba(255, 255, 255, ${p.alpha})`;
      ctx.fill();
    });

    this.celebrationParticles.forEach((c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      const scaleX = Math.cos(c.wobble);
      ctx.scale(scaleX, 1.0);

      ctx.fillStyle = c.color;
      ctx.globalAlpha = c.opacity;
      ctx.fillRect(-c.size / 2, (-c.size * c.aspect) / 2, c.size, c.size * c.aspect);
      ctx.restore();
    });

    this.popups.forEach((pop) => {
      ctx.save();
      ctx.translate(pop.x, pop.y);
      ctx.scale(pop.scale, pop.scale);
      ctx.fillStyle = pop.color.startsWith('#')
        ? pop.color
        : (isAlabaster ? `rgba(10, 10, 12, ${pop.alpha})` : `rgba(255, 255, 255, ${pop.alpha})`);
      ctx.globalAlpha = pop.alpha;
      ctx.font = '700 13px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000.0, 0.04);
      this.lastTime = now;

      const engine = this.options.getEngine ? this.options.getEngine() : null;

      this.update(dt, now, engine);
      this.render(engine);

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }
}
