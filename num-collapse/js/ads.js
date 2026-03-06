// ads.js - Ad integration hooks, reward callbacks (placeholder)

const AdManager = {
  gameOverCount: 0,
  continueUsed: false,
  scoreDoubled: false,

  reset() {
    this.continueUsed = false;
    this.scoreDoubled = false;
  },

  trackGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    // Placeholder: simulate ad delay
    setTimeout(() => { if (callback) callback(); }, 500);
  },

  showRewarded(rewardType, callback) {
    // Placeholder: simulate watching ad
    setTimeout(() => {
      if (rewardType === 'continue') {
        this.continueUsed = true;
        if (callback) callback('continue');
      } else if (rewardType === 'doubleScore') {
        this.scoreDoubled = true;
        if (callback) callback('doubleScore');
      }
    }, 500);
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDoubleScore() {
    return !this.scoreDoubled;
  },

  showBanner() { /* placeholder */ },
  hideBanner() { /* placeholder */ }
};
