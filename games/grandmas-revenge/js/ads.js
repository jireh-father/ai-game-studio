// Ad trigger hooks — POC placeholder (no real ads)
const AdsManager = {
  showInterstitial(onClose) {
    console.log('[ADS] Interstitial placeholder');
    if (onClose) onClose();
  },
  showRewarded(onRewarded, onClose) {
    console.log('[ADS] Rewarded ad placeholder — granting reward');
    if (onRewarded) onRewarded();
    if (onClose) onClose();
  },
  shouldShowInterstitial() {
    return window.GS && window.GS.gamesPlayed > 0 && window.GS.gamesPlayed % 3 === 0;
  },
  incrementGameOver() {
    if (window.GS) window.GS.gamesPlayed++;
  }
};
