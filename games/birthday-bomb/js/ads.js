// Birthday Bomb - Ad Manager (POC Placeholder)

var AdsManager = {
  gameOverCount: 0,
  reviveUsed: false,

  showRewarded: function(callback) {
    // POC: immediately grant reward
    if (callback) callback(true);
  },

  showInterstitial: function(callback) {
    // POC: skip interstitial
    if (callback) callback();
  },

  showBanner: function() {
    // POC: no-op
  },

  hideBanner: function() {
    // POC: no-op
  },

  onGameOver: function() {
    this.gameOverCount++;
  },

  shouldShowInterstitial: function() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  resetSession: function() {
    this.reviveUsed = false;
  }
};
