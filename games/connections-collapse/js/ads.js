// Ad placeholder
const Ads = {
  showRewarded(onReward) {
    // placeholder: instantly "reward"
    setTimeout(() => { if (onReward) onReward(); }, 400);
  },
  showInterstitial() {}
};
