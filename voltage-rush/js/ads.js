// Voltage Rush - Ad Hooks (POC Stubs)
var Ads = {
    gameOverCount: 0,
    continueUsed: false,

    reset: function() {
        this.continueUsed = false;
    },

    onGameOver: function() {
        this.gameOverCount++;
    },

    shouldShowInterstitial: function() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    showInterstitial: function(callback) {
        console.log('[Ads] Interstitial shown (stub)');
        if (callback) setTimeout(callback, 300);
    },

    showRewarded: function(callback) {
        console.log('[Ads] Rewarded ad shown (stub)');
        this.continueUsed = true;
        if (callback) setTimeout(callback, 300);
    },

    canContinue: function() {
        return !this.continueUsed;
    }
};
