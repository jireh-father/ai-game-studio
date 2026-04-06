// Pressure Cooker - Ad Hooks (POC - all no-ops)
const Ads = {
  showInterstitial: function(callback) {
    if (callback) callback();
  },
  showRewarded: function(rewardCallback, skipCallback) {
    if (skipCallback) skipCallback();
  },
  isRewardedAvailable: function() {
    return false;
  },
  onGameOver: function(callback) {
    if (callback) callback();
  }
};
