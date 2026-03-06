// Fold Fit - Ad Placeholders (POC - no real ads)

const AdManager = {
  gameOverCount: 0,
  usedContinueThisRun: false,

  reset() {
    this.usedContinueThisRun = false;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    console.log('[Ad] Interstitial ad placeholder');
    this.gameOverCount++;
    if (callback) callback();
  },

  showRewarded(callback) {
    console.log('[Ad] Rewarded ad placeholder — granting reward');
    if (callback) callback(true);
  },

  canContinue() {
    return !this.usedContinueThisRun;
  },

  markContinueUsed() {
    this.usedContinueThisRun = true;
  }
};
