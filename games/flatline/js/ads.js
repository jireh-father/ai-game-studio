// Flatline - Ad Manager (POC placeholder)
const AdManager = {
  gameOverCount: 0,
  defibUsedThisGame: false,
  scoreDoubleUsedThisSession: false,

  init() {
    this.gameOverCount = 0;
    this.defibUsedThisGame = false;
    this.scoreDoubleUsedThisSession = false;
  },

  onGameOver() {
    this.gameOverCount++;
    if (this.gameOverCount % 3 === 0) {
      this.showInterstitial();
    }
  },

  showInterstitial(callback) {
    console.log('[Ad] Interstitial shown (placeholder)');
    if (callback) setTimeout(callback, 300);
  },

  showDefib(callback) {
    if (this.defibUsedThisGame) return;
    this.defibUsedThisGame = true;
    console.log('[Ad] Rewarded: Defibrillate (placeholder)');
    if (callback) setTimeout(callback, 300);
  },

  showScoreDouble(callback) {
    if (this.scoreDoubleUsedThisSession) return;
    this.scoreDoubleUsedThisSession = true;
    console.log('[Ad] Rewarded: Score Double (placeholder)');
    if (callback) setTimeout(callback, 300);
  },

  resetForNewGame() {
    this.defibUsedThisGame = false;
  },

  canDefib() {
    return !this.defibUsedThisGame;
  },

  canDoubleScore() {
    return !this.scoreDoubleUsedThisSession;
  }
};
