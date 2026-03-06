// ads.js - Ad integration placeholders

const AdManager = {
  _gameOverCount: 0,
  _continueUsed: false,
  _doubleScoreUsed: false,

  reset() {
    this._continueUsed = false;
    this._doubleScoreUsed = false;
  },

  onGameOver() {
    this._gameOverCount++;
  },

  shouldShowInterstitial() {
    return this._gameOverCount > 0 && this._gameOverCount % 3 === 0;
  },

  canContinue() {
    return !this._continueUsed;
  },

  canDoubleScore() {
    return !this._doubleScoreUsed;
  },

  showRewarded(type, callback) {
    // Placeholder: simulate ad watched successfully
    if (type === 'continue') {
      this._continueUsed = true;
    } else if (type === 'double') {
      this._doubleScoreUsed = true;
    }
    if (callback) setTimeout(callback, 300);
  },

  showInterstitial(callback) {
    // Placeholder: simulate interstitial
    if (callback) setTimeout(callback, 300);
  }
};
