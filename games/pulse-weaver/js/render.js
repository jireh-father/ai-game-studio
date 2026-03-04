// Element rendering helpers — drawBlob, drawShape, drawElement

function drawBlob(gfx, cx, cy, radius, color, alpha) {
  gfx.fillStyle(color, alpha);
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const noise = 0.85 + (Math.sin(i * 2.3 + cx * 0.1) * 0.5 + 0.5) * 0.3;
    pts.push({ x: cx + Math.cos(angle) * radius * noise, y: cy + Math.sin(angle) * radius * noise });
  }
  gfx.beginPath();
  gfx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    gfx.lineTo((pts[i].x + next.x) / 2, (pts[i].y + next.y) / 2);
  }
  gfx.closePath();
  gfx.fillPath();
}

function drawShape(gfx, cx, cy, shapeType) {
  gfx.lineStyle(2, 0xFFFFFF, 0.9);
  const s = 10;
  switch (shapeType) {
    case 'star':
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        const a3 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
        gfx.beginPath();
        gfx.moveTo(cx + Math.cos(a1) * s, cy + Math.sin(a1) * s);
        gfx.lineTo(cx + Math.cos(a2) * s * 0.4, cy + Math.sin(a2) * s * 0.4);
        gfx.lineTo(cx + Math.cos(a3) * s, cy + Math.sin(a3) * s);
        gfx.strokePath();
      }
      break;
    case 'wave':
      gfx.beginPath();
      for (let px = -s; px <= s; px += 2) {
        const py = Math.sin((px / s) * Math.PI) * 5;
        px === -s ? gfx.moveTo(cx + px, cy + py) : gfx.lineTo(cx + px, cy + py);
      }
      gfx.strokePath();
      break;
    case 'hex':
      gfx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        i === 0 ? gfx.moveTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s)
                : gfx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
      }
      gfx.strokePath();
      break;
    case 'bolt':
      gfx.beginPath();
      gfx.moveTo(cx + 3, cy - s); gfx.lineTo(cx - 3, cy - 2);
      gfx.lineTo(cx + 2, cy - 2); gfx.lineTo(cx - 3, cy + s);
      gfx.lineTo(cx + 5, cy + 2); gfx.lineTo(cx, cy + 2);
      gfx.strokePath();
      break;
    case 'circle':
      gfx.beginPath(); gfx.arc(cx, cy, s, 0, Math.PI * 1.5); gfx.strokePath();
      break;
    case 'mound':
      gfx.beginPath();
      gfx.moveTo(cx - s, cy + 3); gfx.lineTo(cx + s, cy + 3);
      gfx.moveTo(cx - s + 3, cy); gfx.lineTo(cx + s - 3, cy);
      gfx.moveTo(cx - s + 6, cy - 3); gfx.lineTo(cx + s - 6, cy - 3);
      gfx.strokePath();
      break;
    case 'spiral':
      gfx.beginPath();
      for (let t = 0; t <= Math.PI * 3; t += 0.2) {
        const r = (t / (Math.PI * 3)) * s;
        const px = cx + Math.cos(t) * r, py = cy + Math.sin(t) * r;
        t < 0.01 ? gfx.moveTo(px, py) : gfx.lineTo(px, py);
      }
      gfx.strokePath();
      break;
    case 'shard':
      gfx.beginPath();
      gfx.moveTo(cx, cy - s); gfx.lineTo(cx + 5, cy); gfx.lineTo(cx, cy + s);
      gfx.lineTo(cx - 5, cy); gfx.closePath(); gfx.strokePath();
      gfx.beginPath(); gfx.moveTo(cx, cy - s); gfx.lineTo(cx, cy + s); gfx.strokePath();
      break;
  }
}

function renderElement(scene, el) {
  if (el.gfx) {
    el.gfx.destroy();
    el.overlayGfx && el.overlayGfx.destroy();
    el.targetRingGfx && el.targetRingGfx.destroy();
  }
  const cfg = el.cfg || getElementConfig(el.type);
  el.cfg = cfg;

  el.gfx = scene.add.graphics().setDepth(3);
  drawBlob(el.gfx, el.x, el.y, ELEMENT_RADIUS + 6, cfg.glowColor, 0.3);
  drawBlob(el.gfx, el.x, el.y, ELEMENT_RADIUS, cfg.color, 1.0);

  el.overlayGfx = scene.add.graphics().setDepth(4);
  drawShape(el.overlayGfx, el.x, el.y, cfg.shapeType);

  el.targetRingGfx = (el.isTarget && !el.cleared) ? scene.add.graphics().setDepth(4) : null;
}
