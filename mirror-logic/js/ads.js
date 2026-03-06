// Mirror Logic - Ad Placeholders (POC - no real ad SDK)

const AdManager = {
  gameOverCount: 0,
  continueUsed: false,
  scoreDoubleUsed: false,

  resetSession() {
    this.continueUsed = false;
    this.scoreDoubleUsed = false;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    // Placeholder: immediately call callback
    if (callback) callback();
  },

  showRewarded(onReward, onSkip) {
    // Placeholder: immediately call onReward
    if (onReward) onReward();
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDoubleScore() {
    return !this.scoreDoubleUsed;
  },

  onGameOver() {
    this.gameOverCount++;
  }
};
