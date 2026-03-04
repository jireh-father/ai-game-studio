// Escalator Chaos - Ad Stubs (POC)
const ADS = {
  showInterstitial() {
    console.log('[ADS] Interstitial triggered (stub)');
  },
  showRewarded(callback) {
    console.log('[ADS] Rewarded triggered (stub)');
    if (callback) callback(true);
  }
};
