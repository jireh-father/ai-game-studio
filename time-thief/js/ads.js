// ads.js - Ad trigger points, reward callbacks, placeholder UI
const AdManager = {
    gameOverCount: 0,
    reviveUsed: false,
    scoreDoubled: false,
    interstitialFrequency: 3,

    reset() {
        this.reviveUsed = false;
        this.scoreDoubled = false;
    },

    onGameOver() {
        this.gameOverCount++;
    },

    shouldShowInterstitial() {
        return this.gameOverCount > 0 && this.gameOverCount % this.interstitialFrequency === 0;
    },

    canRevive() {
        return !this.reviveUsed;
    },

    canDoubleScore() {
        return !this.scoreDoubled;
    },

    showInterstitial(callback) {
        // Placeholder: simulate ad display
        console.log('[Ad] Interstitial shown');
        if (callback) setTimeout(callback, 300);
    },

    showRewardedRevive(callback) {
        // Placeholder: simulate rewarded ad
        console.log('[Ad] Rewarded revive ad shown');
        this.reviveUsed = true;
        if (callback) setTimeout(() => callback(true), 300);
    },

    showRewardedDouble(callback) {
        console.log('[Ad] Rewarded score double ad shown');
        this.scoreDoubled = true;
        if (callback) setTimeout(() => callback(true), 300);
    }
};
