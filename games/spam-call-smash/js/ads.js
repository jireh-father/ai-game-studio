// ads.js — POC stub (no real ads)
const AdManager = {
  ADS_ENABLED: false,
  showInterstitial(callback) { if (callback) callback(); },
  showRewarded(callback) { if (callback) callback(true); },
  showBanner() {},
  hideBanner() {}
};
