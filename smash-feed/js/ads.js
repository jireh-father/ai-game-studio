var AdState = {
  gamesPlayed: 0,
  sessionContinueUsed: false,
  sessionDoubleUsed: false
};

function shouldShowInterstitial() {
  return AdState.gamesPlayed > 0 && AdState.gamesPlayed % 3 === 0;
}

function showInterstitial(onComplete) {
  console.log('[AD] Interstitial placeholder');
  if (onComplete) onComplete();
}

function showRewarded(onRewarded, onSkipped) {
  console.log('[AD] Rewarded placeholder');
  if (onRewarded) onRewarded();
}

function showBanner() {
  console.log('[AD] Banner placeholder');
}

function hideBanner() {
  console.log('[AD] Hide banner placeholder');
}
