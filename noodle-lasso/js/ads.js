// ads.js — Stub ad functions for POC

const AdsManager = {
  gamesPlayed: 0,

  // Show interstitial ad (every 3rd game over)
  showInterstitial(onClose) {
    this.gamesPlayed++;
    // TODO: integrate ad SDK here
    if (onClose) onClose();
  },

  // Show rewarded ad for extra life
  showRewarded(onReward, onSkip) {
    // TODO: integrate ad SDK here
    if (onSkip) onSkip();
  },

  // Check if rewarded ad is available
  isRewardedReady() {
    return false; // POC: always false
  }
};
