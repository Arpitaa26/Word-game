export class TextCollisionMap {
  constructor(gridWidth = 180, gridHeight = 100) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.grid = new Uint8Array(gridWidth * gridHeight);
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = gridWidth;
    this.sampleCanvas.height = gridHeight;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
    this.hasData = false;
    this.lastVersion = 0;
  }

  update(sourceCanvas) {
    if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) return;
    const ctx = this.sampleCtx;
    ctx.clearRect(0, 0, this.gridWidth, this.gridHeight);
    ctx.drawImage(sourceCanvas, 0, 0, this.gridWidth, this.gridHeight);

    const imgData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight);
    const data = imgData.data;
    const total = this.gridWidth * this.gridHeight;

    for (let i = 0; i < total; i++) {
      this.grid[i] = data[i * 4 + 3];
    }

    this.hasData = true;
    this.lastVersion++;
  }

  isSolid(normX, normY) {
    if (!this.hasData) return false;
    if (normX < 0 || normX >= 1 || normY < 0 || normY >= 1) return false;
    const gx = Math.floor(normX * this.gridWidth);
    const gy = Math.floor(normY * this.gridHeight);
    const idx = gy * this.gridWidth + gx;
    return this.grid[idx] > 35;
  }

  getNormal(normX, normY) {
    if (!this.hasData) return { x: 0, y: -1 };
    const gx = Math.min(Math.max(Math.floor(normX * this.gridWidth), 1), this.gridWidth - 2);
    const gy = Math.min(Math.max(Math.floor(normY * this.gridHeight), 1), this.gridHeight - 2);

    const left = this.grid[gy * this.gridWidth + (gx - 1)];
    const right = this.grid[gy * this.gridWidth + (gx + 1)];
    const top = this.grid[(gy - 1) * this.gridWidth + gx];
    const bottom = this.grid[(gy + 1) * this.gridWidth + gx];

    const nx = (left - right) / 255.0;
    const ny = (top - bottom) / 255.0;
    const len = Math.hypot(nx, ny);

    if (len < 0.001) {
      return { x: 0, y: -1 };
    }
    return { x: nx / len, y: ny / len };
  }

  testCircle(normX, normY, normRadius, offsetX = 0, offsetY = 0) {
    if (!this.hasData) return { hit: false };

    const localX = normX - offsetX;
    const localY = normY - offsetY;

    let hit = false;
    let totalNx = 0;
    let totalNy = 0;
    let hitCount = 0;

    const SAMPLES = 8;
    for (let i = 0; i < SAMPLES; i++) {
      const angle = (i / SAMPLES) * Math.PI * 2;
      const px = localX + Math.cos(angle) * normRadius;
      const py = localY + Math.sin(angle) * normRadius;

      if (this.isSolid(px, py)) {
        hit = true;
        totalNx += (localX - px);
        totalNy += (localY - py);
        hitCount++;
      }
    }

    if (!hit) {
      if (this.isSolid(localX, localY)) {
        const n = this.getNormal(localX, localY);
        return { hit: true, normal: n, depth: normRadius };
      }
      return { hit: false };
    }

    const len = Math.hypot(totalNx, totalNy);
    const normal = len > 0.0001
      ? { x: totalNx / len, y: totalNy / len }
      : this.getNormal(localX, localY);

    return {
      hit: true,
      normal,
      depth: (hitCount / SAMPLES) * normRadius + 0.002,
    };
  }
}
