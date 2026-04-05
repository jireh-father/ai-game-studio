// Paradox Panic - Ad Trigger Points (Placeholder)
const AdsManager = {
  init() {
    // Placeholder: SDK init
  },

  onGameOver(deathCount) {
    if (deathCount > 0 && deathCount % 3 === 0) {
      this.showInterstitial();
    }
  },

  showInterstitial() {
    // Placeholder: interstitial ad
    console.log('[ADS] Interstitial would show here');
  },

  showContinueAd(callback) {
    // Placeholder: rewarded ad for continue
    console.log('[ADS] Rewarded continue ad shown');
    if (callback) callback({ rewarded: true });
  },

  showDoubleScoreAd(score, callback) {
    // Placeholder: rewarded ad for double score
    console.log('[ADS] Rewarded double score ad shown');
    if (callback) callback({ newScore: score * 2 });
  }
};
