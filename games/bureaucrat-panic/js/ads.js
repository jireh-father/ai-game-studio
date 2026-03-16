// ads.js — Ad trigger points (placeholder implementation for POC)

const AdsManager = {
  deathCount: 0,
  continuedThisSession: false,

  reset() {
    this.deathCount = 0;
    this.continuedThisSession = false;
  },

  onGameOver() {
    this.deathCount++;
  },

  shouldShowInterstitial() {
    return this.deathCount > 0 && this.deathCount % 3 === 0;
  },

  canContinue() {
    return !this.continuedThisSession;
  },

  showRewardedContinue(onRewarded, onDismissed) {
    // POC: simulate ad watched, call reward immediately
    console.log('[ADS] Rewarded ad shown (placeholder)');
    this.continuedThisSession = true;
    if (onRewarded) onRewarded();
  },

  showInterstitial(onClosed) {
    // POC: skip interstitial, call closed immediately
    console.log('[ADS] Interstitial shown (placeholder)');
    if (onClosed) onClosed();
  },

  showBanner() {
    console.log('[ADS] Banner shown (placeholder)');
  },

  hideBanner() {
    console.log('[ADS] Banner hidden (placeholder)');
  }
};
