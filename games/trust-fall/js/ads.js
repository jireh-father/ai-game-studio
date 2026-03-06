// ads.js - Ad integration hooks (placeholder)

var AdManager = {
    gamesSinceAd: 0,
    continueUsed: false,
    doublerUsed: false,

    reset: function() {
        this.continueUsed = false;
    },

    resetSession: function() {
        this.doublerUsed = false;
    },

    canContinue: function() {
        return !this.continueUsed;
    },

    canDouble: function() {
        return !this.doublerUsed;
    },

    showInterstitial: function(callback) {
        this.gamesSinceAd++;
        if (this.gamesSinceAd >= 3) {
            this.gamesSinceAd = 0;
            console.log('[Ad] Interstitial placeholder');
        }
        if (callback) callback();
    },

    showRewarded: function(type, callback) {
        console.log('[Ad] Rewarded (' + type + ') placeholder');
        if (type === 'continue') this.continueUsed = true;
        else if (type === 'double') this.doublerUsed = true;
        if (callback) callback(true);
    },

    showBanner: function() {
        console.log('[Ad] Banner placeholder');
    }
};
