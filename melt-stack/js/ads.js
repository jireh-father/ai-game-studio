// Melt Stack - Ad Placeholders (POC mode)
const AdsManager = {
  gameOverCount: 0,
  reviveUsed: false,

  onGameOver() {
    this.gameOverCount++;
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(onClose) {
    console.log('[Ads] Interstitial shown (placeholder)');
    if (onClose) onClose();
  },

  showRewarded(onReward) {
    console.log('[Ads] Rewarded ad shown (placeholder)');
    if (onReward) onReward();
  },

  canRevive() {
    return !this.reviveUsed;
  },

  resetForNewGame() {
    this.reviveUsed = false;
  }
};
