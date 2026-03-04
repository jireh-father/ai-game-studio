// Ad integration stubs — POC build, no real ads
const Ads = {
  init() {},
  showInterstitial(onComplete) { if (onComplete) onComplete(); },
  showRewarded(onRewarded, onSkip) { if (onSkip) onSkip(); },
  showBanner() {},
  hideBanner() {}
};
