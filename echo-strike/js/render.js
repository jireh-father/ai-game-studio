// Echo Strike - Rendering, Particles, Effects, Sound
const GameRenderer = {
  scene: null,
  sndCtx: null,

  init(scene) {
    this.scene = scene;
    try { this.sndCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  },

  burstParticles(x, y, texKey, count) {
    const s = this.scene;
    count = Math.min(count, 40);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const p = s.add.image(x, y, texKey).setDepth(15).setAlpha(0.9).setScale(0.6);
      s.tweens.add({
        targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0, duration: 350 + Math.random() * 100,
        onComplete: () => p.destroy()
      });
    }
  },

  floatingText(x, y, text, color, size) {
    const s = this.scene;
    const ft = s.add.text(x, y, text, {
      fontSize: `${size}px`, fontFamily: 'Arial', fill: color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(30);
    s.tweens.add({
      targets: ft, y: y - 60, alpha: 0, duration: 600, onComplete: () => ft.destroy()
    });
  },

  echoFireFlash(x, y, isHit) {
    const s = this.scene;
    const flash = s.add.circle(x, y, 30, 0x00FFEE, isHit ? 0.8 : 0.5).setDepth(12);
    s.tweens.add({
      targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200,
      onComplete: () => flash.destroy()
    });
  },

  drawWalls(wallGfx, walls, flashSide, flashColor, flashTime) {
    const g = wallGfx;
    g.clear();
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    const now = Date.now();
    const flashActive = flashTime && (now - flashTime < 150);

    const drawWall = (side) => {
      const isFlash = flashActive && flashSide === side;
      const color = isFlash ? flashColor : COLORS_INT.WALL_DANGER;
      const alpha = Math.min(0.3 + (walls[side] / (w / 2)) * 0.7, 1);
      g.fillStyle(color, alpha);
      if (side === 'left') g.fillRect(0, 0, walls.left, h);
      else if (side === 'right') g.fillRect(w - walls.right, 0, walls.right, h);
      else if (side === 'top') g.fillRect(0, 0, w, walls.top);
      else g.fillRect(0, h - walls.bottom, w, walls.bottom);
    };
    ['left', 'right', 'top', 'bottom'].forEach(drawWall);
  },

  drawDanger(dangerGfx, walls) {
    dangerGfx.clear();
    const minDist = Math.min(
      CONFIG.GAME_WIDTH / 2 - walls.left,
      CONFIG.GAME_WIDTH / 2 - walls.right,
      CONFIG.GAME_HEIGHT / 2 - walls.top,
      CONFIG.GAME_HEIGHT / 2 - walls.bottom
    );
    if (minDist < WALL_CONFIG.DANGER_THRESHOLD) {
      const alpha = (1 - minDist / WALL_CONFIG.DANGER_THRESHOLD) * 0.4;
      dangerGfx.fillStyle(0xFF0000, alpha);
      dangerGfx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    }
  },

  drawBgGrid(scene) {
    const g = scene.add.graphics().setDepth(0).setAlpha(0.05);
    g.lineStyle(1, 0x00D4FF);
    for (let y = 160; y < 640; y += 160) g.lineBetween(0, y, 360, y);
    for (let x = 90; x < 360; x += 90) g.lineBetween(x, 0, x, 640);
  },

  updateEchoGhosts(echoGhosts) {
    const now = Date.now();
    echoGhosts.forEach(eg => {
      if (!eg.sprite || !eg.sprite.active) return;
      const progress = (now - eg.startTime) / ECHO_CONFIG.DELAY_MS;
      if (progress >= 1) {
        eg.sprite.destroy();
        if (eg.arc) eg.arc.destroy();
      } else if (eg.arc) {
        eg.arc.clear();
        eg.arc.lineStyle(3, 0x00FFEE, progress > 0.75 ? 0.9 : 0.5);
        eg.arc.beginPath();
        eg.arc.arc(eg.x, eg.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
        eg.arc.strokePath();
      }
    });
    return echoGhosts.filter(eg => eg.sprite && eg.sprite.active);
  },

  deathFlash(scene) {
    const flash = scene.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0xFF0000, 0.6).setDepth(50);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
  },

  createPauseOverlay(gameScene) {
    const w = CONFIG.GAME_WIDTH, h = CONFIG.GAME_HEIGHT;
    const ov = gameScene.add.container(0, 0).setDepth(100);
    ov.add(gameScene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7));
    ov.add(gameScene.add.text(w / 2, h * 0.3, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5));
    const btns = [
      { y: h * 0.45, label: 'Resume', fn: () => gameScene.resumeGame() },
      { y: h * 0.53, label: '? How to Play', fn: () => gameScene.scene.launch('HelpScene', { returnTo: 'GameScene' }) },
      { y: h * 0.61, label: 'Restart', fn: () => { gameScene.resumeGame(); gameScene.scene.stop('GameScene'); gameScene.scene.start('GameScene'); }},
      { y: h * 0.69, label: 'Menu', fn: () => { gameScene.resumeGame(); gameScene.scene.stop('GameScene'); gameScene.scene.start('MenuScene'); }}
    ];
    btns.forEach(b => {
      const bg = gameScene.add.rectangle(w / 2, b.y, 180, 40, 0x000000, 0).setStrokeStyle(1, 0x00D4FF)
        .setInteractive({ useHandCursor: true }).on('pointerdown', b.fn);
      ov.add(bg);
      const txt = gameScene.add.text(w / 2, b.y, b.label, {
        fontSize: '16px', fontFamily: 'Arial', fill: '#00D4FF'
      }).setOrigin(0.5);
      txt.disableInteractive();
      ov.add(txt);
    });
    return ov;
  },

  playSound(type, combo) {
    if (!this.sndCtx) return;
    try {
      const ctx = this.sndCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      const pm = combo ? 1 + (combo % 20) * 0.03 : 1;

      if (type === 'hit') {
        osc.frequency.setValueAtTime(800 * pm, now);
        osc.frequency.linearRampToValueAtTime(1200 * pm, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
      } else if (type === 'echoHit') {
        osc.frequency.setValueAtTime(600 * pm, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'echoMiss') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'miss') {
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.26);
        osc.start(now); osc.stop(now + 0.26);
      } else if (type === 'gameOver') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(400, now + 0.3);
        osc.frequency.setValueAtTime(200, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);
        osc.start(now); osc.stop(now + 1.0);
      } else if (type === 'stageAdvance') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
      }
    } catch (e) {}
  }
};
