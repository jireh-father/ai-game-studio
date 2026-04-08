function initAds() { console.log('[ads] init'); }
function showRewardedAd(onReward) {
  console.log('[ads] rewarded shown');
  setTimeout(() => { if (onReward) onReward(true); }, 500);
}
function showInterstitial() { console.log('[ads] interstitial'); }
function trackGameOver(stage, score) { console.log('[ads] game over', stage, score); }
