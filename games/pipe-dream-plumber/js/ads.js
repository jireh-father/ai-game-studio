// ads.js - Ad hooks, reward callbacks, frequency tracking (placeholder)

class AdsManager {
  constructor() {
    this.gameOverCount = 0;
    this.continueUsed = false;
    this.doubleScoreUsed = false;
  }

  resetGame() {
    this.continueUsed = false;
  }

  resetSession() {
    this.doubleScoreUsed = false;
  }

  onGameOver() {
    this.gameOverCount++;
  }

  shouldShowInterstitial() {
    return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
  }

  canShowContinue() {
    return !this.continueUsed;
  }

  canShowDoubleScore() {
    return !this.doubleScoreUsed;
  }

  showInterstitial(callback) {
    // Placeholder: simulate ad display
    console.log('[Ad] Interstitial shown');
    if (callback) setTimeout(callback, 200);
  }

  showRewarded(type, callback) {
    // Placeholder: simulate rewarded ad
    console.log(`[Ad] Rewarded (${type}) shown`);
    if (type === 'continue') this.continueUsed = true;
    if (type === 'double') this.doubleScoreUsed = true;
    if (callback) setTimeout(() => callback(true), 200);
  }
}

const adsManager = new AdsManager();
