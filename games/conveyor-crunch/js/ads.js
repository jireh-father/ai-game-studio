// Conveyor Crunch - Ad Hooks (Placeholder)
const AdManager = {
  gameOverCount: 0,
  continueUsed: false,
  pileClearUsed: false,

  reset() {
    this.continueUsed = false;
    this.pileClearUsed = false;
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

  canClearPile() {
    return !this.pileClearUsed;
  },

  showInterstitial(callback) {
    console.log('[AD] Interstitial shown');
    if (callback) setTimeout(callback, 300);
  },

  showRewarded(type, callback) {
    console.log('[AD] Rewarded ad shown for:', type);
    if (type === 'continue') {
      this.continueUsed = true;
    } else if (type === 'pile_clear') {
      this.pileClearUsed = true;
    }
    if (callback) setTimeout(() => callback(true), 300);
  },

  onAdLoaded() {},
  onAdClosed() {},
  onAdRewarded() {},
  onAdFailed() {}
};
