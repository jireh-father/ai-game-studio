// Lag Shot - Ad Integration Placeholder (POC)
const AdsManager = {
  sessionGameOvers: 0,

  showInterstitial(onComplete) {
    this.sessionGameOvers++;
    // Show every 3rd game over
    if (this.sessionGameOvers % 3 === 0) {
      console.log('[Ads] Interstitial would show here');
    }
    if (onComplete) onComplete();
  },

  showRewarded(onRewarded, onSkipped) {
    console.log('[Ads] Rewarded ad would show here');
    if (onRewarded) onRewarded();
  },

  canShowContinue() {
    return !this._usedContinue;
  },

  markContinueUsed() {
    this._usedContinue = true;
  },

  resetSession() {
    this._usedContinue = false;
  }
};
