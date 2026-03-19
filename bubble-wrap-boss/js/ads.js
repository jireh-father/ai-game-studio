// ads.js — Ad placeholder hooks (POC stage, no live SDK)

const AdManager = {
  continueUsed: false,
  doubleUsed: false,
  deathCount: 0,

  reset() {
    this.continueUsed = false;
    this.doubleUsed = false;
    this.deathCount = 0;
  },

  showInterstitial(onClosed) {
    console.log('[Ad] Interstitial shown (placeholder)');
    setTimeout(() => {
      if (onClosed) onClosed();
    }, 500);
  },

  showRewarded(onReward, onSkip) {
    console.log('[Ad] Rewarded ad shown (placeholder)');
    setTimeout(() => {
      if (onReward) onReward();
    }, 300);
  },

  shouldShowInterstitial() {
    return this.deathCount > 0 && this.deathCount % 3 === 0;
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDouble() {
    return !this.doubleUsed;
  },

  trackDeath() {
    this.deathCount++;
  }
};
