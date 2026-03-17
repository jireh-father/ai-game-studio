// Speed Dating Dodge — Ad Hooks (POC placeholders)
const Ads = {
  gameOverCount: 0,
  extraLifeUsed: false,
  doubleScoreUsed: false,

  reset() {
    this.gameOverCount = 0;
    this.extraLifeUsed = false;
    this.doubleScoreUsed = false;
  },

  trackGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canOfferExtraLife() {
    return !this.extraLifeUsed;
  },

  canOfferDoubleScore() {
    return !this.doubleScoreUsed;
  },

  showInterstitial(onComplete) {
    // POC: skip ad, call immediately
    if (onComplete) onComplete();
  },

  showRewardedExtraLife(onRewarded, onSkipped) {
    // POC: simulate watching ad
    this.extraLifeUsed = true;
    if (onRewarded) onRewarded();
  },

  showRewardedDoubleScore(onRewarded, onSkipped) {
    this.doubleScoreUsed = true;
    if (onRewarded) onRewarded();
  }
};
