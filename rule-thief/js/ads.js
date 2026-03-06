// ads.js - Ad hooks, reward callbacks, interstitial frequency tracking

const AdState = {
    gameOverCount: 0,
    extraLifeUsed: false,
    hintRefillUsed: false,
    scoreDoubleUsed: false
};

function resetAdStatePerGame() {
    AdState.extraLifeUsed = false;
    AdState.scoreDoubleUsed = false;
}

function resetAdStatePerSession() {
    AdState.hintRefillUsed = false;
}

function shouldShowInterstitial() {
    return AdState.gameOverCount > 0 && AdState.gameOverCount % 3 === 0;
}

function showInterstitial(callback) {
    // Placeholder: In production, integrate real ad SDK
    console.log('[AD] Interstitial would show here');
    if (callback) setTimeout(callback, 100);
}

function showRewarded(type, callback) {
    // Placeholder: In production, integrate real ad SDK
    console.log(`[AD] Rewarded ad (${type}) would show here`);
    // Simulate reward granted
    if (callback) setTimeout(() => callback(true), 100);
}

function canShowExtraLife() {
    return !AdState.extraLifeUsed;
}

function onExtraLifeGranted() {
    AdState.extraLifeUsed = true;
}

function canShowScoreDouble() {
    return !AdState.scoreDoubleUsed;
}

function onScoreDoubleGranted() {
    AdState.scoreDoubleUsed = true;
}

function incrementGameOverCount() {
    AdState.gameOverCount++;
}
