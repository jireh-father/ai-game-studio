// Microwave Roulette - Ad Hooks (POC Placeholder)
const AdManager = {
  gameOverCount: 0,
  continueUsed: false,

  init() {
    this.gameOverCount = 0;
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

  showRewardedAd(type, callback) {
    // POC: immediately grant reward
    if (type === 'continue') {
      this.continueUsed = true;
      if (callback) callback(true);
    } else if (type === 'doubleScore') {
      if (callback) callback(true);
    }
  },

  showInterstitial(callback) {
    // POC: immediately proceed
    if (callback) callback();
  },

  resetSession() {
    this.continueUsed = false;
  },
};
