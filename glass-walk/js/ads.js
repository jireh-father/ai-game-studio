// Glass Walk - Ad Placeholders (POC - no real SDK)
const Ads = {
  gameOverCount: 0,
  continueUsed: false,

  reset() {
    this.continueUsed = false;
  },

  canContinue() {
    return !this.continueUsed;
  },

  showRewarded(onReward, onSkip) {
    // Mock rewarded ad - simulate 1.5s ad then reward
    this.continueUsed = true;
    if (onReward) {
      setTimeout(() => onReward(), 200);
    }
  },

  showInterstitial(onComplete) {
    this.gameOverCount++;
    // Show interstitial every 3rd game over
    if (this.gameOverCount % 3 === 0) {
      if (onComplete) setTimeout(() => onComplete(), 200);
    } else {
      if (onComplete) onComplete();
    }
  },

  shouldShowInterstitial() {
    return (this.gameOverCount + 1) % 3 === 0;
  }
};
