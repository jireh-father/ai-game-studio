// grid.js - Hex grid utilities, cell management, particles, bombs/frozen updates

const HexGrid = {
  // Convert axial coords to pixel position
  axialToPixel(q, r, centerX, centerY) {
    return {
      x: centerX + HEX.radius * (3 / 2 * q),
      y: centerY + HEX.radius * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r)
    };
  },

  key(q, r) { return `${q},${r}`; },

  getNeighbors(q, r, cells) {
    return ADJ_OFFSETS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }))
      .filter(n => cells[HexGrid.key(n.q, n.r)] !== undefined);
  },

  isAdjacent(a, b) {
    return ADJ_OFFSETS.some(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
  },

  hasAnyMatch(cells) {
    for (const cell of Object.values(cells)) {
      if (cell.value === 0 || cell.type === 'frozen') continue;
      const neighbors = HexGrid.getNeighbors(cell.q, cell.r, cells);
      for (const n of neighbors) {
        const nc = cells[HexGrid.key(n.q, n.r)];
        if (nc && nc.value > 0 && nc.type !== 'frozen' &&
            (cell.value === nc.value || cell.type === 'wild' || nc.type === 'wild')) return true;
      }
    }
    return false;
  },

  // Create empty cell sprite with hex hit area
  createEmptyCell(scene, q, r, centerX, centerY, container, cells, tapCallback) {
    const { x, y } = HexGrid.axialToPixel(q, r, centerX, centerY);
    const sprite = scene.add.image(x, y, 'hexEmpty').setDisplaySize(HEX.width, HEX.height);
    sprite.setInteractive(new Phaser.Geom.Polygon([
      { x: -16, y: -28 }, { x: 16, y: -28 }, { x: 32, y: 0 },
      { x: 16, y: 28 }, { x: -16, y: 28 }, { x: -32, y: 0 }
    ]), Phaser.Geom.Polygon.Contains);
    sprite.on('pointerdown', () => tapCallback(q, r));
    container.add(sprite);
    cells[HexGrid.key(q, r)] = { q, r, value: 0, type: 'empty', sprite, text: null, frozenTimer: 0, bombTimer: 0 };
  },

  // Set cell value and update visuals
  setCellValue(scene, q, r, value, type, cells, container, centerX, centerY) {
    const key = HexGrid.key(q, r);
    const cell = cells[key];
    if (!cell) return;
    cell.value = value;
    cell.type = type || 'normal';
    const texKey = type === 'wild' ? 'hexWild' : type === 'bomb' ? 'hexBomb' :
                   value > 0 ? 'hex' + Math.min(value, 12) : 'hexEmpty';
    cell.sprite.setTexture(texKey).setDisplaySize(HEX.width, HEX.height);

    if (value > 0 && type !== 'wild' && type !== 'bomb') {
      const { x, y } = HexGrid.axialToPixel(q, r, centerX, centerY);
      if (cell.text) {
        cell.text.setText('' + value).setPosition(x, y).setVisible(true);
      } else {
        cell.text = scene.add.text(x, y, '' + value, {
          fontSize: '22px', fontFamily: 'Arial Black', fill: getTextColor(value)
        }).setOrigin(0.5);
        container.add(cell.text);
      }
      cell.text.setStyle({ fill: getTextColor(value) });
    } else if (cell.text) {
      cell.text.setVisible(false);
    }

    if (type === 'frozen') {
      const { x, y } = HexGrid.axialToPixel(q, r, centerX, centerY);
      cell.frozenOverlay = scene.add.image(x, y, 'hexFrozen').setDisplaySize(HEX.width, HEX.height).setAlpha(0.7);
      container.add(cell.frozenOverlay);
      scene.tweens.add({ targets: cell.frozenOverlay, alpha: 0.5, duration: 2000, yoyo: true, repeat: -1 });
      cell.frozenTimer = 15000;
    }
    if (type === 'bomb') {
      cell.bombTimer = getBombCountdown(GameState.wave);
    }
  },

  clearCell(q, r, cells) {
    const key = HexGrid.key(q, r);
    const cell = cells[key];
    if (!cell) return;
    cell.value = 0;
    cell.type = 'empty';
    cell.sprite.setTexture('hexEmpty').setDisplaySize(HEX.width, HEX.height);
    if (cell.text) cell.text.setVisible(false);
    if (cell.frozenOverlay) { cell.frozenOverlay.destroy(); cell.frozenOverlay = null; }
    cell.frozenTimer = 0;
    cell.bombTimer = 0;
  },

  // Particle burst effects
  burstParticles(scene, x, y, count, colorStr, toward) {
    const color = typeof colorStr === 'string' ? Phaser.Display.Color.HexStringToColor(colorStr).color : colorStr;
    for (let i = 0; i < count; i++) {
      const p = scene.add.circle(x, y, 3, color);
      const angle = toward ? Math.atan2(toward.y - y, toward.x - x) + (Math.random() - 0.5) * 0.5
                           : Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 60;
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0, duration: 300 + Math.random() * 100,
        onComplete: () => p.destroy()
      });
    }
  },

  burstParticlesHex(scene, x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const p = scene.add.circle(x, y, 3 + Math.random() * 2, color);
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 80;
      scene.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0, duration: 300 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  },

  // Update bomb timers
  updateBombs(scene, cells, delta, centerX, centerY) {
    Object.values(cells).forEach(c => {
      if (c.type === 'bomb' && c.bombTimer > 0) {
        c.bombTimer -= delta;
        const pulseScale = 1 + 0.08 * Math.sin(Date.now() * 0.006);
        c.sprite.setScale(pulseScale);
        if (c.bombTimer <= 0) HexGrid.explodeBomb(scene, c, cells, centerX, centerY);
      }
    });
  },

  explodeBomb(scene, cell, cells, centerX, centerY) {
    SoundFX.play('death');
    const pos = HexGrid.axialToPixel(cell.q, cell.r, centerX, centerY);
    HexGrid.burstParticlesHex(scene, pos.x, pos.y, 20, 0xFF4444);
    scene.cameras.main.shake(200, 0.008);
    HexGrid.clearCell(cell.q, cell.r, cells);
    const empty = Object.values(cells).filter(c => c.value === 0);
    for (let i = 0; i < Math.min(2, empty.length); i++) {
      const t = Phaser.Utils.Array.GetRandom(empty);
      HexGrid.setCellValue(scene, t.q, t.r, Math.random() < 0.5 ? 5 : 6, 'normal',
                           cells, scene.cellContainer, centerX, centerY);
      empty.splice(empty.indexOf(t), 1);
    }
  },

  // Update frozen timers
  updateFrozen(cells, delta) {
    Object.values(cells).forEach(c => {
      if (c.type === 'frozen' && c.frozenTimer > 0) {
        c.frozenTimer -= delta;
        if (c.frozenTimer <= 0) {
          c.type = 'normal';
          if (c.frozenOverlay) { c.frozenOverlay.destroy(); c.frozenOverlay = null; }
        }
      }
    });
  }
};
