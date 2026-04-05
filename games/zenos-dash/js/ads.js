// Zeno's Dash - Ad Placeholder Hooks (POC - no live ads)

const AdsManager = {
  gameOverCount: 0,

  showRewardedAd(type, callback) {
    // Placeholder: immediately grant reward
    console.log('[ADS] Rewarded ad requested:', type);
    if (callback) callback(type);
  },

  showInterstitial(callback) {
    // Placeholder: immediately continue
    console.log('[ADS] Interstitial shown');
    if (callback) callback();
  },

  onGameOver() {
    this.gameOverCount++;
    // Trigger interstitial every 3rd game over (not 1st)
    if (this.gameOverCount > 1 && this.gameOverCount % 3 === 0) {
      this.showInterstitial();
    }
  },

  reset() {
    this.gameOverCount = 0;
  }
};
