// ads.js - Ad integration hooks (placeholder, POC stage)
const AdManager = {
  gamesPlayed: 0,

  shouldShowInterstitial() {
    return this.gamesPlayed > 0 && this.gamesPlayed % 3 === 0;
  },

  showInterstitial(callback) {
    // Placeholder: immediately call callback
    if (callback) callback();
  },

  showRewarded(callback) {
    // Placeholder: immediately grant reward
    if (callback) callback(true);
  },

  onContinueReward() {
    // Clear 2 explosions and resume
    return { type: 'continue', value: 2 };
  },

  onDoubleScoreReward(score) {
    return { type: 'doubleScore', value: score * 2 };
  }
};
