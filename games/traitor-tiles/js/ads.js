const ADS = {
  gameOverCount: 0,
  continueUsed: false,
  doubleUsed: false,

  resetSession() {
    ADS.continueUsed = false;
    ADS.doubleUsed = false;
    ADS.gameOverCount = 0;
  },

  showRewarded(type, callback) {
    console.log(`[ADS] Rewarded ad requested: ${type}`);
    if (type === 'continue') ADS.continueUsed = true;
    if (type === 'double') ADS.doubleUsed = true;
    setTimeout(() => { callback(true); }, 500);
  },

  showInterstitial() {
    console.log('[ADS] Interstitial ad shown');
  },

  trackGameOver() {
    ADS.gameOverCount++;
    return ADS.gameOverCount % 3 === 0;
  },

  canContinue() {
    return !ADS.continueUsed;
  },

  canDouble() {
    return !ADS.doubleUsed;
  }
};
