// Shatter Chain - Ad Manager (Placeholder)

const AdManager = {
  gamesPlayed: 0,
  continueUsed: false,
  scoreDoubled: false,

  reset() {
    this.continueUsed = false;
    this.scoreDoubled = false;
  },

  shouldShowInterstitial() {
    return this.gamesPlayed % 2 === 0 && this.gamesPlayed > 0;
  },

  showInterstitial(onClose) {
    console.log('[AD] Interstitial triggered');
    if (onClose) setTimeout(onClose, 300);
  },

  showRewarded(type, onRewarded, onDeclined) {
    console.log('[AD] Rewarded ad triggered:', type);
    // Placeholder: simulate ad watched
    if (onRewarded) setTimeout(onRewarded, 300);
  },

  canContinue() {
    return !this.continueUsed;
  },

  useContinue() {
    this.continueUsed = true;
  },

  canDoubleScore() {
    return !this.scoreDoubled;
  },

  useDoubleScore() {
    this.scoreDoubled = true;
  },

  onGameOver() {
    this.gamesPlayed++;
  },

  trackEvent(type, result) {
    console.log('[AD] Event:', type, result);
  }
};
