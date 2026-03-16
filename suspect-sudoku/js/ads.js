// ads.js - Ad hooks (POC stubs)

const AdsManager = {
  gameOverCount: 0,
  usedContinue: false,
  usedMidRestore: false,
  usedDoubleScore: false,

  init() {
    this.gameOverCount = 0;
    this.usedContinue = false;
    this.usedMidRestore = false;
    this.usedDoubleScore = false;
    console.log('[Ads] POC mode - all ads are stubs');
  },

  resetForNewRun() {
    this.usedContinue = false;
    this.usedMidRestore = false;
    this.usedDoubleScore = false;
  },

  showInterstitial(onClosed) {
    console.log('[Ads] Interstitial shown (stub)');
    setTimeout(() => {
      if (onClosed) onClosed();
    }, 500);
  },

  showRewarded(onRewarded, onSkipped) {
    console.log('[Ads] Rewarded ad shown (stub)');
    setTimeout(() => {
      if (onRewarded) onRewarded();
    }, 500);
  },

  showBanner() {
    console.log('[Ads] Banner shown (stub)');
  },

  hideBanner() {
    console.log('[Ads] Banner hidden (stub)');
  },

  trackGameOver() {
    this.gameOverCount++;
    console.log('[Ads] Game over count:', this.gameOverCount);
  },

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  },

  canShowContinue() {
    return !this.usedContinue;
  },

  canShowMidRestore() {
    return !this.usedMidRestore;
  },

  canShowDoubleScore() {
    return !this.usedDoubleScore;
  }
};
