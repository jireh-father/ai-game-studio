// ads.js — POC stub (no real ads)
const Ads = {
  deathCount: 0,
  showInterstitial(cb) { if (cb) cb(); },
  showRewarded(cb) { if (cb) cb(); },
  onDeath() {
    this.deathCount++;
    // Future: show interstitial every 3rd death
  }
};
