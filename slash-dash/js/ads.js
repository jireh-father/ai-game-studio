// Slash Dash - Ad Placeholders (POC stage)
const Ads = {
  continueUsed: false,
  doubleUsed: false,
  deathCount: 0,

  init() {
    this.continueUsed = false;
    this.doubleUsed = false;
    this.deathCount = 0;
  },

  showRewarded(onReward) {
    // Placeholder: simulate ad watch
    setTimeout(() => { if (onReward) onReward(); }, 300);
  },

  showInterstitial(onClose) {
    // Placeholder: simulate interstitial
    setTimeout(() => { if (onClose) onClose(); }, 300);
  },

  canContinue() {
    return !this.continueUsed;
  },

  canDoubleScore() {
    return !this.doubleUsed;
  },

  onDeath() {
    this.deathCount++;
  }
};
