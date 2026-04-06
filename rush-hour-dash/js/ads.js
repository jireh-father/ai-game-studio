// Rush Hour Dash - Ads Manager (POC placeholder)
var AdsManager = {
  gameOverCount: 0,
  lastInterstitialTime: 0,
  continueUsedThisSession: false,
  doubleUsedThisSession: false,

  onDeath: function(callbacks) {
    if (!this.continueUsedThisSession) {
      callbacks.showContinue(function() {
        AdsManager.continueUsedThisSession = true;
        callbacks.onContinue();
      }, callbacks.onSkip);
    } else {
      callbacks.onSkip();
    }
  },

  onGameOver: function(callbacks) {
    this.gameOverCount++;
    if (this.gameOverCount % 3 === 0) {
      var now = Date.now();
      if (now - this.lastInterstitialTime > 90000) {
        this.lastInterstitialTime = now;
        this.showInterstitial(callbacks.onClose || function() {});
      } else if (callbacks.onClose) {
        callbacks.onClose();
      }
    } else if (callbacks.onClose) {
      callbacks.onClose();
    }
  },

  showInterstitial: function(onClose) {
    if (onClose) onClose();
  },

  showRewarded: function(onRewarded, onSkipped) {
    if (onRewarded) onRewarded();
  },

  reset: function() {
    this.gameOverCount = 0;
    this.lastInterstitialTime = 0;
    this.continueUsedThisSession = false;
    this.doubleUsedThisSession = false;
  }
};
