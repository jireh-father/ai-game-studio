// Shatter Chain - Wave Flow Logic (mixed into GameScene)

const FlowMixin = {
  onBallLost() {
    if (!this.ballInFlight) return;
    this.ballInFlight = false;
    this.removeBall();
    playBallLost();

    if (window.GameState.ballsLeft <= 0 && this.glassBodies.length > 0) {
      this.time.delayedCall(500, () => this.onWaveFailed());
    }
  },

  removeBall() {
    if (this.activeBall) {
      const ballBody = this.activeBall;
      this.activeBall = null;
      this.time.delayedCall(0, () => this.matter.world.remove(ballBody));
    }
    if (this.ballSprite) {
      if (this.ballSprite._spec) this.ballSprite._spec.destroy();
      this.ballSprite.destroy();
      this.ballSprite = null;
    }
  },

  onWaveClear() {
    if (!this.waveTimerActive) return;
    this.waveTimerActive = false;
    const gs = window.GameState;
    MetaProgress.addWaves(1);
    if (gs.is_daily_challenge) gs._daily_balls_used += (this.waveDiff.balls - gs.ballsLeft);

    const ballBonus = gs.ballsLeft * CFG.WAVE_CLEAR_BONUS;
    gs.score += ballBonus;

    const ballsUsed = this.waveDiff.balls - gs.ballsLeft;
    const isPerfect = ballsUsed === 1 && this.panelsDestroyedThisWave === this.totalPanels;
    if (isPerfect) {
      gs.score += CFG.PERFECT_CASCADE_BONUS;
      this.fx.perfectCascade();
    }

    const elapsed = this.time.now - this.waveStartTime;
    if (elapsed < CFG.SPEED_BONUS_TIME) gs.score += CFG.SPEED_BONUS;

    if (this.waveDiff.isRest) gs.score = Math.floor(gs.score * 1.5);

    if (gs.score > gs.highScore) {
      gs.highScore = gs.score;
      localStorage.setItem('shatter-chain_high_score', gs.highScore);
      playHighScore();
    }

    this.hudScore.setText(`${gs.score}`);
    this.fx.waveClearFlash();
    playWaveClear();
    this.removeBall();
    try { navigator.vibrate(200); } catch (e) {}

    const clearTxt = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2, 'WAVE CLEAR!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.CLEAR_HEX, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(400);

    // Check achievements after wave clear
    MetaProgress.updateMaxChain(this.maxChainDepth);
    const newAch = MetaProgress.checkAchievements();
    if (newAch.length > 0 && this.fx) newAch.forEach(a => this.fx.achievementToast(a.title));

    this.tweens.add({
      targets: clearTxt, alpha: 0, y: clearTxt.y - 30, duration: 600, delay: 800,
      onComplete: () => {
        clearTxt.destroy();
        gs.waveNumber++;
        if (gs.waveNumber % 5 === 1 && gs.waveNumber > 5) {
          AdManager.showInterstitial(() => this.scene.restart());
        } else {
          this.scene.restart();
        }
      }
    });
  },

  onWaveFailed() {
    if (!this.waveTimerActive) return;
    this.waveTimerActive = false;
    this.removeBall();

    this.fx.deathEffects(() => {
      if (AdManager.canContinue()) {
        this.showContinuePrompt();
      } else {
        this.gameOver();
      }
    });
  },

  showContinuePrompt() {
    const elems = [];
    const overlay = this.add.rectangle(CFG.WIDTH / 2, CFG.HEIGHT / 2, CFG.WIDTH, CFG.HEIGHT, 0x8B0000, 0.8).setDepth(500);
    elems.push(overlay);

    elems.push(this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 80, 'WAVE FAILED', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CFG.COLOR.DANGER_HEX, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(510));

    elems.push(this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 30, `${this.glassBodies.length} panels remaining`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#ccc',
    }).setOrigin(0.5).setDepth(510));

    const continueBtn = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 + 30, 'WATCH AD TO CONTINUE', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#000',
      backgroundColor: CFG.COLOR.SCORE_HEX, padding: { x: 20, y: 12 },
    }).setOrigin(0.5).setDepth(510).setInteractive({ useHandCursor: true });
    elems.push(continueBtn);

    const declineBtn = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 + 90, 'NO THANKS', {
      fontSize: '14px', fontFamily: 'Arial', color: '#999',
    }).setOrigin(0.5).setDepth(510).setInteractive({ useHandCursor: true });
    elems.push(declineBtn);

    const cleanup = () => elems.forEach(o => { if (o.active) o.destroy(); });

    continueBtn.on('pointerdown', () => {
      AdManager.useContinue();
      AdManager.showRewarded('continue', () => {
        cleanup();
        window.GameState.ballsLeft = 1;
        this.waveTimeLeft = this.waveDiff.timer;
        this.waveTimerActive = true;
        this.updateBallIndicators();
      });
    });

    declineBtn.on('pointerdown', () => { cleanup(); this.gameOver(); });

    this.time.delayedCall(5000, () => {
      if (overlay.active) { cleanup(); this.gameOver(); }
    });
  },

  gameOver() {
    const gs = window.GameState;
    if (gs.score > gs.highScore) {
      gs.highScore = gs.score;
      localStorage.setItem('shatter-chain_high_score', gs.highScore);
    }
    const hw = parseInt(localStorage.getItem('shatter-chain_highest_wave') || '0');
    if (gs.waveNumber > hw) localStorage.setItem('shatter-chain_highest_wave', gs.waveNumber);
    const bd = parseInt(localStorage.getItem('shatter-chain_best_chain_depth') || '0');
    if (this.maxChainDepth > bd) localStorage.setItem('shatter-chain_best_chain_depth', this.maxChainDepth);

    MetaProgress.addGame();
    MetaProgress.updateMaxChain(this.maxChainDepth);
    MetaProgress.checkAchievements();
    AdManager.onGameOver();

    const overData = { score: gs.score, wave: gs.waveNumber, chainDepth: this.maxChainDepth, isNewHigh: gs.score >= gs.highScore };
    if (gs.is_daily_challenge) {
      const elapsed = Date.now() - gs._daily_start_time;
      overData.is_daily = true;
      overData.daily_balls_used = gs._daily_balls_used;
      overData.daily_elapsed = elapsed;
      overData.daily_wave = gs.waveNumber;
    }
    this.scene.start('GameOverScene', overData);
  },
};
