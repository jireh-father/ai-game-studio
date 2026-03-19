// Stack Quake - Ad Stubs (POC - no real ads)

const AdManager = {
  gamesPlayed: 0,
  continueUsed: false,
  doubleScoreUsed: false,

  showInterstitial(onComplete) {
    // Stub: immediately complete
    if (onComplete) setTimeout(onComplete, 100);
  },

  showRewarded(onRewarded, onSkipped) {
    // Stub: immediately reward
    if (onRewarded) setTimeout(onRewarded, 100);
  },

  trackGameOver(sessionData) {
    this.gamesPlayed++;
  },

  shouldShowInterstitial() {
    return this.gamesPlayed > 0 && this.gamesPlayed % 3 === 0;
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDoubleScore() {
    return !this.doubleScoreUsed;
  },

  resetSession() {
    this.continueUsed = false;
    this.doubleScoreUsed = false;
  }
};
