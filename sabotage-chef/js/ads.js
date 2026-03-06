// ads.js - Ad integration hooks, reward callbacks (placeholder)

var AdManager = {
    gamesPlayedThisSession: 0,
    continueUsed: false,
    doubleScoreUsed: false,

    reset: function() {
        this.continueUsed = false;
    },

    showInterstitial: function(callback) {
        // Placeholder: would show interstitial ad
        console.log('[AdManager] Interstitial ad placeholder');
        if (callback) callback();
    },

    showRewarded: function(type, callback) {
        // Placeholder: would show rewarded ad
        console.log('[AdManager] Rewarded ad placeholder - type:', type);
        if (type === 'continue') {
            this.continueUsed = true;
        } else if (type === 'doubleScore') {
            this.doubleScoreUsed = true;
        }
        if (callback) callback();
    },

    showBanner: function() {
        console.log('[AdManager] Banner ad placeholder - show');
    },

    hideBanner: function() {
        console.log('[AdManager] Banner ad placeholder - hide');
    },

    shouldShowInterstitial: function() {
        return this.gamesPlayedThisSession > 0 && this.gamesPlayedThisSession % 3 === 0;
    },

    canContinue: function() {
        return !this.continueUsed;
    },

    canDoubleScore: function() {
        return !this.doubleScoreUsed;
    },

    onGameStart: function() {
        this.gamesPlayedThisSession++;
        this.continueUsed = false;
    },

    onGameOver: function() {
        if (this.shouldShowInterstitial()) {
            this.showInterstitial();
        }
    }
};
