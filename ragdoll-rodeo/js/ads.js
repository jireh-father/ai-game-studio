// ads.js — Ad trigger points (POC placeholder)

const AdsManager = {
  gameOverCount: 0,
  continueUsed: false,

  trackGameOver() {
    this.gameOverCount++;
    console.log('[ADS] Game over #' + this.gameOverCount);
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitialIfReady(callback) {
    if (this.shouldShowInterstitial()) {
      console.log('[ADS] Interstitial would show here');
    }
    if (callback) callback();
  },

  showRewardedContinue(callback) {
    console.log('[ADS] Rewarded ad: continue from stage');
    if (callback) callback();
  },

  showRewardedDoubleScore(callback) {
    console.log('[ADS] Rewarded ad: double score');
    if (callback) callback();
  },

  resetSession() {
    this.continueUsed = false;
  }
};
