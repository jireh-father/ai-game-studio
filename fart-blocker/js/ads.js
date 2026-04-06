// ads.js — Ad trigger hooks, reward callbacks (POC mode — all no-ops)

const AdManager = {
  POC_MODE: true,
  gamesPlayed: 0,
  adsShownThisSession: 0,
  continueUsed: false,
  extraLifeUsed: false,
  doubleScoreUsed: false,

  reset() {
    this.continueUsed = false;
    this.extraLifeUsed = false;
    this.doubleScoreUsed = false;
  },

  onGameOver() {
    this.gamesPlayed++;
  },

  shouldShowInterstitial() {
    return this.gamesPlayed > 0 && this.gamesPlayed % 3 === 0;
  },

  showInterstitial(callback) {
    if (this.POC_MODE) {
      console.log('[Ad] Interstitial would show here');
      if (callback) setTimeout(callback, 100);
      return;
    }
  },

  canContinue() {
    return !this.continueUsed;
  },

  canExtraLife() {
    return !this.extraLifeUsed;
  },

  canDoubleScore() {
    return !this.doubleScoreUsed;
  },

  showRewarded(type, callback) {
    if (this.POC_MODE) {
      console.log('[Ad] Rewarded ad (' + type + ') — auto-rewarding in POC mode');
      if (type === 'continue') this.continueUsed = true;
      if (type === 'extraLife') this.extraLifeUsed = true;
      if (type === 'doubleScore') this.doubleScoreUsed = true;
      if (callback) setTimeout(() => callback(true), 100);
      return;
    }
  }
};
