// Blade Spin - Ad Manager (Placeholder)
var AdsManager = {
  gameOverCount: 0,
  continueUsed: false,

  init: function() {
    this.gameOverCount = 0;
    this.continueUsed = false;
  },

  showInterstitial: function(onClose) {
    if (onClose) onClose();
  },

  showRewarded: function(type, onRewarded, onDismissed) {
    if (onRewarded) onRewarded();
  },

  canShowContinue: function() {
    return !this.continueUsed;
  },

  markContinueUsed: function() {
    this.continueUsed = true;
  },

  trackGameOver: function() {
    this.gameOverCount++;
  },

  shouldShowInterstitial: function() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  resetRun: function() {
    this.continueUsed = false;
  }
};
