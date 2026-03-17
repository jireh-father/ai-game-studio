// Echo Strike - Ad Manager (POC Placeholder)
const AdsManager = {
  gamesPlayed: 0,
  continueUsed: false,

  init() {
    this.gamesPlayed = 0;
    this.continueUsed = false;
  },

  trackGameOver() {
    this.gamesPlayed++;
    if (this.gamesPlayed % 3 === 0) {
      this.showInterstitial(() => {});
    }
  },

  showInterstitial(callback) {
    console.log('[ADS] Interstitial shown (placeholder)');
    if (callback) setTimeout(callback, 300);
  },

  showRewarded(type, callback) {
    console.log(`[ADS] Rewarded ad: ${type} (placeholder)`);
    if (type === 'continue') this.continueUsed = true;
    if (callback) setTimeout(() => callback(true), 300);
  },

  canContinue() {
    return !this.continueUsed;
  },

  resetSession() {
    this.continueUsed = false;
  }
};
