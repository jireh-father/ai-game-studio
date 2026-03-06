// ads.js - Ad integration hooks (POC placeholder)

const AdManager = {
  gameOverCount: 0,
  continueUsed: false,
  shuffleUsed: false,

  reset() {
    this.continueUsed = false;
    this.shuffleUsed = false;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    // POC: no real ad, just call callback
    if (callback) setTimeout(callback, 100);
  },

  showRewarded(onReward, onSkip) {
    // POC: simulate watching ad - auto reward
    if (onReward) setTimeout(onReward, 200);
  },

  canContinue() {
    return !this.continueUsed;
  },

  canShuffle() {
    return !this.shuffleUsed;
  },

  onGameOver() {
    this.gameOverCount++;
  },
};
