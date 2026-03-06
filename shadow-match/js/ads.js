// Shadow Match - Ad Manager (POC: all placeholder)
const AdManager = {
    gameOverCount: 0,
    continueUsed: false,

    init() {
        this.gameOverCount = 0;
        this.continueUsed = false;
    },

    resetRun() {
        this.continueUsed = false;
    },

    shouldShowInterstitial() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    showInterstitial(callback) {
        console.log('[AdManager] Interstitial shown (placeholder)');
        if (callback) setTimeout(callback, 100);
    },

    showRewarded(callback) {
        console.log('[AdManager] Rewarded ad shown (placeholder)');
        if (callback) setTimeout(() => callback(true), 100);
    },

    canContinue() {
        return !this.continueUsed;
    },

    useContinue() {
        this.continueUsed = true;
    },

    onGameOver() {
        this.gameOverCount++;
    },

    showBanner() {
        console.log('[AdManager] Banner shown (placeholder)');
    },

    hideBanner() {
        console.log('[AdManager] Banner hidden (placeholder)');
    }
};
