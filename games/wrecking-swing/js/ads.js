// Wrecking Swing - Ad Manager (POC: Stubs Only)
class AdManager {
  constructor() {
    this.interstitialCounter = 0;
  }

  showInterstitial(callback) {
    console.log('[Ad] Interstitial triggered');
    if (callback) callback();
  }

  showRewarded(callback) {
    console.log('[Ad] Rewarded ad triggered');
    if (callback) callback();
  }

  showBanner() {
    console.log('[Ad] Banner shown');
  }

  hideBanner() {
    console.log('[Ad] Banner hidden');
  }

  onStageComplete() {
    this.interstitialCounter++;
    if (this.interstitialCounter % 5 === 0) {
      this.showInterstitial();
    }
  }

  shouldShowRewarded(swingsUsed) {
    return swingsUsed >= 2;
  }
}

window.adManager = new AdManager();
