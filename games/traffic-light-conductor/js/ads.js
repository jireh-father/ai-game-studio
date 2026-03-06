// ads.js - Ad SDK hooks (POC placeholders), reward callbacks, frequency tracking

const AdManager = {
    gameOverCount: 0,
    lastInterstitialTime: 0,
    continueUsed: false,
    doubleScoreUsed: false,

    reset: function() {
        this.continueUsed = false;
        this.doubleScoreUsed = false;
    },

    onGameOver: function() {
        this.gameOverCount++;
    },

    shouldShowInterstitial: function() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    showInterstitial: function(callback) {
        // POC: No actual ad SDK integrated
        console.log('[AdManager] Interstitial ad would show here');
        if (callback) callback();
    },

    canContinue: function() {
        return !this.continueUsed;
    },

    showRewardedContinue: function(callback) {
        // POC: No actual ad SDK integrated
        console.log('[AdManager] Rewarded ad (continue) would show here');
        this.continueUsed = true;
        if (callback) callback();
    },

    canDoubleScore: function() {
        return !this.doubleScoreUsed;
    },

    showRewardedDoubleScore: function(callback) {
        // POC: No actual ad SDK integrated
        console.log('[AdManager] Rewarded ad (double score) would show here');
        this.doubleScoreUsed = true;
        if (callback) callback();
    },

    showBanner: function() {
        // POC: No actual ad SDK integrated
        console.log('[AdManager] Banner ad would show here');
    },

    hideBanner: function() {
        // POC: No actual ad SDK integrated
        console.log('[AdManager] Banner ad hidden');
    }
};
