// Slash Dash - Core Gameplay Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continued = data && data.continued;
  }

  create() {
    if (!this.continued) GameState.reset();
    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.activeObjects = [];
    this.encounterIndex = 0;
    this.objectsHandled = 0;
    this.currentStage = null;
    this.pointerStart = null;
    this.zenGlowRef = null;
    this.holdActive = false;
    this.holdTimer = null;
    this.lastInputTime = Date.now();
    this.fingerIndicator = null;

    Effects.initAudio();
    HUD.create(this);

    if (HUD.pauseBtn) HUD.pauseBtn.on('pointerdown', () => this.togglePause());

    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.input.on('pointerdown', (p) => this.handlePointerDown(p));
    this.input.on('pointermove', (p) => this.handlePointerMove(p));
    this.input.on('pointerup', (p) => this.handlePointerUp(p));

    this.loadStage(GameState.stage);
  }

  loadStage(stageNum) {
    this.stageTransitioning = false;
    this.currentStage = generateStage(stageNum);
    this.encounterIndex = 0;
    this.objectsHandled = 0;
    GameState.inversionActive = false;
    HUD.updateStage();
    HUD.setInversion(false);
    this.spawnNextEncounter();
  }

  spawnNextEncounter() {
    if (this.gameOver || this.paused || this.stageTransitioning) return;
    if (this.encounterIndex >= GAME.OBJECTS_PER_STAGE) return;

    const enc = this.currentStage.encounters[this.encounterIndex];
    this.encounterIndex++;

    enc.forEach(obj => {
      if (obj.poison) GameState.inversionActive = true;
      if (obj.announce) Effects.inversionBanner(this);
      this.spawnObject(obj);
    });

    if (GameState.inversionActive) HUD.setInversion(true);

    if (this.encounterIndex < GAME.OBJECTS_PER_STAGE) {
      this.spawnTimer = this.time.delayedCall(this.currentStage.gapMs, () => this.spawnNextEncounter());
    }
  }

  spawnObject(data) {
    const texKey = data.poison ? 'poisonOrb' : (data.type === 'red' ? 'redOrb' : 'blueOrb');
    const obj = this.add.image(data.x, GAME.HUD_H, texKey).setDepth(20);
    obj.objType = data.type;
    obj.isPoisoned = data.poison || false;
    obj.speed = this.currentStage.speedPxPerSec;
    obj.handled = false;
    obj.missed = false;
    const glowColor = data.type === 'red' ? 0xFF2244 : 0x00CCFF;
    obj.glowRef = this.add.circle(data.x, GAME.HUD_H, 34, glowColor, 0.2).setDepth(19);
    this.activeObjects.push(obj);
  }

  correctSlash(obj, perfect) {
    const mult = getComboMultiplier(GameState.combo);
    const base = perfect ? SCORE.PERFECT_SLASH : SCORE.RED_SLASH;
    const pts = Math.floor(base * mult);
    GameState.score += pts;
    GameState.combo++;
    this.objectsHandled++;

    Effects.objectExplosion(this, obj.x, obj.y, obj.isPoisoned ? 0x44FF66 : 0xFF2244);
    Effects.scalePunch(this, obj, 1.4, 40);
    Effects.floatingText(this, obj.x, obj.y - 20,
      mult > 1 ? '+' + base + 'x' + mult.toFixed(1) : '+' + pts,
      mult > 1 ? COLORS.COMBO_GOLD : COLORS.SCORE_TEXT);
    if (perfect) Effects.cameraZoomPulse(this);

    this.checkComboMilestone();
    HUD.updateScore(this);
    HUD.updateCombo(this);
    this.time.delayedCall(50, () => { if (obj.glowRef) obj.glowRef.destroy(); obj.destroy(); });
    this.checkStageComplete();
  }

  correctDodge(obj) {
    const mult = getComboMultiplier(GameState.combo);
    const pts = Math.floor(SCORE.BLUE_DODGE * mult);
    GameState.score += pts;
    GameState.combo++;
    this.objectsHandled++;

    this.tweens.add({ targets: obj, alpha: 0.4, duration: 50, yoyo: true, repeat: 1 });
    Effects.floatingText(this, obj.x, obj.y - 20, '+' + pts, COLORS.ZEN_GLOW);

    this.checkComboMilestone();
    HUD.updateScore(this);
    HUD.updateCombo(this);
    this.time.delayedCall(200, () => { if (obj.glowRef) obj.glowRef.destroy(); obj.destroy(); });
    this.checkStageComplete();
  }

  addStrike(obj) {
    const prevCombo = GameState.combo;
    GameState.strikes++;
    GameState.combo = 0;
    Effects.strikeFlash(this);
    Effects.screenShake(this, 6, 200);
    Effects.playStrikeSound();
    HUD.updateStrikes(this, GameState.strikes);
    HUD.updateCombo(this);

    if (prevCombo >= 3) {
      Effects.floatingText(this, GAME.CANVAS_W / 2, 100, 'x' + prevCombo + ' LOST', COLORS.RED_ORB, 18);
    }

    this.tweens.add({
      targets: obj, scaleX: 0.6, scaleY: 0.6, alpha: 0, duration: 60,
      onComplete: () => { if (obj.glowRef) obj.glowRef.destroy(); obj.destroy(); }
    });

    this.objectsHandled++;
    if (GameState.strikes >= GAME.MAX_STRIKES) { this.triggerGameOver(); return; }
    this.checkStageComplete();
  }

  checkComboMilestone() {
    const c = GameState.combo;
    if (c === 3 || c === 6 || c === 9 || c === 12) {
      Effects.floatingText(this, GAME.CANVAS_W / 2, GAME.CANVAS_H / 2,
        'x' + c + ' COMBO!', GAME.COMBO_COLORS[c] || COLORS.COMBO_GOLD, 28);
      Effects.playComboSound();
    }
  }

  checkStageComplete() {
    if (this.objectsHandled >= GAME.OBJECTS_PER_STAGE && !this.stageTransitioning && !this.gameOver) {
      this.advanceStage();
    }
  }

  advanceStage() {
    this.stageTransitioning = true;
    if (this.spawnTimer) { this.spawnTimer.remove(); this.spawnTimer = null; }

    const bonus = (GameState.inversionActive ? SCORE.INVERSION_CLEAR_MULT : SCORE.STAGE_CLEAR_MULT) * GameState.stage;
    GameState.score += bonus;
    HUD.updateScore(this);
    Effects.stageClearEffect(this, GameState.stage);
    Effects.playStageClearSound();

    GameState.stage++;
    this.time.delayedCall(900, () => { if (!this.gameOver) this.loadStage(GameState.stage); });
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.spawnTimer) { this.spawnTimer.remove(); this.spawnTimer = null; }

    Effects.screenShake(this, 12, 500);
    Effects.playGameOverSound();
    this.cameras.main.flash(300, 255, 0, 0);

    const isNewBest = GameState.score > GameState.highScore;
    GameState.saveHighScore();
    Ads.onDeath();

    this.time.delayedCall(800, () => {
      this.scene.launch('GameOverScene', { score: GameState.score, stage: GameState.stage, isNewBest });
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      PauseOverlay.show(this,
        () => { PauseOverlay.hide(); this.paused = false; },
        () => { PauseOverlay.hide(); this.paused = false; this.scene.stop('GameScene'); this.scene.start('GameScene'); },
        () => { this.scene.pause('GameScene'); this.scene.launch('HelpScene', { returnTo: 'GameScene' }); },
        () => { PauseOverlay.hide(); this.paused = false; this.scene.stop('GameScene'); this.scene.start('MenuScene'); }
      );
    } else {
      PauseOverlay.hide();
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    if (Date.now() - this.lastInputTime > GAME.INACTIVITY_LIMIT) {
      this.triggerGameOver();
      return;
    }

    const dt = delta / 1000;
    for (let i = this.activeObjects.length - 1; i >= 0; i--) {
      const obj = this.activeObjects[i];
      if (!obj.active) { this.activeObjects.splice(i, 1); continue; }

      obj.y += obj.speed * dt;
      if (obj.glowRef && obj.glowRef.active) obj.glowRef.y = obj.y;

      if (!obj.handled && !obj.missed && obj.y >= GAME.PLAYER_ZONE_Y) {
        const effectiveType = GameState.inversionActive ? (obj.objType === 'red' ? 'blue' : 'red') : obj.objType;
        if (effectiveType === 'red') {
          obj.missed = true;
          this.addStrike(obj);
        }
      }

      if (obj.y > GAME.CANVAS_H + 40) {
        if (!obj.handled && !obj.missed) { this.objectsHandled++; this.checkStageComplete(); }
        if (obj.glowRef) obj.glowRef.destroy();
        obj.destroy();
        this.activeObjects.splice(i, 1);
      }
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    this.activeObjects = [];
  }
}

// Mix in input handling
Object.assign(GameScene.prototype, InputMixin);
