// Liar's Tower — Ad placeholders (POC, no real SDK)
const AdsManager = {
  gameOverCount: 0,
  rewardedUsedThisSession: false,
  init() { this.gameOverCount = 0; this.rewardedUsedThisSession = false; },
  showInterstitial(cb) {
    this.gameOverCount++;
    if (this.gameOverCount % 3 === 0) {
      console.log('[ads] interstitial shown');
    }
    if (cb) cb();
  },
  showRewarded(cb) {
    if (this.rewardedUsedThisSession) { if (cb) cb(false); return; }
    this.rewardedUsedThisSession = true;
    console.log('[ads] rewarded ad shown');
    if (cb) cb(true);
  },
  canShowRewarded() { return !this.rewardedUsedThisSession; },
  showBanner() { console.log('[ads] banner shown'); },
};
