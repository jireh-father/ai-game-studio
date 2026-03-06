// ads.js — Ad integration placeholders (POC stage)

const AdManager = {
  _gameOverCount: 0,

  shouldShowInterstitial() {
    return this._gameOverCount > 0 && this._gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    this._gameOverCount++;
    if (this.shouldShowInterstitial()) {
      // Placeholder: simulate ad delay
      setTimeout(() => { if (callback) callback(); }, 500);
    } else {
      if (callback) callback();
    }
  },

  showRewarded(onReward, onSkip) {
    // Placeholder: simulate rewarded ad
    // In production, replace with real ad SDK call
    const watched = false; // Always skip in POC
    if (watched) {
      setTimeout(() => { if (onReward) onReward(); }, 1000);
    } else {
      if (onSkip) onSkip();
    }
  },

  onGameOver() {
    this._gameOverCount++;
  },

  reset() {
    this._gameOverCount = 0;
  }
};
