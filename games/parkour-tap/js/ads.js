// ads.js - Ad trigger points, reward callbacks, placeholder UI

const AdManager = {
  gameOverCount: 0,
  continueUsed: false,
  doubleScoreUsed: false,

  reset() {
    this.continueUsed = false;
    this.doubleScoreUsed = false;
  },

  resetSession() {
    this.gameOverCount = 0;
    this.doubleScoreUsed = false;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDoubleScore() {
    return !this.doubleScoreUsed;
  },

  showInterstitial(callback) {
    // Placeholder - simulate ad display
    console.log('[Ad] Interstitial shown');
    if (callback) setTimeout(callback, 300);
  },

  showRewarded(type, callback) {
    // Placeholder - simulate rewarded ad
    console.log('[Ad] Rewarded ad shown for:', type);
    if (type === 'continue') {
      this.continueUsed = true;
    } else if (type === 'double') {
      this.doubleScoreUsed = true;
    }
    if (callback) setTimeout(callback, 300);
  }
};
