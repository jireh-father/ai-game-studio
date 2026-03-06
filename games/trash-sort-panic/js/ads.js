// ads.js - Ad placeholder hooks, reward callbacks

const AdManager = {
    gameOverCount: 0,
    continueUsed: false,

    reset() {
        this.continueUsed = false;
    },

    onGameOver() {
        this.gameOverCount++;
    },

    shouldShowInterstitial() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    canContinue() {
        return !this.continueUsed;
    },

    showInterstitial(callback) {
        // Placeholder: call callback immediately
        console.log('[Ad] Interstitial placeholder');
        if (callback) callback();
    },

    showRewarded(onReward, onSkip) {
        // Placeholder: reward immediately for testing
        console.log('[Ad] Rewarded ad placeholder - rewarding');
        if (onReward) onReward();
    },

    useContinue() {
        this.continueUsed = true;
    }
};
