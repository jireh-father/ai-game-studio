// Balloon Pump Panic - Ad Integration (Placeholder)

const AdManager = {
    gameOverCount: 0,
    continueUsed: false,

    init() {
        this.gameOverCount = 0;
        this.continueUsed = false;
    },

    resetForNewGame() {
        this.continueUsed = false;
    },

    onGameOver() {
        this.gameOverCount++;
    },

    shouldShowInterstitial() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    canShowContinue() {
        return !this.continueUsed;
    },

    showInterstitial(callback) {
        // Placeholder: simulate ad display
        if (callback) setTimeout(callback, 100);
    },

    showRewarded(callback) {
        // Placeholder: simulate rewarded ad, grant reward immediately
        this.continueUsed = true;
        if (callback) setTimeout(callback, 100);
    }
};
