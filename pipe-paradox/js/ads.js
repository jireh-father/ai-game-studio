// ads.js - Ad integration placeholders

const AdManager = {
  interstitialCount: 0,
  overflowAdUsed: false,
  scoreDoubleUsed: false,

  reset() {
    this.overflowAdUsed = false;
    this.scoreDoubleUsed = false;
  },

  showInterstitial(callback) {
    this.interstitialCount++;
    // Placeholder: show interstitial every 3rd game over
    if (this.interstitialCount % 3 === 0) {
      console.log('[AD] Interstitial would show here');
      // Simulate ad delay
      setTimeout(() => { if (callback) callback(); }, 500);
    } else {
      if (callback) callback();
    }
  },

  showRewarded(type, callback) {
    console.log(`[AD] Rewarded ad (${type}) would show here`);
    // Simulate reward granted
    setTimeout(() => { if (callback) callback(); }, 300);
  },

  canShowOverflowAd() {
    return !this.overflowAdUsed;
  },

  canShowScoreDouble() {
    return !this.scoreDoubleUsed;
  },

  onOverflowRemoved(callback) {
    this.overflowAdUsed = true;
    this.showRewarded('overflow_remove', callback);
  },

  onScoreDoubled(callback) {
    this.scoreDoubleUsed = true;
    this.showRewarded('score_double', callback);
  }
};
