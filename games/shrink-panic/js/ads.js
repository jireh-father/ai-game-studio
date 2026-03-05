// Shrink Panic - Ad Integration (Placeholder)
const AdManager = {
  gameOverCount: 0,
  continueUsed: false,

  reset() {
    this.continueUsed = false;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    // Placeholder: simulate ad display
    console.log('[Ad] Interstitial shown (placeholder)');
    if (callback) setTimeout(callback, 300);
  },

  canShowRewarded() {
    return !this.continueUsed;
  },

  showRewarded(callback) {
    // Placeholder: simulate rewarded ad
    console.log('[Ad] Rewarded ad shown (placeholder)');
    this.continueUsed = true;
    if (callback) setTimeout(callback, 300);
  }
};
