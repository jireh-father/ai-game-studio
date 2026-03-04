// Ad Manager - POC stub implementation
// All methods are no-ops. Structure ready for real ad network insertion.

const AdManager = {
  initialized: false,
  gamesPlayed: 0,

  init() {
    this.initialized = true;
    this.gamesPlayed = 0;
  },

  showInterstitial(callback) {
    // POC: skip ad, call callback immediately
    if (callback) callback();
  },

  showRewarded(rewardCallback, skipCallback) {
    // POC: skip ad, call skip callback immediately
    if (skipCallback) skipCallback();
  },

  showBanner() {
    // POC: no-op
  },

  hideBanner() {
    // POC: no-op
  },

  onGameOver() {
    this.gamesPlayed++;
  }
};
