// Slingshot Stack - Ad Hooks (Placeholder)

class AdManager {
  constructor() {
    this.gamesPlayedSinceAd = 0;
    this.continueUsedThisGame = false;
  }

  resetForNewGame() {
    this.continueUsedThisGame = false;
  }

  canContinue() {
    return !this.continueUsedThisGame;
  }

  showRewarded(onReward) {
    console.log('[Ad] Rewarded ad requested');
    this.continueUsedThisGame = true;
    // Simulate ad watched — call reward immediately
    if (onReward) setTimeout(onReward, 300);
  }

  showInterstitial(onComplete) {
    this.gamesPlayedSinceAd++;
    if (this.gamesPlayedSinceAd >= 3) {
      console.log('[Ad] Interstitial shown');
      this.gamesPlayedSinceAd = 0;
    }
    if (onComplete) setTimeout(onComplete, 100);
  }
}

const adManager = new AdManager();
