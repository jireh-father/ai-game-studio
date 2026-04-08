// ads.js - Placeholder ad hooks
window.AdsManager = {
  deathCount: 0,
  lifeAdUsed: false,
  init() { this.deathCount = 0; this.lifeAdUsed = false; },
  incrementDeathCount() { this.deathCount++; },
  tryShowInterstitial(onComplete) {
    if (this.deathCount % 3 === 0 && this.deathCount > 0) {
      setTimeout(() => onComplete && onComplete(), 300);
    } else {
      onComplete && onComplete();
    }
  },
  showRewarded(type, onRewarded, onSkipped) {
    // POC: immediately grant reward
    setTimeout(() => onRewarded && onRewarded(), 200);
  }
};
