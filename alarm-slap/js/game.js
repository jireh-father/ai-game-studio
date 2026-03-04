// game.js — Core GameScene: alarms, noise meter, combo, stages, pause
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueData = data ? data.continueData : null;
  }

  create() {
    AudioManager.init();
    AudioManager.resume();
    Effects.createTextures(this);

    this.add.image(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, 'background')
      .setDisplaySize(CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

    const cd = this.continueData;
    this.score = cd ? cd.score : 0;
    this.stage = cd ? cd.stage : 1;
    this.noiseMeter = cd ? Math.max(0, 100 - cd.noiseDrain) : 0;
    this.isFirstDeath = !cd;
    Object.assign(this, {
      combo: 0, gameOver: false, paused: false, idleWarned: false,
      stageTimeLeft: 0, spawnEvents: [], alarms: [],
      lastTapTime: 0, lastTapX: 0, lastTapY: 0, pointerDownPos: null,
      _noisePulsing: false, _noiseShaking: false, _lastMusicBpm: 0,
    });
    this.lastInputTime = this.time.now;

    Effects.createHUD(this);
    GameInput.setup(this);
    this.startStage(this.stage);

    const bpm = this.stage <= 5 ? 80 : Math.min(140, 80 + this.stage * 2);
    AudioManager.startMusic(bpm);
  }

  // --- Alarm slap actions (called by GameInput) ---

  slapAlarm(alarm, tapX, tapY, isSwipe) {
    if (alarm.dead) return;
    alarm.dead = true;
    const isMoving = alarm.vx !== 0 || alarm.vy !== 0;
    let pts = isMoving ? CONFIG.SCORE.SLAP_MOVING : CONFIG.SCORE.SLAP_STATIONARY;
    if (alarm.ringProgress < 0.25) pts *= 2;
    pts *= this.getComboMultiplier();
    this.addScore(pts, alarm.x, alarm.y);
    this.combo++;
    this.updateComboDisplay();
    if (isSwipe) AudioManager.playSlapMovingSound(this.combo);
    else AudioManager.playSlapSound(this.combo);
    AudioManager.vibrate(30);
    Effects.slapEffect(this, alarm, tapX, tapY, this.combo);
    if (alarm.type === CONFIG.ALARM_TYPES.SPLITTER && this.stage >= 41) {
      this.spawnSplitAlarms(alarm, tapX, tapY);
    }
  }

  smashAlarm(alarm, tapX, tapY) {
    if (alarm.dead) return;
    alarm.dead = true;
    let pts = CONFIG.SCORE.SMASH;
    if (this.combo >= 5) pts *= 3;
    else pts *= this.getComboMultiplier();
    this.addScore(pts, alarm.x, alarm.y);
    this.combo++;
    this.updateComboDisplay();
    AudioManager.playSmashSound();
    AudioManager.vibrate(30);
    this.cameras.main.shake(80, 0.004);
    Effects.slapEffect(this, alarm, tapX, tapY, this.combo, true);
  }

  slapMuffler(alarm, tapX, tapY) {
    if (alarm.dead) return;
    alarm.dead = true;
    this.addScore(CONFIG.SCORE.MUFFLER, alarm.x, alarm.y);
    this.noiseMeter = Math.max(0, this.noiseMeter - CONFIG.MUFFLER_DRAIN);
    AudioManager.playMufflerSound();
    AudioManager.vibrate(30);
    Effects.slapEffect(this, alarm, tapX, tapY, this.combo);
    Effects.mufflerRipple(this, alarm);
  }

  spawnSplitAlarms(parent, tapX, tapY) {
    const flyAngle = Math.atan2(parent.y - tapY, parent.x - tapX);
    const speed = 120;
    const cfg = StageManager.getStageConfig(this.stage);
    const a1 = flyAngle + Math.PI / 2, a2 = flyAngle - Math.PI / 2;
    this.spawnAlarm(CONFIG.ALARM_TYPES.FAST_MOVER, parent.x, parent.y,
      Math.cos(a1) * speed, Math.sin(a1) * speed, cfg.ringTimeSec);
    this.spawnAlarm(CONFIG.ALARM_TYPES.FAST_MOVER, parent.x, parent.y,
      Math.cos(a2) * speed, Math.sin(a2) * speed, cfg.ringTimeSec);
  }

  addScore(pts, x, y) {
    pts = Math.round(pts);
    this.score += pts;
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.tweens.add({
      targets: this.scoreText, scaleX: 1.35, scaleY: 1.35,
      duration: 60, yoyo: true, ease: 'Quad.easeOut',
    });
    Effects.floatingScore(this, x, y, pts, this.combo);
  }

  getComboMultiplier() {
    for (let i = CONFIG.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.combo >= CONFIG.COMBO_THRESHOLDS[i].min) return CONFIG.COMBO_THRESHOLDS[i].mult;
    }
    return 1;
  }

  updateComboDisplay() {
    if (this.combo >= 5) {
      const mult = this.getComboMultiplier();
      this.comboText.setText(`x${mult} COMBO`);
      this.comboText.setAlpha(1);
      const size = this.combo >= 30 ? 36 : this.combo >= 20 ? 32 : this.combo >= 10 ? 28 : 22;
      this.comboText.setFontSize(size);
      this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true });
      AudioManager.playComboSound(this.combo);
    } else {
      this.comboText.setAlpha(0);
    }
  }

  // --- Stage management ---

  startStage(stageNum) {
    this.stage = stageNum;
    this.stageText.setText(`S.${stageNum}`);
    const config = StageManager.getStageConfig(stageNum);
    this.stageTimeLeft = config.durationSec * 1000;
    this.stageDuration = config.durationSec * 1000;
    this.currentStageConfig = config;
    this.spawnEvents.forEach(e => e.remove && e.remove());
    this.spawnEvents = [];

    const pattern = StageManager.generateAlarmPattern(config);
    for (const spawn of pattern) {
      const ev = this.time.delayedCall(spawn.delay, () => {
        if (this.gameOver || this.paused) return;
        if (this.alarms.filter(a => !a.dead).length < CONFIG.ALARM_POOL_SIZE) {
          this.spawnAlarm(spawn.type, spawn.x, spawn.y, spawn.vx, spawn.vy, spawn.ringTimeSec);
        }
      });
      this.spawnEvents.push(ev);
    }

    if (config.isRestStage) Effects.restStageBanner(this);
    if (config.isStormStage) Effects.stormBanner(this);
    AudioManager.updateMusicTempo(Math.min(140, 80 + stageNum * 2));
  }

  spawnAlarm(type, x, y, vx, vy, ringTimeSec) {
    const textureKey = type === CONFIG.ALARM_TYPES.MUFFLER ? 'alarm_muffler' :
      (type >= CONFIG.ALARM_TYPES.SLOW_MOVER && type !== CONFIG.ALARM_TYPES.MUFFLER ?
        'alarm_moving' : 'alarm_stationary');
    const sprite = this.add.image(x, y, textureKey).setScale(0.85).setDepth(20);
    sprite.setInteractive();
    const ringArc = this.add.graphics().setDepth(25);
    const alarm = {
      sprite, ringArc, type, x, y, vx: vx || 0, vy: vy || 0,
      ringProgress: 0, ringTimeSec, dead: false, spawnTime: this.time.now,
    };
    this.alarms.push(alarm);
    sprite.setScale(0);
    this.tweens.add({ targets: sprite, scaleX: 0.85, scaleY: 0.85, duration: 150, ease: 'Back.easeOut' });
    if (type === CONFIG.ALARM_TYPES.MUFFLER && this.noiseMeter > 60) {
      this.tweens.add({ targets: sprite, scaleX: 0.92, scaleY: 0.92, duration: 400, yoyo: true, repeat: -1 });
    }
    return alarm;
  }

  removeAlarm(alarm) {
    if (alarm.sprite && alarm.sprite.active) alarm.sprite.destroy();
    if (alarm.ringArc) alarm.ringArc.destroy();
    alarm.dead = true;
  }

  // --- Update loop ---

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    this.stageTimeLeft -= delta;
    this.timerBar.setSize(CONFIG.GAME_WIDTH * Math.max(0, this.stageTimeLeft / this.stageDuration), 3);
    if (this.stageTimeLeft <= 0) { this.clearStage(); return; }

    for (const alarm of this.alarms) {
      if (alarm.dead) continue;
      alarm.x += alarm.vx * (delta / 1000);
      alarm.y += alarm.vy * (delta / 1000);
      const pad = 20, topB = CONFIG.HUD_TOP_HEIGHT + pad;
      const botB = CONFIG.GAME_HEIGHT - CONFIG.HUD_BOTTOM_HEIGHT - pad;
      if (alarm.x < pad) { alarm.x = pad; alarm.vx *= -1; }
      if (alarm.x > CONFIG.GAME_WIDTH - pad) { alarm.x = CONFIG.GAME_WIDTH - pad; alarm.vx *= -1; }
      if (alarm.y < topB) { alarm.y = topB; alarm.vy *= -1; }
      if (alarm.y > botB) { alarm.y = botB; alarm.vy *= -1; }
      alarm.sprite.setPosition(alarm.x, alarm.y);
      alarm.ringProgress += delta / (alarm.ringTimeSec * 1000);
      alarm.ringArc.clear();
      alarm.ringArc.lineStyle(4, 0xFF2222, 1);
      alarm.ringArc.beginPath();
      const sa = -Math.PI / 2;
      alarm.ringArc.arc(alarm.x, alarm.y, 22, sa, sa + alarm.ringProgress * Math.PI * 2, false);
      alarm.ringArc.strokePath();
      if (alarm.ringProgress >= 1) {
        alarm.dead = true;
        this.noiseMeter = Math.min(100, this.noiseMeter + CONFIG.NOISE_PER_ALARM);
        this.combo = 0;
        this.updateComboDisplay();
        AudioManager.playRingComplete();
        Effects.ringCompleteShockwave(this, alarm);
        this.removeAlarm(alarm);
      }
    }
    this.alarms = this.alarms.filter(a => !a.dead);
    this.updateNoiseMeter();
    if (this.noiseMeter >= 100) { this.triggerDeath(); return; }

    const idle = time - this.lastInputTime;
    if (idle >= CONFIG.IDLE_TIMEOUT_MS) {
      this.noiseMeter = Math.min(100, this.noiseMeter + CONFIG.IDLE_NOISE_PENALTY);
      this.lastInputTime = time;
      this.idleWarned = false;
      for (const a of this.alarms) {
        if (!a.dead && a.sprite.active) {
          a.sprite.setTint(0xFF0000);
          this.time.delayedCall(300, () => { if (a.sprite.active) a.sprite.clearTint(); });
        }
      }
    } else if (idle >= CONFIG.IDLE_WARN_MS && !this.idleWarned) {
      this.idleWarned = true;
      AudioManager.playIdleWarning();
      for (const a of this.alarms) {
        if (!a.dead && a.sprite.active) {
          this.tweens.add({ targets: a.sprite, alpha: 0.3, duration: 150, yoyo: true, repeat: 3 });
        }
      }
    }
    if (this.noiseMeter > 80) {
      const ubpm = Math.min(170, 80 + this.stage * 2 + 30);
      if (!this._lastMusicBpm || Math.abs(this._lastMusicBpm - ubpm) > 10) {
        this._lastMusicBpm = ubpm;
        AudioManager.updateMusicTempo(ubpm);
      }
    }
  }

  updateNoiseMeter() {
    this.noiseBarFill.setSize(200 * (this.noiseMeter / 100), 16);
    const c = this.noiseMeter <= 60 ? 0x44CC44 : this.noiseMeter <= 80 ? 0xFF8800 : 0xFF0000;
    this.noiseBarFill.setFillStyle(c, 1);
    if (this.noiseMeter > 60 && this.noiseMeter <= 80 && !this._noisePulsing) {
      this._noisePulsing = true;
      this.tweens.add({ targets: this.noiseBarFill, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1 });
    }
    if (this.noiseMeter > 80 && !this._noiseShaking) {
      this._noiseShaking = true;
      this.cameras.main.shake(200, 0.002);
      this.time.delayedCall(1000, () => { this._noiseShaking = false; });
    }
  }

  clearStage() {
    let bonus = CONFIG.SCORE.STAGE_CLEAR_BASE + this.stage * CONFIG.SCORE.STAGE_CLEAR_PER;
    if (this.noiseMeter < 20) bonus *= 2;
    this.addScore(bonus, CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 30);
    AudioManager.playStageClear();
    Effects.stageClearFlash(this, this.stage);
    for (const a of this.alarms) this.removeAlarm(a);
    this.alarms = [];
    this.time.delayedCall(1000, () => { if (!this.gameOver) this.startStage(this.stage + 1); });
  }

  triggerDeath() {
    this.gameOver = true;
    AudioManager.stopMusic();
    AudioManager.playGameOver();
    AudioManager.vibrate([50, 20, 50]);
    this.time.timeScale = 0.3;
    Effects.deathEffects(this);
    this.time.delayedCall(600 / 0.3, () => {
      this.time.timeScale = 1;
      for (const a of this.alarms) this.removeAlarm(a);
      this.alarms = [];
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stage, isFirstDeath: this.isFirstDeath,
      });
    });
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) { AudioManager.pauseAll(); Effects.showPauseOverlay(this); }
    else { AudioManager.resumeAll(); if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; } }
  }
}
