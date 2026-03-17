// Gravity Liar - Ad Manager (POC Placeholder)

const AdManager = {
  gameOverCount: 0,
  rewardedUsedThisGame: false,

  onGameOver() {
    this.gameOverCount++;
    console.log('[AdManager] Game over #' + this.gameOverCount);
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  showInterstitial(callback) {
    if (this.shouldShowInterstitial()) {
      console.log('[AdManager] Interstitial ad shown (placeholder)');
    }
    if (callback) callback();
  },

  canShowRewarded() {
    return !this.rewardedUsedThisGame;
  },

  showRewarded(callback) {
    if (!this.canShowRewarded()) return;
    console.log('[AdManager] Rewarded ad shown (placeholder)');
    this.rewardedUsedThisGame = true;
    if (callback) callback();
  },

  resetForNewGame() {
    this.rewardedUsedThisGame = false;
  }
};
