const AdManager = {
  showInterstitial(onComplete) {
    if (onComplete) onComplete();
  },
  showRewarded(type, onRewarded, onSkipped) {
    // POC: immediately reward
    if (onRewarded) onRewarded();
  },
  trackAdEvent(type, result) {
    // Analytics stub
  }
};
