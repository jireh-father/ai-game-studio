// Toilet Unclogger - Rendering, Toilet Drawing, Visual Effects
class ToiletRenderer {
  constructor(scene) {
    this.scene = scene;
    this.toiletGraphics = [];
    this.clogGraphics = [];
    this.waterGraphics = [];
    this.plungerSprite = null;
    this.beatTrackGfx = null;
    this.dangerOverlay = null;
    this.waterBarGraphics = null;
    this.particles = null;
  }

  init() {
    const s = this.scene, w = s.scale.width, h = s.scale.height;
    this._drawTilePattern(w, h);
    this.waterBarGraphics = s.add.graphics().setDepth(50);
    this.particles = s.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 250 }, lifespan: 400, quantity: 15,
      scale: { start: 0.8, end: 0 }, gravityY: 200, emitting: false,
    }).setDepth(90);
    this.dangerOverlay = s.add.rectangle(w / 2, h / 2, w, h, 0xFF0000, 0).setDepth(80);
  }

  _drawTilePattern(w, h) {
    const g = this.scene.add.graphics().setDepth(0);
    g.fillStyle(0xE3F2FD); g.fillRect(0, 0, w, h);
    g.lineStyle(1, 0xBBDEFB, 0.3);
    for (let x = 0; x < w; x += 30) g.strokeLineShape(new Phaser.Geom.Line(x, 0, x, h));
    for (let y = 0; y < h; y += 30) g.strokeLineShape(new Phaser.Geom.Line(0, y, w, y));
  }

  clearToilets() {
    this.toiletGraphics.forEach(g => g.destroy());
    this.clogGraphics.forEach(g => g.destroy());
    this.waterGraphics.forEach(g => g.destroy());
    this.toiletGraphics = []; this.clogGraphics = []; this.waterGraphics = [];
    if (this.plungerSprite) this.plungerSprite.destroy();
  }

  drawToilets(toiletData, activeIndex) {
    const s = this.scene, w = s.scale.width, h = s.scale.height;
    const numT = toiletData.length;
    for (let i = 0; i < numT; i++) {
      const tx = this.toiletX(i, numT, w);
      const ty = h * 0.45;
      const scale = i === activeIndex ? 1 : 0.6;
      const alpha = i === activeIndex ? 1 : 0.4;
      const tg = s.add.graphics().setDepth(10).setAlpha(alpha);
      this._drawToiletShape(tg, tx, ty, scale);
      this.toiletGraphics.push(tg);
      const wg = s.add.graphics().setDepth(15).setAlpha(alpha);
      this.waterGraphics.push(wg);
      const cg = s.add.graphics().setDepth(20).setAlpha(alpha);
      this.clogGraphics.push(cg);
      const clog = toiletData[i].clogs[toiletData[i].currentClogIndex];
      if (clog) drawClogObject(cg, clog.id, tx, ty + 5, scale * 0.8);
    }
    const ax = this.toiletX(activeIndex, numT, w);
    this.plungerSprite = s.add.image(ax + 40, h * 0.55, 'plunger').setScale(0.7).setDepth(25);
  }

  toiletX(index, total, w) {
    if (total === 1) return w / 2;
    if (total === 2) return w * (0.3 + index * 0.4);
    return w * (0.2 + index * 0.3);
  }

  _drawToiletShape(g, x, y, s) {
    g.fillStyle(CONFIG.COLORS.PORCELAIN);
    g.fillRoundedRect(x - 50 * s, y - 60 * s, 100 * s, 120 * s, 14 * s);
    g.lineStyle(2 * s, CONFIG.COLORS.STROKE_GRAY);
    g.strokeRoundedRect(x - 50 * s, y - 60 * s, 100 * s, 120 * s, 14 * s);
    g.fillStyle(CONFIG.COLORS.PORCELAIN);
    g.fillEllipse(x, y - 54 * s, 74 * s, 16 * s);
    g.lineStyle(1.5 * s, CONFIG.COLORS.STROKE_GRAY);
    g.strokeEllipse(x, y - 54 * s, 74 * s, 16 * s);
    g.fillStyle(0xBDBDBD);
    g.fillRect(x + 46 * s, y - 28 * s, 14 * s, 6 * s);
    g.fillCircle(x + 60 * s, y - 25 * s, 5 * s);
  }

  drawBeatTrack(trackX, trackW, trackTop, hitZoneY) {
    if (this.beatTrackGfx) this.beatTrackGfx.destroy();
    this.beatTrackGfx = this.scene.add.graphics().setDepth(30);
    const g = this.beatTrackGfx;
    g.fillStyle(0x000000, 0.1);
    g.fillRect(trackX - trackW / 2, trackTop, trackW, hitZoneY - trackTop + 20);
    g.fillStyle(CONFIG.COLORS.BEAT_GREEN, 0.4);
    g.fillRect(trackX - trackW / 2, hitZoneY - 8, trackW, 16);
    g.lineStyle(2, CONFIG.COLORS.BEAT_GREEN);
    g.strokeRect(trackX - trackW / 2, hitZoneY - 3, trackW, 6);
  }

  updateWaterVisuals(toiletData, activeIndex, waterBarY) {
    const s = this.scene, w = s.scale.width;
    const numT = toiletData.length;
    this.waterBarGraphics.clear();
    for (let i = 0; i < numT; i++) {
      const td = toiletData[i];
      const tx = this.toiletX(i, numT, w);
      const ty = s.scale.height * 0.45;
      const scale = i === activeIndex ? 1 : 0.6;
      const level = td.waterLevel / 100;
      if (this.waterGraphics[i]) {
        this.waterGraphics[i].clear();
        const wColor = td.waterLevel > 80 ? CONFIG.COLORS.DANGER_RED
          : td.waterLevel > 50 ? CONFIG.COLORS.WATER_DIRTY : CONFIG.COLORS.WATER_CLEAN;
        this.waterGraphics[i].fillStyle(wColor, 0.7);
        const bowlH = 50 * scale;
        const fillH = bowlH * level;
        this.waterGraphics[i].fillEllipse(tx, ty + 30 * scale - fillH / 2, 60 * scale, Math.max(fillH, 2));
      }
      const barW = (w - 40) / numT - 8;
      const barX = 20 + i * (barW + 8);
      const barColor = td.waterLevel > 80 ? 0xFF5252 : td.waterLevel > 50 ? 0x8D6E3F : 0x4FC3F7;
      this.waterBarGraphics.fillStyle(0x000000, 0.2);
      this.waterBarGraphics.fillRoundedRect(barX, waterBarY, barW, 16, 4);
      this.waterBarGraphics.fillStyle(barColor);
      this.waterBarGraphics.fillRoundedRect(barX, waterBarY, Math.max(barW * level, 2), 16, 4);
    }
  }

  updateDanger(time, waterLevel) {
    if (waterLevel > 80) {
      const pulse = Math.sin(time * 0.008) * 0.15 + 0.15;
      this.dangerOverlay.setAlpha(pulse * ((waterLevel - 80) / 20));
    } else {
      this.dangerOverlay.setAlpha(0);
    }
  }

  emitParticles(x, y, tints, count) {
    this.particles.setPosition(x, y);
    this.particles.setParticleTint(tints);
    this.particles.explode(count);
  }

  animatePlunger() {
    this.scene.tweens.add({
      targets: this.plungerSprite, scaleX: 0.9, scaleY: 0.5, duration: 60,
      yoyo: true, ease: 'Quad.easeOut',
    });
  }

  beatFlash(trackX, hitZoneY) {
    const flash = this.scene.add.circle(trackX, hitZoneY, 4, 0xFFFFFF).setDepth(40);
    this.scene.tweens.add({
      targets: flash, scaleX: 4, scaleY: 4, alpha: 0, duration: 150,
      onComplete: () => flash.destroy()
    });
  }

  animateClogPop(index, tx, ty) {
    const cg = this.clogGraphics[index];
    if (!cg) return;
    this.scene.tweens.add({
      targets: cg, y: cg.y - 120, scaleX: 0, scaleY: 0, angle: 720,
      duration: 400, onComplete: () => cg.clear(),
    });
  }

  redrawClog(index, clogId, tx, ty) {
    const cg = this.clogGraphics[index];
    if (!cg) return;
    cg.clear(); cg.setScale(1).setAngle(0).setY(0);
    if (clogId) drawClogObject(cg, clogId, tx, ty + 5, 0.8);
  }

  overflowBurst(tx, ty) {
    const burst = this.scene.add.particles(tx, ty, 'particle', {
      speed: { min: 100, max: 350 }, angle: { min: 210, max: 330 },
      lifespan: 800, quantity: 40, tint: [CONFIG.COLORS.WATER_DIRTY],
      scale: { start: 1.5, end: 0 }, gravityY: 300, emitting: false,
    });
    burst.explode(40);
  }
}
