// Copycat Killer - Ads Manager (Stub)

const AdsManager = {
  triggerInterstitial(onComplete) {
    if (onComplete) onComplete();
  },
  triggerRewarded(onReward, onSkip) {
    if (onReward) onReward();
  }
};

const SessionAdTracker = {
  deathCount: 0,
  continueUsed: false,
  doubleScoreUsed: false,

  recordDeath() {
    this.deathCount++;
  },
  shouldShowInterstitial() {
    return this.deathCount > 0 && this.deathCount % 3 === 0;
  },
  canContinue() {
    return !this.continueUsed;
  },
  useContinue() {
    this.continueUsed = true;
  },
  canDoubleScore() {
    return !this.doubleScoreUsed;
  },
  useDoubleScore() {
    this.doubleScoreUsed = true;
  },
  reset() {
    this.deathCount = 0;
    this.continueUsed = false;
    this.doubleScoreUsed = false;
  }
};
