const AdManager = {
  gameOverCount: 0,
  continueUsed: false,

  reset() {
    this.continueUsed = false;
  },

  onGameOver(score, continueCallback, noThanksCallback) {
    this.gameOverCount++;
    if (!this.continueUsed) {
      if (continueCallback) continueCallback();
    } else {
      if (noThanksCallback) noThanksCallback();
    }
  },

  showRewarded(type, rewardCallback) {
    console.log('[Ad] Rewarded ad shown: ' + type);
    if (type === 'continue') this.continueUsed = true;
    if (rewardCallback) {
      setTimeout(rewardCallback, 300);
    }
  },

  showInterstitial() {
    console.log('[Ad] Interstitial shown');
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  }
};
