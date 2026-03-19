// ads.js — Ad trigger points, reward callbacks, placeholder UI

const ADS = {
  _gameOverCount: 0,
  _continueUsed: false,
  _doubleUsed: false,

  init() {
    this._gameOverCount = 0;
    this._continueUsed = false;
    this._doubleUsed = false;
  },

  resetSession() {
    this._continueUsed = false;
    this._doubleUsed = false;
    this._gameOverCount = 0;
  },

  trackGameOver() {
    this._gameOverCount++;
  },

  shouldShowInterstitial() {
    return this._gameOverCount > 1 && this._gameOverCount % 3 === 0;
  },

  canContinue() {
    return !this._continueUsed;
  },

  canDoubleScore() {
    return !this._doubleUsed;
  },

  showInterstitial(onComplete) {
    // Placeholder — simulate ad with brief delay
    console.log('[ADS] Interstitial shown');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300);
  },

  showRewarded(rewardType, onRewarded, onDeclined) {
    // Placeholder — auto-reward for POC
    console.log('[ADS] Rewarded ad shown for:', rewardType);
    if (rewardType === 'continue') {
      this._continueUsed = true;
    } else if (rewardType === 'double') {
      this._doubleUsed = true;
    }
    if (onRewarded) onRewarded();
  }
};
