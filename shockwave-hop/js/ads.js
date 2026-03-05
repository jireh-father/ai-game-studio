// Shockwave Hop - Ad Placeholders (POC - No real ads)

const AdManager = {
  gameOverCount: 0,
  continueUsed: false,

  init() {
    this.gameOverCount = 0;
    this.continueUsed = false;
  },

  resetForNewGame() {
    this.continueUsed = false;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canContinue() {
    return !this.continueUsed;
  },

  showInterstitial(callback) {
    // POC: no real ad, just call callback
    if (callback) callback();
  },

  showRewarded(callback) {
    // POC: simulate ad watched, grant reward
    this.continueUsed = true;
    if (callback) callback(true);
  }
};
