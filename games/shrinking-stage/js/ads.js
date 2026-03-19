// ads.js — Ad hook placeholders (POC stage — no real ad SDK)

const AdsManager = {
  _interstitialCount: 0,
  _continueUsed: false,
  _doubleScoreUsed: false,

  reset() {
    this._continueUsed = false;
    this._doubleScoreUsed = false;
  },

  onGameOver(score, stageReached) {
    this._interstitialCount++;
    if (this._interstitialCount % 3 === 0) {
      console.log('[ADS] Interstitial would show here (every 3rd game over)');
    }
    console.log(`[ADS] Game over. Score: ${score}, Stage: ${stageReached}`);
  },

  canContinue() {
    return !this._continueUsed;
  },

  showContinuePrompt(onAccept, onDecline) {
    console.log('[ADS] Rewarded ad: Continue prompt shown');
    // POC: simulate ad watched instantly
    this._continueUsed = true;
    if (onAccept) onAccept();
  },

  canDoubleScore() {
    return !this._doubleScoreUsed;
  },

  showDoubleScorePrompt(score, onAccept, onDecline) {
    console.log(`[ADS] Rewarded ad: Double score prompt (${score} → ${score * 2})`);
    this._doubleScoreUsed = true;
    if (onAccept) onAccept(score * 2);
  }
};
