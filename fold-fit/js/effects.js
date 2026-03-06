// Fold Fit - Visual Effects & Rendering Helpers

const FoldEffects = {
  drawDashedLine(g, x1, y1, x2, y2, pattern) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const ux = dx / len, uy = dy / len;
    let pos = 0, draw = true, pi = 0;
    while (pos < len) {
      const seg = Math.min(pattern[pi % pattern.length], len - pos);
      if (draw) {
        g.beginPath();
        g.moveTo(x1 + ux * pos, y1 + uy * pos);
        g.lineTo(x1 + ux * (pos + seg), y1 + uy * (pos + seg));
        g.strokePath();
      }
      pos += seg; draw = !draw; pi++;
    }
  },

  drawPaper(scene) {
    scene.paperGroup.removeAll(true);
    const verts = scene.stageData.shape.vertices;
    const ox = scene.paperOffX, oy = scene.paperOffY;

    // Shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(COLORS_INT.paperShadow, 0.5);
    shadow.beginPath();
    shadow.moveTo(verts[0].x + ox + 3, verts[0].y + oy + 3);
    verts.forEach((v, i) => { if (i > 0) shadow.lineTo(v.x + ox + 3, v.y + oy + 3); });
    shadow.closePath(); shadow.fillPath();
    scene.paperGroup.add(shadow);

    // Paper fill
    scene.paperGfx = scene.add.graphics();
    scene.paperGfx.fillStyle(COLORS_INT.paper, 1);
    scene.paperGfx.lineStyle(2, COLORS_INT.uiText, 1);
    scene.paperGfx.beginPath();
    scene.paperGfx.moveTo(verts[0].x + ox, verts[0].y + oy);
    verts.forEach((v, i) => { if (i > 0) scene.paperGfx.lineTo(v.x + ox, v.y + oy); });
    scene.paperGfx.closePath(); scene.paperGfx.fillPath(); scene.paperGfx.strokePath();
    scene.paperGroup.add(scene.paperGfx);

    // Fold lines
    scene.stageData.foldLines.forEach((line, idx) => {
      if (scene.foldedLineIndices.includes(idx)) return;
      const g = scene.add.graphics();
      const color = line.type === 'tear' ? COLORS_INT.tearLine : COLORS_INT.foldLine;
      g.lineStyle(3, color, 0.8);
      FoldEffects.drawDashedLine(g,
        line.x1 + ox, line.y1 + oy,
        line.x2 + ox, line.y2 + oy,
        line.type === 'tear' ? [4, 4] : [8, 6]
      );
      scene.paperGroup.add(g);
    });
  },

  drawTarget(scene) {
    const { width } = scene.scale;
    const target = scene.stageData.target;
    if (scene.targetGfx) scene.targetGfx.destroy();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    target.forEach(v => {
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    });
    const tw = maxX - minX, th = maxY - minY;
    const sc = Math.min(90 / Math.max(tw, 1), 90 / Math.max(th, 1));
    const tx = width - 76, ty = 110;

    scene.targetGfx = scene.add.graphics().setDepth(5);
    scene.targetGfx.fillStyle(COLORS_INT.target, 0.2);
    scene.targetGfx.lineStyle(2, COLORS_INT.target, 0.8);
    scene.targetGfx.beginPath();
    target.forEach((v, i) => {
      const px = tx + (v.x - minX - tw / 2) * sc;
      const py = ty + (v.y - minY - th / 2) * sc;
      if (i === 0) scene.targetGfx.moveTo(px, py);
      else scene.targetGfx.lineTo(px, py);
    });
    scene.targetGfx.closePath(); scene.targetGfx.fillPath(); scene.targetGfx.strokePath();

    scene.add.text(tx, ty - 58, 'TARGET', {
      fontSize: '12px', color: COLORS.uiSecondary, fontFamily: 'Georgia, serif'
    }).setOrigin(0.5).setDepth(5);
  },

  animateFold(scene, line, onComplete) {
    const ox = scene.paperOffX, oy = scene.paperOffY;
    const crease = scene.add.graphics();
    crease.lineStyle(4, COLORS_INT.paperShadow, 0.7);
    crease.beginPath();
    crease.moveTo(line.x1 + ox, line.y1 + oy);
    crease.lineTo(line.x2 + ox, line.y2 + oy);
    crease.strokePath();
    scene.tweens.add({
      targets: crease, alpha: 0.3, duration: 350, ease: 'Quad.easeInOut',
      onComplete: () => { crease.destroy(); if (onComplete) onComplete(); }
    });
  },

  spawnFoldParticles(scene, line, count) {
    const ox = scene.paperOffX, oy = scene.paperOffY;
    const cx = (line.x1 + line.x2) / 2 + ox;
    const cy = (line.y1 + line.y2) / 2 + oy;
    for (let i = 0; i < count; i++) {
      const p = scene.add.rectangle(cx, cy, 4, 2, COLORS_INT.paper).setDepth(15);
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 70;
      scene.tweens.add({
        targets: p,
        x: cx + Math.cos(angle) * speed * 0.4,
        y: cy + Math.sin(angle) * speed * 0.4,
        alpha: 0, duration: 400,
        onComplete: () => p.destroy()
      });
    }
  },

  spawnGoldParticles(scene, x, y, count) {
    for (let i = 0; i < count; i++) {
      const p = scene.add.circle(x, y, 3, COLORS_INT.success).setDepth(15);
      const a = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 100;
      scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * sp * 0.6,
        y: y + Math.sin(a) * sp * 0.6,
        alpha: 0, duration: 600,
        onComplete: () => p.destroy()
      });
    }
  },

  wrongFoldEffect(scene) {
    scene.cameras.main.shake(150, 0.006);
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    // Paper wobble
    if (scene.paperGfx) {
      scene.tweens.add({
        targets: scene.paperGfx, angle: 3, duration: 80, yoyo: true, repeat: 2,
        onComplete: () => scene.paperGfx.setAngle(0)
      });
    }
    // Red flash
    const flash = scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2,
      scene.scale.width, scene.scale.height,
      COLORS_INT.danger, 0.2
    ).setDepth(20);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  },

  stageCompleteEffect(scene, wasClean, stagePts) {
    const { width, height } = scene.scale;
    // Float score
    const ft = scene.add.text(width / 2, height / 2 - 40, `+${stagePts}`, {
      fontSize: '24px', color: COLORS.success, fontFamily: 'Georgia, serif', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({ targets: ft, y: ft.y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy() });

    FoldEffects.spawnGoldParticles(scene, width / 2, height / 2, 20);

    if (wasClean) {
      scene.cameras.main.zoom = 1.03;
      scene.time.delayedCall(400, () => { scene.cameras.main.zoom = 1; });
      const crane = scene.add.image(width / 2, -50, 'crane').setScale(0).setDepth(25);
      scene.tweens.add({
        targets: crane, y: height / 2 - 60, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
        onComplete: () => scene.tweens.add({
          targets: crane, alpha: 0, duration: 500, delay: 300,
          onComplete: () => crane.destroy()
        })
      });
    }
  },

  deathEffect(scene) {
    scene.cameras.main.shake(300, 0.012);
    scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2,
      scene.scale.width, scene.scale.height,
      0x000000, 0.3
    ).setDepth(30);
  }
};
