// ads.js — Ad trigger points, reward callbacks, placeholder UI

const AdManager = {
  gameOverCount: 0,
  continueUsedSession: false,
  doubleScoreUsedSession: false,
  isDevMode: false,

  init() {
    this.isDevMode = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';
    this.continueUsedSession = false;
    this.doubleScoreUsedSession = false;
    this.gameOverCount = 0;
  },

  resetSession() {
    this.continueUsedSession = false;
    this.doubleScoreUsedSession = false;
    this.gameOverCount = 0;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canShowContinue() {
    return !this.continueUsedSession;
  },

  canShowDoubleScore() {
    return !this.doubleScoreUsedSession;
  },

  showInterstitial(scene, callback) {
    console.log('AD: interstitial');
    if (this.isDevMode) {
      // Dev mode: show placeholder overlay for 1.5s
      const overlay = scene.add.rectangle(
        CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
        CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x000000, 0.85
      ).setDepth(200);
      const text = scene.add.text(
        CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 20,
        'INTERSTITIAL AD\n(Dev Placeholder)', {
        fontSize: '22px', fill: '#FFFFFF', align: 'center',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(201);
      const skipText = scene.add.text(
        CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 40,
        'Auto-closing...', {
        fontSize: '14px', fill: '#AAAAAA', align: 'center',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(201);

      scene.time.delayedCall(1500, () => {
        overlay.destroy();
        text.destroy();
        skipText.destroy();
        if (callback) callback();
      });
    } else {
      // Production: call ad SDK
      console.log('AD: would show real interstitial');
      if (callback) callback();
    }
  },

  showRewardedContinue(scene, onRewarded, onDeclined) {
    console.log('AD: rewarded continue');
    if (this.isDevMode) {
      // Auto-reward after 1s in dev mode
      scene.time.delayedCall(1000, () => {
        this.continueUsedSession = true;
        if (onRewarded) onRewarded();
      });
    } else {
      console.log('AD: would show real rewarded ad');
      this.continueUsedSession = true;
      if (onRewarded) onRewarded();
    }
  },

  showRewardedDoubleScore(scene, onRewarded, onDeclined) {
    console.log('AD: rewarded double score');
    if (this.isDevMode) {
      scene.time.delayedCall(1000, () => {
        this.doubleScoreUsedSession = true;
        if (onRewarded) onRewarded();
      });
    } else {
      console.log('AD: would show real rewarded ad');
      this.doubleScoreUsedSession = true;
      if (onRewarded) onRewarded();
    }
  },
};
