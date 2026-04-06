// ads.js — Ad hook placeholders, reward callbacks
window.Ads = {
  gameOverCount: 0,
  floorDropUsed: false,

  init() {
    this.gameOverCount = 0;
    this.floorDropUsed = false;
  },

  showInterstitial(onClose) {
    this.gameOverCount++;
    if (onClose) onClose();
  },

  showRewarded(rewardType, onRewarded, onSkipped) {
    if (rewardType === 'floor_drop' && !this.floorDropUsed) {
      this.floorDropUsed = true;
      if (onRewarded) onRewarded();
    } else {
      if (onSkipped) onSkipped();
    }
  },

  canShowFloorDrop() {
    return !this.floorDropUsed;
  },

  markFloorDropUsed() {
    this.floorDropUsed = true;
  },

  resetPerGame() {
    this.floorDropUsed = false;
  }
};
