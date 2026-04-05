const ADS = {
  gameOverCount: 0,
  continueUsed: false,

  showRewarded(rewardType, onRewarded, onClosed) {
    if (onRewarded) onRewarded();
    if (onClosed) onClosed();
  },

  showInterstitial(onClosed) {
    if (onClosed) onClosed();
  },

  canShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  onGameOver() {
    this.gameOverCount++;
  },

  resetSession() {
    this.continueUsed = false;
  }
};
