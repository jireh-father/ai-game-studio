// Wrong Map - Ad Placeholders (POC mode)
const ADS = {
  showRewarded: function(rewardCallback) {
    // POC: immediately grant reward
    if (rewardCallback) rewardCallback();
  },

  showInterstitial: function() {
    // POC: no-op
  },

  shouldShowInterstitial: function(deathCount) {
    return deathCount > 0 && deathCount % 5 === 0;
  }
};

window.ADS = ADS;
