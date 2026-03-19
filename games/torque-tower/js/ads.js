// Torque Tower - Ad Placeholders (POC - no real ads)
const AdManager = {
  gameOverCount: 0,

  showInterstitial(onComplete) {
    if (onComplete) onComplete();
  },

  showRewarded(onReward, onSkip) {
    if (onReward) onReward();
  },

  trackGameOver() {
    this.gameOverCount++;
    return this.gameOverCount % 3 === 0;
  },

  shouldShowRewarded() {
    return this.gameOverCount === 1;
  }
};
