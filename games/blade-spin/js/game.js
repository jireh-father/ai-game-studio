// Blade Spin - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    Object.assign(this, {
      stageN: data.stage||1, score: data.score||0, continued: data.continued||false,
      stageTransitioning: false, gameOver: false, paused: false, hitFreeze: false,
      stuckBlades: [], combo: 0, lastThrowTime: 0, lastInputTime: Date.now(),
      logAngle: 0, oscillateDir: 1, oscillateTimer: 0,
      twoSpeedTimer: 0, twoSpeedFast: true, throwsRemaining: 0, swipeStart: null, pauseElements: null
    });
  }

  create() {
    SoundFX.init();
    this.cameras.main.setBackgroundColor(COL_BG);
    this.stageParams = getStageParams(this.stageN);
    this.throwsRemaining = this.stageParams.requiredBlades;
    window.GameState = {
      score: this.score, stage: this.stageN, combo: 0,
      throwsRemaining: this.throwsRemaining,
      highScore: parseInt(localStorage.getItem('blade-spin_high_score')||'0')
    };
    if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene');
    // Log
    var logKey = this.stageParams.isBossStage ? 'log-boss' : 'log';
    this.log = this.add.image(LOG_CENTER_X, LOG_CENTER_Y, logKey).setScale(LOG_DISPLAY_SCALE);
    if (this.stageParams.isBossStage) {
      this.log.setY(-200);
      this.tweens.add({targets:this.log, y:LOG_CENTER_Y, duration:600, ease:'Back.Out'});
      SoundFX.bossStart(); this.flashOverlay(COL_SUCCESS, 0.4, 100);
    }
    this.shieldGraphics = this.add.graphics().setDepth(5);
    // Apple
    if (this.stageParams.hasGoldenApple) {
      this.goldenApple = this.add.image(0,0,'golden-apple').setScale(0.65).setDepth(4);
      this.appleAngle = this.stageParams.appleAngle; this.appleCollected = false;
    } else { this.goldenApple = null; this.appleCollected = true; }
    // Pre-loaded blades
    var self = this;
    this.stageParams.preloadedAngles.forEach(function(a) {
      var b = self.add.image(0,0,'blade').setScale(BLADE_WIDTH/12, BLADE_HEIGHT/60).setDepth(3);
      self.stuckBlades.push({sprite:b, angle:a});
      self.tweens.add({targets:b, alpha:0, duration:100, yoyo:true, repeat:2});
    });
    this.warnGraphics = this.add.graphics().setDepth(10);
    this.setupInput();
    if (this.stageN===1 && this.score===0) {
      var h = this.add.text(GAME_W/2,520,'TAP TO THROW',{fontSize:'18px',fill:'#666666',fontStyle:'bold'}).setOrigin(0.5).setAlpha(0.8);
      this.time.delayedCall(3000, function(){if(h&&h.scene) self.tweens.add({targets:h,alpha:0,duration:500,onComplete:function(){h.destroy();}});});
    }
    this.visHandler = function(){if(document.hidden&&!self.paused&&!self.gameOver) self.togglePause();};
    document.addEventListener('visibilitychange', this.visHandler);
  }

  setupInput() {
    var self = this;
    this.input.on('pointerdown', function(p) {
      if (self.gameOver||self.stageTransitioning||self.paused||p.y<80) return;
      SoundFX.resume(); self.lastInputTime = Date.now();
      self.swipeStart = {x:p.x, y:p.y, time:Date.now()};
    });
    this.input.on('pointerup', function(p) {
      if (self.gameOver||self.stageTransitioning||self.paused||!self.swipeStart) return;
      var dx = p.x-self.swipeStart.x, dy = self.swipeStart.y-p.y, dt = Date.now()-self.swipeStart.time;
      self.swipeStart = null;
      if (Math.abs(dx) > SWIPE_DEAD_ZONE_X) return;
      if (dy > SWIPE_MIN_DIST && dt < SWIPE_MAX_TIME) self.throwMultiBlade(); else self.throwSingleBlade();
    });
  }

  update(time, delta) {
    if (this.gameOver||this.stageTransitioning||this.paused||this.hitFreeze) return;
    var speed = this.stageParams.rotationSpeed;
    if (this.stageParams.twoSpeedCycle) {
      this.twoSpeedTimer += delta;
      if (this.twoSpeedTimer>3000) {this.twoSpeedFast=!this.twoSpeedFast; this.twoSpeedTimer=0;}
      speed *= this.twoSpeedFast ? 1.3 : 0.6;
    }
    if (this.stageParams.isOscillating) {
      this.oscillateTimer += delta;
      if (this.oscillateTimer>2000) {this.oscillateDir*=-1; this.oscillateTimer=0;}
    }
    this.logAngle += speed * this.oscillateDir;
    this.log.setAngle(this.logAngle);
    this.updateStuckBlades();
    this.updateShields();
    this.updateApple();
    this.updateIdleWarning();
  }

  updateStuckBlades() {
    var r = LOG_RADIUS*LOG_DISPLAY_SCALE-8, la = this.logAngle;
    this.stuckBlades.forEach(function(b) {
      var rad = Phaser.Math.DegToRad(b.angle+la-90);
      b.sprite.setPosition(LOG_CENTER_X+Math.cos(rad)*r, LOG_CENTER_Y+Math.sin(rad)*r);
      b.sprite.setAngle(b.angle+la);
    });
  }

  updateShields() {
    this.shieldGraphics.clear();
    if (!this.stageParams.shieldCount) return;
    var r = LOG_RADIUS*LOG_DISPLAY_SCALE, la = this.logAngle;
    this.stageParams.shieldAngles.forEach(function(a) {
      var s = Phaser.Math.DegToRad(a+la-SHIELD_ARC_DEG/2), e = Phaser.Math.DegToRad(a+la+SHIELD_ARC_DEG/2);
      this.shieldGraphics.fillStyle(0x5C6B7A, 0.85);
      this.shieldGraphics.slice(LOG_CENTER_X, LOG_CENTER_Y, r+4, s, e, false);
      this.shieldGraphics.fillPath();
      this.shieldGraphics.lineStyle(2, 0x8FA0B0, 0.9);
      this.shieldGraphics.beginPath();
      this.shieldGraphics.arc(LOG_CENTER_X, LOG_CENTER_Y, r+4, s, e, false);
      this.shieldGraphics.strokePath();
    }.bind(this));
  }

  updateApple() {
    if (!this.goldenApple||this.appleCollected) return;
    var rad = Phaser.Math.DegToRad(this.appleAngle+this.logAngle);
    var r = LOG_RADIUS*LOG_DISPLAY_SCALE*0.6;
    this.goldenApple.setPosition(LOG_CENTER_X+Math.cos(rad)*r, LOG_CENTER_Y+Math.sin(rad)*r);
    this.goldenApple.setAngle(this.logAngle);
  }

  updateIdleWarning() {
    var idle = Date.now()-this.lastInputTime;
    this.warnGraphics.clear();
    if (idle > IDLE_WARNING_START_MS) {
      var p = Math.min((idle-IDLE_WARNING_START_MS)/(IDLE_AUTO_THROW_MS-IDLE_WARNING_START_MS), 1);
      this.warnGraphics.lineStyle(3, 0xFF9900, 0.8);
      var s = -Math.PI/2;
      this.warnGraphics.beginPath();
      this.warnGraphics.arc(LOG_CENTER_X, LOG_CENTER_Y, LOG_RADIUS*LOG_DISPLAY_SCALE+8, s, s+p*Math.PI*2, false);
      this.warnGraphics.strokePath();
    }
    if (idle >= IDLE_AUTO_THROW_MS) {
      SoundFX.autoThrowWarn(); this.combo=0; window.GameState.combo=0;
      var hud = this.scene.get('HUDScene'); if(hud) hud.hideCombo();
      this.lastInputTime = Date.now(); this.throwSingleBlade(true);
    }
    if (idle > 25000 && !this.gameOver) this.onDeath();
  }

  throwSingleBlade(isAuto) {
    if (this.gameOver||this.stageTransitioning) return;
    SoundFX.throwSound();
    var blade = this.add.image(LOG_CENTER_X, GAME_H+30, 'blade').setScale(BLADE_WIDTH/12, BLADE_HEIGHT/60).setDepth(3);
    var la = ((270-this.logAngle)%360+360)%360;
    var ty = LOG_CENTER_Y+LOG_RADIUS*LOG_DISPLAY_SCALE-8;
    var self = this;
    this.tweens.add({targets:blade, y:ty, duration:BLADE_THROW_DURATION, ease:'Quad.Out',
      onComplete:function(){self.onBladeLand(blade, la, isAuto);}});
  }

  throwMultiBlade() {
    if (this.gameOver||this.stageTransitioning) return;
    SoundFX.throwSound();
    var la = ((270-this.logAngle)%360+360)%360;
    var ty = LOG_CENTER_Y+LOG_RADIUS*LOG_DISPLAY_SCALE-8;
    var self = this;
    [-MULTI_THROW_SPREAD, MULTI_THROW_SPREAD].forEach(function(off) {
      var bx = LOG_CENTER_X+Math.cos(Phaser.Math.DegToRad(270+off))*15;
      var b = self.add.image(bx, GAME_H+30, 'blade').setScale(BLADE_WIDTH/12, BLADE_HEIGHT/60).setDepth(3);
      var ba = ((la+off)%360+360)%360;
      self.tweens.add({targets:b, x:LOG_CENTER_X, y:ty, duration:BLADE_THROW_DURATION, ease:'Quad.Out',
        onComplete:function(){self.onBladeLand(b, ba, false);}});
    });
  }

  onBladeLand(blade, angle, isAuto) {
    if (this.gameOver||this.stageTransitioning) return;
    if (this.checkCollision(angle)) { blade.destroy(); this.onDeath(); return; }
    this.stuckBlades.push({sprite:blade, angle:angle});
    this.throwsRemaining--; window.GameState.throwsRemaining = this.throwsRemaining;
    // Combo
    var now = Date.now();
    if (!isAuto && (now-this.lastThrowTime)<COMBO_WINDOW_MS) this.combo = Math.min(this.combo+1, COMBO_MAX);
    else this.combo = isAuto ? 0 : 1;
    this.lastThrowTime = now; window.GameState.combo = this.combo;
    var mult = 1+(this.combo*0.25), pts = Math.round(SCORE_BLADE*mult);
    pts += this.checkAppleHit(blade, angle, mult);
    this.score += pts; window.GameState.score = this.score;
    // Effects
    SoundFX.landSound();
    this.floatingText(blade.x, blade.y-10, '+'+pts, COL_SCORE, 18, 40, 700);
    this.spawnWoodChips(blade.x, blade.y, this.combo>=8?10:6);
    this.cameras.main.shake(100, 0.004);
    this.scalePunch(blade, 1.35, 200);
    this.hitFreeze = true; setTimeout(function(){this.hitFreeze=false;}.bind(this), HIT_FREEZE_MS);
    if (this.combo>=2) {
      SoundFX.comboTick(this.combo);
      var hud = this.scene.get('HUDScene'); if(hud) hud.showComboAnim(this.combo);
      this.comboFlash(this.combo);
    }
    if (this.throwsRemaining<=0 && !this.stageTransitioning) {
      this.stageTransitioning = true; this.onStageComplete();
    }
  }

  checkCollision(angle) {
    for (var i=0; i<this.stuckBlades.length; i++) {
      var d = Math.abs(angle-this.stuckBlades[i].angle)%360;
      if (d>180) d=360-d;
      if (d<BLADE_COLLISION_ARC) return true;
    }
    for (var s=0; s<this.stageParams.shieldAngles.length; s++) {
      var sd = Math.abs(angle-this.stageParams.shieldAngles[s])%360;
      if (sd>180) sd=360-sd;
      if (sd<SHIELD_ARC_DEG/2) {SoundFX.shieldHitSound(); return true;}
    }
    return false;
  }

  checkAppleHit(blade, angle, mult) {
    if (!this.goldenApple||this.appleCollected) return 0;
    var d = Math.abs(angle-this.appleAngle)%360;
    if (d>180) d=360-d;
    if (d>=BLADE_APPLE_ARC) return 0;
    this.appleCollected = true;
    var bonus = Math.round(SCORE_APPLE*mult);
    this.spawnAppleBurst(this.goldenApple.x, this.goldenApple.y);
    SoundFX.appleSound();
    this.floatingText(blade.x, blade.y-20, '+'+bonus, COL_APPLE, 28, 60, 800);
    this.goldenApple.destroy(); this.goldenApple = null;
    var hud = this.scene.get('HUDScene'); if(hud) hud.punchScore();
    return bonus;
  }

  onStageComplete() {
    SoundFX.stageClear();
    var bonus = (this.stageParams.isBossStage?SCORE_BOSS_STAGE:SCORE_STAGE_BASE)*this.stageN;
    this.score += bonus; window.GameState.score = this.score;
    this.floatingText(GAME_W/2, LOG_CENTER_Y, '+'+bonus, COL_SCORE, 32, 70, 500);
    this.flashOverlay(COL_SUCCESS, 0.6, 300);
    var hud = this.scene.get('HUDScene'); if(hud) hud.punchScore();
    var self = this;
    this.tweens.add({targets:this.log, scaleX:0, scaleY:0, duration:300, ease:'Quad.In',
      onComplete:function(){self.time.delayedCall(100, function(){
        self.scene.restart({stage:self.stageN+1, score:self.score, continued:self.continued});
      });}
    });
  }

  onDeath() {
    if (this.gameOver) return;
    this.gameOver = true; this.input.enabled = false;
    SoundFX.clangSound(); this.cameras.main.shake(300, 0.015);
    this.flashOverlay(COL_DANGER, 0.75, 400);
    var isHS = false, prev = parseInt(localStorage.getItem('blade-spin_high_score')||'0');
    if (this.score>prev) {localStorage.setItem('blade-spin_high_score', this.score); isHS=true;}
    var self = this;
    this.time.delayedCall(500, function(){
      SoundFX.gameOver(); self.scene.stop('HUDScene'); self.scene.stop('GameScene');
      self.scene.start('GameOverScene', {
        score:self.score, stage:self.stageN, isHighScore:isHS,
        canContinue: AdsManager.canShowContinue()&&!self.continued
      });
    });
  }

  shutdown() {
    this.tweens.killAll(); this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
Object.assign(GameScene.prototype, GameEffects);
