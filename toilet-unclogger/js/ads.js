// Toilet Unclogger - Ad Placeholder Hooks (POC - no real ads)
const AdManager = {
  gamesOverCount: 0,
  continueUsed: false,
  emergencyDrainUsed: false,
  INTERSTITIAL_FREQ: 3,

  resetRun() {
    this.continueUsed = false;
    this.emergencyDrainUsed = false;
  },

  canShowContinue() {
    return !this.continueUsed;
  },

  canShowEmergencyDrain() {
    return !this.emergencyDrainUsed;
  },

  showInterstitial(callback) {
    this.gamesOverCount++;
    if (this.gamesOverCount % this.INTERSTITIAL_FREQ === 0) {
      console.log('[AD] Interstitial placeholder shown');
      setTimeout(() => {
        console.log('[AD] Interstitial complete');
        if (callback) callback();
      }, 500);
    } else {
      if (callback) callback();
    }
  },

  showRewarded(type, callback) {
    console.log(`[AD] Rewarded ad placeholder: ${type}`);
    if (type === 'continue') this.continueUsed = true;
    if (type === 'emergency_drain') this.emergencyDrainUsed = true;
    // Simulate ad with short delay
    setTimeout(() => {
      console.log(`[AD] Rewarded complete: ${type}`);
      if (callback) callback(true);
    }, 800);
  },

  logEvent(eventName, data) {
    console.log(`[AD_EVENT] ${eventName}`, data || '');
  }
};
