// ads.js — Ad trigger points (placeholder implementation)

var Ads = {
  gameOverCount: 0,
  continueUsed: false,

  init: function() {
    this.gameOverCount = 0;
    this.continueUsed = false;
  },

  resetRun: function() {
    this.continueUsed = false;
  },

  showInterstitial: function(callback) {
    this.gameOverCount++;
    if (this.gameOverCount % 3 === 0) {
      // Placeholder: would show interstitial ad
      console.log('[Ads] Interstitial triggered (placeholder)');
      setTimeout(callback, 100);
    } else {
      callback();
    }
  },

  showRewarded: function(onRewarded, onSkipped) {
    // Placeholder: would show rewarded ad
    console.log('[Ads] Rewarded ad triggered (placeholder)');
    if (onRewarded) onRewarded();
  },

  canContinue: function() {
    return !this.continueUsed;
  },

  markContinueUsed: function() {
    this.continueUsed = true;
  }
};
