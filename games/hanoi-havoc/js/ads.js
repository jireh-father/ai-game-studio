// POC ad placeholders
const Ads = {
  gameOverCount: 0,
  showRewardedAd(callback) {
    // POC: immediate reward
    if (callback) callback();
  },
  showInterstitialAd() {
    // POC: no-op
  },
  checkInterstitialTrigger() {
    this.gameOverCount++;
    if (this.gameOverCount % 3 === 0) this.showInterstitialAd();
  }
};
