// Echo Dodge - Ad Placeholders (POC mode)
const AdsManager = {
  deathCount: 0,
  rewardUsedThisSession: false,

  trackDeath() {
    this.deathCount++;
    if (this.deathCount % 3 === 0) {
      this.showInterstitial(() => {});
    }
  },

  showInterstitial(callback) {
    console.log('[Ads] Interstitial triggered (placeholder)');
    if (callback) callback();
  },

  showRewarded(callback) {
    if (this.rewardUsedThisSession) {
      console.log('[Ads] Rewarded already used this session');
      return;
    }
    console.log('[Ads] Rewarded ad triggered (placeholder)');
    this.rewardUsedThisSession = true;
    if (callback) callback();
  },

  resetSession() {
    this.rewardUsedThisSession = false;
  }
};
