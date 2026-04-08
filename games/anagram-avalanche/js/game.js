class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
    this.gameW = W; this.gameH = H;

    // State
    this.score = 0;
    this.stage = 1;
    this.hp = 3;
    this.usedWords = new Set();
    this.boulders = [];
    this.bouldersKilled = 0;
    this.bouldersSpawnedThisStage = 0;
    this.stageBoulderQuota = 5;
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.scoreMultiplier = 1;
    this.shieldActive = false;
    this.extraTravelTime = 0;
    this.comboCount = 0;

    // Background
    this.add.rectangle(W/2, H/2, W, H, COLORS.bg);
    this.add.rectangle(W/2, H - 100, W, 200, COLORS.bgDark, 0.5);

    // Left wall
    this.wall = this.add.rectangle(
      GAME_CONFIG.wallX, GAME_CONFIG.hudHeight + (H - GAME_CONFIG.hudHeight)/2,
      GAME_CONFIG.wallWidth, H - GAME_CONFIG.hudHeight, COLORS.wall
    ).setStrokeStyle(2, 0x0F172A);

    this.createHUD();

    // Spawn first wave
    this.spawnWave();

    // Pause button
    const pauseBtn = this.add.text(W - 20, 28, 'II', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
    }).setOrigin(1, 0.5).setDepth(100);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());

    // Global input tracker for inactivity
    this.input.on('pointerdown', () => { this.lastInputTime = Date.now(); });

    this.events.once('shutdown', this.shutdown, this);
  }

  createHUD() {
    const W = this.gameW;
    this.add.rectangle(W/2, GAME_CONFIG.hudHeight/2, W, GAME_CONFIG.hudHeight, COLORS.hudBg, 0.7).setDepth(90);
    this.scoreText = this.add.text(12, 18, 'Score: ' + this.score, {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#FFFFFF',
    }).setDepth(100);
    this.stageText = this.add.text(W/2, 28, 'Stage ' + this.stage, {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#F59E0B',
    }).setOrigin(0.5).setDepth(100);
    this.heartIcons = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(W - 120 + i * 34, 28, 'heart').setDepth(100);
      this.heartIcons.push(h);
    }
    this.comboText = this.add.text(W/2, 80, '', {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#F59E0B',
    }).setOrigin(0.5).setDepth(100);
  }

  updateHUD() {
    this.scoreText.setText('Score: ' + this.score);
    this.stageText.setText('Stage ' + this.stage);
    for (let i = 0; i < 3; i++) {
      this.heartIcons[i].setTexture(i < this.hp ? 'heart' : 'heartEmpty');
    }
    if (this.comboCount >= 2) {
      this.comboText.setText('COMBO x' + this.comboCount);
    } else {
      this.comboText.setText('');
    }
  }

  spawnWave() {
    const diff = getDifficulty(this.stage);
    const travelTime = diff.travelTime + this.extraTravelTime;
    const remaining = this.stageBoulderQuota - this.bouldersSpawnedThisStage;
    const count = Math.min(diff.boulderCount, remaining);
    for (let i = 0; i < count; i++) {
      const word = pickWord(diff.wordLength, this.usedWords);
      const scrambled = scrambleWord(word);
      const y = getLaneY(i, count);
      this.spawnBoulder(word, scrambled, y, travelTime, diff.wrongPenalty);
      this.bouldersSpawnedThisStage++;
    }
  }

  spawnBoulder(word, scrambled, y, travelTime, wrongPenalty) {
    const W = this.gameW;
    const container = this.add.container(W + 100, y);
    container.setSize(180, 90);

    const img = this.add.image(0, 0, 'boulder').setScale(1.1);
    container.add(img);

    const tileSize = 32;
    const gap = 4;
    const totalW = scrambled.length * tileSize + (scrambled.length - 1) * gap;
    const startX = -totalW / 2 + tileSize / 2;

    const tiles = [];
    scrambled.forEach((letter, i) => {
      const tx = startX + i * (tileSize + gap);
      const bg = this.add.rectangle(tx, 0, tileSize, tileSize, 0x374151)
        .setStrokeStyle(2, 0x6B7280);
      const text = this.add.text(tx, 0, letter, {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#F3F4F6',
      }).setOrigin(0.5);
      container.add(bg);
      container.add(text);
      tiles.push({ bg, text, letter, index: i, tapped: false });
    });

    const boulder = {
      container, img, word, scrambled, tiles,
      travelTime, wrongPenalty,
      velocity: (W + 150 - GAME_CONFIG.wallX) / travelTime,
      currentIdx: 0, // next index in word to match
      startX: W + 100,
      destroyed: false,
    };

    // Make container interactive - use a zone over each tile
    tiles.forEach((tile, i) => {
      tile.bg.setInteractive(
        new Phaser.Geom.Rectangle(-tileSize/2 - 4, -tileSize/2 - 4, tileSize + 8, tileSize + 8),
        Phaser.Geom.Rectangle.Contains
      );
      tile.bg.on('pointerdown', () => {
        this.onLetterTap(boulder, tile);
      });
    });

    this.boulders.push(boulder);
  }

  onLetterTap(boulder, tile) {
    if (this.gameOver || this.paused || boulder.destroyed || tile.tapped) return;
    this.lastInputTime = Date.now();
    const nextChar = boulder.word[boulder.currentIdx];
    if (tile.letter === nextChar) {
      tile.tapped = true;
      boulder.currentIdx++;
      Effects.letterFlashCorrect(tile.bg);
      this.score += SCORE.letter * this.scoreMultiplier;
      this.updateHUD();
      if (boulder.currentIdx >= boulder.word.length) {
        this.explodeBoulder(boulder);
      }
    } else {
      Effects.letterFlashWrong(tile.bg);
      boulder.velocity *= (1 + boulder.wrongPenalty);
      Effects.screenShake(this, 3, 150);
      // jitter
      this.tweens.add({
        targets: boulder.container, x: boulder.container.x + 4,
        duration: 50, yoyo: true,
      });
      this.comboCount = 0;
      this.updateHUD();
    }
  }

  explodeBoulder(boulder) {
    if (boulder.destroyed) return;
    boulder.destroyed = true;
    const cx = boulder.container.x;
    const cy = boulder.container.y;

    // Distance bonus
    const totalDist = this.gameW - GAME_CONFIG.wallX;
    const traveled = boulder.startX - cx;
    const distancePct = 1 - (traveled / totalDist);
    let bonus = 0;
    if (distancePct >= 0.75) bonus = SCORE.farBonus;
    if (distancePct >= 0.90) bonus = SCORE.longBonus;

    const gained = (SCORE.kill + bonus) * this.scoreMultiplier;
    this.score += gained;
    this.bouldersKilled++;

    if (distancePct >= 0.75) this.comboCount++;
    else this.comboCount = 0;

    Effects.boulderExplosion(this, cx, cy, 16 + Math.min(this.comboCount * 2, 8));
    Effects.floatingScore(this, cx, cy, gained);
    Effects.screenShake(this, 4, 120);
    Effects.cameraZoom(this, 1.03, 200);
    Effects.scalePunch(this, this.scoreText, 1.3, 150);
    Effects.hitStop(this, 60);

    boulder.container.destroy();
    this.updateHUD();

    if (this.bouldersKilled >= this.stageBoulderQuota) {
      this.advanceStage();
    } else if (this.bouldersSpawnedThisStage < this.stageBoulderQuota) {
      // Spawn next wave when all current boulders are gone
      const alive = this.boulders.filter(b => !b.destroyed);
      if (alive.length === 0) this.time.delayedCall(400, () => this.spawnWave());
    }
  }

  advanceStage() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.score += SCORE.stageClear;
    this.updateHUD();

    // Flash overlay
    const W = this.gameW, H = this.gameH;
    const flash = this.add.rectangle(W/2, H/2, W, H, 0xFFFFFF, 0.4).setDepth(150);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    const stageTxt = this.add.text(W/2, H/2, 'STAGE ' + (this.stage + 1), {
      fontFamily: 'Arial Black', fontSize: '36px', color: '#06B6D4', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(160);
    this.tweens.add({ targets: stageTxt, alpha: 0, duration: 800, delay: 400, onComplete: () => stageTxt.destroy() });

    // Reset one-shot powerups
    this.extraTravelTime = 0;

    this.time.delayedCall(900, () => {
      this.stage++;
      this.bouldersKilled = 0;
      this.bouldersSpawnedThisStage = 0;
      // Clear any remaining
      this.boulders.forEach(b => { if (!b.destroyed) { b.destroyed = true; b.container.destroy(); } });
      this.boulders = [];
      this.stageTransitioning = false;

      if (this.stage > 1 && (this.stage - 1) % 3 === 0) {
        this.scene.pause();
        this.scene.launch('PowerUpScene');
      } else {
        this.spawnWave();
      }
    });
  }

  applyPowerUp(pu) {
    if (pu.id === 'slow') this.extraTravelTime = 3;
    else if (pu.id === 'shield') this.shieldActive = true;
    else if (pu.id === 'score') this.scoreMultiplier = 2;
    // vowel/first are cosmetic hints — skip for POC
    this.time.delayedCall(50, () => this.spawnWave());
  }

  onBoulderHitWall(boulder) {
    if (boulder.destroyed) return;
    boulder.destroyed = true;

    Effects.screenShake(this, 12, 400);
    Effects.redFlash(this);
    Effects.wallFlash(this, this.wall);

    if (this.shieldActive) {
      this.shieldActive = false;
      boulder.container.destroy();
      this.bouldersKilled++;
      if (this.bouldersKilled >= this.stageBoulderQuota) this.advanceStage();
      return;
    }

    this.hp--;
    this.comboCount = 0;
    boulder.container.destroy();
    this.bouldersKilled++;
    this.updateHUD();

    if (this.hp <= 0) {
      this.triggerGameOver();
    } else if (this.bouldersKilled >= this.stageBoulderQuota) {
      this.advanceStage();
    } else {
      const alive = this.boulders.filter(b => !b.destroyed);
      if (alive.length === 0 && this.bouldersSpawnedThisStage < this.stageBoulderQuota) {
        this.time.delayedCall(400, () => this.spawnWave());
      }
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.scoreMultiplier = 1;
    this.time.delayedCall(700, () => {
      this.scene.launch('GameOverScene', { score: this.score, stage: this.stage });
      this.scene.pause();
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.world.pause();
      const W = this.gameW, H = this.gameH;
      this.pauseOverlay = this.add.container(0, 0).setDepth(300);
      const bg = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7);
      const title = this.add.text(W/2, 200, 'PAUSED', {
        fontFamily: 'Arial Black', fontSize: '36px', color: '#FFFFFF',
      }).setOrigin(0.5);
      this.pauseOverlay.add([bg, title]);
      this.addPauseBtn(W/2, 300, 'RESUME', () => this.togglePause());
      this.addPauseBtn(W/2, 370, 'HELP', () => {
        this.pauseOverlay.destroy(); this.pauseOverlay = null;
        this.scene.launch('HelpScene', { returnTo: 'GameScene' });
        this.scene.pause();
      });
      this.addPauseBtn(W/2, 440, 'MENU', () => {
        this.scene.stop();
        this.scene.start('MenuScene');
      });
    } else {
      this.physics.world.resume();
      if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
    }
  }

  addPauseBtn(x, y, label, onTap) {
    const bg = this.add.rectangle(x, y, 200, 52, 0x06B6D4).setStrokeStyle(2, 0xFFFFFF).setDepth(301);
    bg.setInteractive({ useHandCursor: true });
    const t = this.add.text(x, y, label, {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(302);
    bg.on('pointerdown', onTap);
    if (this.pauseOverlay) this.pauseOverlay.add([bg, t]);
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.stageTransitioning || this.hitStopped) return;
    const dt = delta / 1000;
    const wallEdge = GAME_CONFIG.wallX + GAME_CONFIG.wallWidth / 2 + 80;

    for (const b of this.boulders) {
      if (b.destroyed) continue;
      b.container.x -= b.velocity * dt;
      if (b.container.x <= wallEdge) {
        this.onBoulderHitWall(b);
      }
    }

    // Inactivity death
    if (Date.now() - this.lastInputTime > 25000) {
      this.hp = 0;
      this.triggerGameOver();
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
