// Prime Butcher — ads.js (placeholder ad integration)

const AdsManager = {
  gameOverCount: 0,

  init() {
    this.gameOverCount = parseInt(localStorage.getItem('prime-butcher_go_count') || '0', 10);
  },

  showInterstitial(onClose) {
    // Placeholder: show every 3rd game over
    if (this.gameOverCount % 3 === 0 && this.gameOverCount > 0) {
      console.log('[ADS] Interstitial would show here');
    }
    if (onClose) onClose();
  },

  showRewarded(type, onRewarded, onSkipped) {
    // Placeholder: auto-reward for POC
    console.log('[ADS] Rewarded ad (' + type + ') would show here');
    if (type === 'continue') {
      // Clear stack to 50% — handled by restarting with preserved state
      if (onRewarded) onRewarded();
    } else {
      if (onSkipped) onSkipped();
    }
  },

  recordGameOver() {
    this.gameOverCount++;
    localStorage.setItem('prime-butcher_go_count', '' + this.gameOverCount);
    this.showInterstitial();
  }
};
