const AdsManager = {
  continueUsed: false,

  init() { this.continueUsed = false; },

  trackGameOver() {
    GameState.gameOverCount++;
    if (GameState.gameOverCount % 3 === 0) {
      this.showInterstitial(() => {});
    }
  },

  showInterstitial(onClose) {
    console.log('[ADS] Interstitial shown (placeholder)');
    if (onClose) setTimeout(onClose, 300);
  },

  showRewarded(onRewarded, onFailed) {
    console.log('[ADS] Rewarded ad shown (placeholder)');
    if (onRewarded) setTimeout(onRewarded, 300);
  },

  canContinue() { return !this.continueUsed; },

  useContinue(onDone) {
    this.continueUsed = true;
    this.showRewarded(() => {
      if (onDone) onDone();
    }, () => {});
  },

  resetRun() { this.continueUsed = false; }
};
