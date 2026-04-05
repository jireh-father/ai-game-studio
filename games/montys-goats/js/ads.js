// Monty's Goats - Ad Manager (POC placeholder)
const AdManager = {
  init() {
    // Placeholder — no real SDK
  },

  showInterstitial(onClose) {
    // POC: skip interstitials, just call callback
    if (onClose) onClose();
  },

  showRewarded(onRewarded, onSkipped) {
    // POC: auto-reward for testing
    if (onRewarded) onRewarded();
  },

  shouldShowInterstitial() {
    return GameState.gamesPlayed > 0 && GameState.gamesPlayed % 3 === 0;
  }
};
