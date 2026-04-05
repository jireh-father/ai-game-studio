// Set Surgeon - Ad Placeholders (POC - no real SDK)
const AdsManager = {
  gamesPlayed: 0,
  adContinueUsed: false,

  init() {
    this.gamesPlayed = 0;
    this.adContinueUsed = false;
  },

  showInterstitial(onClosed) {
    console.log('[ADS] Interstitial triggered');
    if (onClosed) onClosed();
  },

  showRewarded(onRewarded, onSkipped) {
    console.log('[ADS] Rewarded ad triggered');
    if (onRewarded) onRewarded();
  },

  showBanner() {
    console.log('[ADS] Banner shown');
  },

  hideBanner() {
    console.log('[ADS] Banner hidden');
  },

  trackEvent(name, data) {
    console.log('[ANALYTICS]', name, data || '');
  },

  shouldShowInterstitial() {
    this.gamesPlayed++;
    return this.gamesPlayed % 3 === 0;
  },

  canContinue() {
    return !this.adContinueUsed;
  },

  useContinue() {
    this.adContinueUsed = true;
  }
};
