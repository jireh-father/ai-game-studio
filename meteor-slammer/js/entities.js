// Meteor management and hammer helpers mixed into GameScene
Object.assign(GameScene.prototype, {
  spawnMeteor(data) {
    const w = this.scale.width;
    const x = data.x !== undefined ? data.x : data.laneRatio * w;
    const texKey = data.type === 'boss' ? 'meteor_boss' :
      data.type === 'fire' ? 'meteor_fire' :
      data.type === 'ice' ? 'meteor_ice' :
      data.type === 'gold' ? 'meteor_gold' : 'meteor_normal';
    const sprite = this.add.image(Phaser.Math.Clamp(x, 24, w - 24), -40, texKey).setDepth(8);
    const radius = data.type === 'boss' ? 36 : 22;

    const meteor = {
      sprite, type: data.type, speed: data.speed || 160, radius, hp: data.hp || 1,
      x: sprite.x, y: sprite.y, active: true,
      graceTimer: data.type === 'fire_child' ? 500 : 0
    };

    if (data.type === 'gold') {
      this.tweens.add({ targets: sprite, alpha: 0.5, duration: 300, yoyo: true, repeat: 3, onComplete: () => {
        if (meteor.active) this.resolveMeteor(meteor, false);
      }});
    }
    if (data.type === 'boss') {
      this.tweens.add({ targets: sprite, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    }
    this.meteors.push(meteor);
  },

  smashMeteor(m) {
    if (!m.active) return;
    const x = m.x, y = m.y;
    this.swingHitsThisSwing++;
    this.lastInputTime = Date.now();

    if (m.type === 'boss') {
      m.hp--;
      Effects.bossImpact(x, y, m.hp <= 0);
      if (m.hp > 0) return;
      GameState.score += SCORE_VALUES.boss;
    } else if (m.type === 'fire') {
      Effects.fireImpact(x, y);
      GameState.score += SCORE_VALUES.fire;
      const children = StageManager.splitFireMeteor(m, this.scale.width);
      children.forEach(c => this.spawnMeteor(c));
    } else if (m.type === 'ice') {
      Effects.iceImpact(x, y);
      GameState.score += SCORE_VALUES.ice;
      this.applyFreeze();
    } else if (m.type === 'gold') {
      Effects.goldImpact(x, y);
      GameState.score += SCORE_VALUES.gold;
      Effects.floatText(x, y - 20, '+500', COLORS.meteorGold, '28px', 70, 1000);
    } else {
      Effects.normalImpact(x, y, this.swingHitsThisSwing);
      GameState.score += SCORE_VALUES.normal;
    }

    let multiplier = 1;
    if (this.swingHitsThisSwing === 2) multiplier = 1.5;
    else if (this.swingHitsThisSwing >= 3) multiplier = 2.0;
    if (multiplier > 1) {
      Effects.comboText(x, y, multiplier);
      GameState.score += Math.floor((SCORE_VALUES[m.type] || 100) * (multiplier - 1));
    }

    GameState.comboChain++;
    const chainBonus = COMBO_BONUS[Math.min(GameState.comboChain, 6)] || 0;
    if (chainBonus > 0) GameState.score += chainBonus;

    Effects.floatText(x, y, '+' + SCORE_VALUES[m.type === 'fire_child' ? 'normal' : (m.type || 'normal')], COLORS.comboText, '18px', 50, 700);
    Effects.scalePunch(this.hammerSprite, 1.25, 60);

    const ui = this.scene.get('UIScene');
    if (ui) ui.updateScore();
    this.resolveMeteor(m, false);
  },

  resolveMeteor(m, landed) {
    if (!m.active) return;
    m.active = false;
    this.time.delayedCall(0, () => {
      if (m.sprite && m.sprite.scene) m.sprite.destroy();
    });
    StageManager.meteorResolved(landed);
    if (landed && m.type !== 'gold') {
      GameState.rubbleLayers++;
      GameState.comboChain = 0;
      this.swingHitsThisSwing = 0;
      this.drawRubble();
      Effects.meteorLandEffect(m.x, this.baseY - GameState.rubbleLayers * RUBBLE_LAYER_HEIGHT);
      const ui = this.scene.get('UIScene');
      if (ui) ui.updateRubble();
      if (GameState.rubbleLayers >= MAX_RUBBLE_LAYERS) this.triggerDeath();
    }
  },

  applyFreeze() {
    this.hammerFrozen = true;
    this.angularVelocity *= 0.1;
    this.hammerSprite.setTint(0x60CFFF);
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.freezeTimer = setTimeout(() => {
      this.hammerFrozen = false;
      if (this.hammerSprite && this.hammerSprite.scene) this.hammerSprite.clearTint();
      this.freezeTimer = null;
    }, 1500);
  },

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    const isNewHigh = GameState.saveHighScore();
    GameState.gamesPlayed++;
    localStorage.setItem('meteor-slammer_games', String(GameState.gamesPlayed));
    Effects.deathEffects(() => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', { score: GameState.score, stage: GameState.stage, isNewHigh });
    });
  },

  drawRubble() {
    this.rubbleGfx.clear();
    const layers = GameState.rubbleLayers;
    if (layers <= 0) return;
    const w = this.scale.width;
    const pct = layers / MAX_RUBBLE_LAYERS;
    const color = pct > 0.75 ? 0xFF3030 : pct > 0.5 ? 0x5A3A3A : 0x3A3A45;
    const rubbleTop = this.baseY - layers * RUBBLE_LAYER_HEIGHT;
    this.rubbleGfx.fillStyle(color, 0.8);
    this.rubbleGfx.fillRect(0, rubbleTop, w, layers * RUBBLE_LAYER_HEIGHT + 20);
    this.rubbleGfx.fillStyle(0x4A4A55, 0.4);
    for (let i = 0; i < layers; i++) {
      const ry = this.baseY - i * RUBBLE_LAYER_HEIGHT;
      for (let j = 0; j < 6; j++) {
        this.rubbleGfx.fillRect(Math.random() * w, ry - 8, 20 + Math.random() * 20, 8);
      }
    }
  },

  updateTrail(hx, hy) {
    this.trailPositions.push({ x: hx, y: hy });
    if (this.trailPositions.length > 5) this.trailPositions.shift();
    this.trailGfx.clear();
    if (Math.abs(this.angularVelocity) > 0.8) {
      const alphas = [0.02, 0.04, 0.06, 0.09, 0.12];
      this.trailPositions.forEach((p, i) => {
        this.trailGfx.fillStyle(0x8C9BAF, alphas[i] || 0.02);
        this.trailGfx.fillCircle(p.x, p.y, 30);
      });
    }
  }
});
