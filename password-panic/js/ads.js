// ads.js - Ad trigger points, reward callbacks, placeholder UI

const AdManager = {
  gameOverCount: 0,
  reviveUsedThisRun: false,
  scoreDoubledThisSession: false,

  reset() {
    this.reviveUsedThisRun = false;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canRevive() {
    return !this.reviveUsedThisRun;
  },

  canDoubleScore() {
    return !this.scoreDoubledThisSession;
  },

  showInterstitial(callback) {
    // Placeholder: in production, show interstitial ad
    console.log('[Ad] Interstitial would show here');
    if (callback) setTimeout(callback, 100);
  },

  showRewarded(type, callback) {
    // Placeholder: in production, show rewarded ad
    console.log('[Ad] Rewarded ad (' + type + ') would show here');
    if (type === 'revive') {
      this.reviveUsedThisRun = true;
      if (callback) callback('revive');
    } else if (type === 'double') {
      this.scoreDoubledThisSession = true;
      if (callback) callback('double');
    }
  }
};
