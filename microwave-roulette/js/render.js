// Microwave Roulette - Rendering (Microwave, Ring, Needle, Distractions, Items)
const Renderer = {
  drawMicrowave(scene) {
    const g = scene.add.graphics();
    const cx = scene.mcx + 10, cy = scene.mcy;
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRoundedRect(cx - 96, cy - 66, 200, 140, 12);
    // Body
    g.fillStyle(CONFIG.COLORS.TEAL, 1);
    g.fillRoundedRect(cx - 100, cy - 70, 200, 140, 12);
    g.lineStyle(3, CONFIG.COLORS.CHARCOAL, 1);
    g.strokeRoundedRect(cx - 100, cy - 70, 200, 140, 12);
    // Window
    g.fillStyle(CONFIG.COLORS.DARK_BLUE, 1);
    g.fillCircle(cx - 10, cy, scene.ringRadius + 22);
    g.fillStyle(CONFIG.COLORS.MID_BLUE, 0.5);
    g.fillCircle(cx - 10, cy, scene.ringRadius + 16);
    // Panel
    g.fillStyle(CONFIG.COLORS.PANEL, 1);
    g.fillRoundedRect(cx + 55, cy - 60, 35, 120, 3);
    scene.microwaveGfx = g;

    // Digital timer display
    scene.digitalTimer = scene.add.text(cx + 72, cy - 42, '0:30', {
      fontSize: '11px', fontFamily: 'monospace', color: CONFIG.HEX.GREEN,
    }).setOrigin(0.5);
  },

  drawRing(scene) {
    const g = scene.ringGfx;
    g.clear();
    const cx = scene.mcx, cy = scene.mcy, r = scene.ringRadius;

    // Track
    g.lineStyle(10, CONFIG.COLORS.CHARCOAL, 0.2);
    g.strokeCircle(cx, cy, r);

    // Green zones
    const stage = scene.stage;
    const activeZoneIdx = scene.completedZones;
    stage.greenZones.forEach((zone, idx) => {
      if (idx < activeZoneIdx) return;
      const startRad = Phaser.Math.DegToRad(zone.angle - zone.arc / 2 - 90);
      const endRad = Phaser.Math.DegToRad(zone.angle + zone.arc / 2 - 90);

      g.lineStyle(10, idx === activeZoneIdx ? CONFIG.COLORS.GREEN : 0x66BB6A, 0.8);
      g.beginPath();
      g.arc(cx, cy, r, startRad, endRad, false);
      g.strokePath();

      // Gold perfect center
      const perfStart = Phaser.Math.DegToRad(zone.angle - zone.arc * 0.15 - 90);
      const perfEnd = Phaser.Math.DegToRad(zone.angle + zone.arc * 0.15 - 90);
      g.lineStyle(10, CONFIG.COLORS.GOLD, idx === activeZoneIdx ? 0.9 : 0.4);
      g.beginPath();
      g.arc(cx, cy, r, perfStart, perfEnd, false);
      g.strokePath();
    });
  },

  drawNeedle(scene) {
    const g = scene.needleGfx;
    g.clear();
    const cx = scene.mcx, cy = scene.mcy, r = scene.ringRadius;
    const rad = Phaser.Math.DegToRad(scene.needleAngle - 90);
    const nx = cx + Math.cos(rad) * (r + 2);
    const ny = cy + Math.sin(rad) * (r + 2);

    g.lineStyle(4, CONFIG.COLORS.ORANGE, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(nx, ny);
    g.strokePath();
    g.fillStyle(CONFIG.COLORS.ORANGE, 1);
    g.fillCircle(cx, cy, 5);
    g.fillCircle(nx, ny, 3);
  },

  drawDistractions(scene, time) {
    const g = scene.distractGfx;
    g.clear();
    const lvl = scene.stage.distractionLevel;
    const cx = scene.mcx, cy = scene.mcy;

    if (lvl >= 1) {
      for (let i = 0; i < 4; i++) {
        const t = (time * 0.002 + i * 1.5) % 3;
        const sx = cx + Math.sin(time * 0.003 + i) * 15;
        const sy = cy - 40 - t * 30;
        g.fillStyle(0xFFFFFF, Math.max(0, 0.4 - t * 0.15));
        g.fillCircle(sx, sy, 4 + t * 2);
      }
    }
    if (lvl >= 2) {
      for (let i = 0; i < 3; i++) {
        const phase = (time * 0.005 + i * 2) % 2;
        if (phase < 0.5) {
          const sx = cx + Math.cos(i * 2.1 + time * 0.01) * 40;
          const sy = cy + Math.sin(i * 1.7 + time * 0.01) * 30;
          g.fillStyle(CONFIG.COLORS.GOLD, 0.8);
          g.fillCircle(sx, sy, 2);
        }
      }
    }
    if (lvl >= 3) {
      const shakeAmt = Math.sin(time * 0.03) * 1.5;
      scene.cameras.main.setScroll(shakeAmt, shakeAmt * 0.7);
    }
  },

  drawItem(scene) {
    if (scene.itemGfx) scene.itemGfx.destroy();
    scene.itemGfx = scene.add.graphics();
    const cx = scene.mcx, cy = scene.mcy;
    const col = ITEM_COLORS[scene.stage.item.cat];
    scene.itemGfx.fillStyle(col.fill, 1);
    scene.itemGfx.fillEllipse(cx, cy, 40, 28);
    scene.itemGfx.lineStyle(2, col.stroke, 1);
    scene.itemGfx.strokeEllipse(cx, cy, 40, 28);
    if (scene.stage.isBoss) {
      scene.itemGfx.lineStyle(2, CONFIG.COLORS.GOLD, 1);
      scene.itemGfx.strokeCircle(cx, cy, 24);
    }
  },

  updateDigitalTimer(scene) {
    const stage = scene.stage;
    const revTime = 1 / stage.speed;
    const frac = scene.needleAngle / 360;
    const secs = Math.max(0, (revTime * (1 - frac))).toFixed(1);
    scene.digitalTimer.setText(`0:${secs.padStart(4, '0')}`);
  },
};
