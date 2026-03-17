const AdsManager = {
    gameOverCount: 0,
    continueUsed: false,
    doubleUsed: false,

    init: function() {
        this.gameOverCount = 0;
        this.continueUsed = false;
        this.doubleUsed = false;
    },

    resetSession: function() {
        this.continueUsed = false;
        this.doubleUsed = false;
    },

    onGameOver: function() {
        this.gameOverCount++;
    },

    shouldShowInterstitial: function() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    canShowContinue: function() {
        return !this.continueUsed;
    },

    canShowDouble: function() {
        return !this.doubleUsed;
    },

    showInterstitial: function(onClose) {
        console.log('[ADS] Interstitial shown (placeholder)');
        if (onClose) setTimeout(onClose, 300);
    },

    showRewarded: function(type, onRewarded, onSkipped) {
        console.log('[ADS] Rewarded ad shown for:', type);
        if (type === 'continue') {
            this.continueUsed = true;
            if (onRewarded) setTimeout(onRewarded, 300);
        } else if (type === 'double') {
            this.doubleUsed = true;
            if (onRewarded) setTimeout(onRewarded, 300);
        }
    },

    showBanner: function() {
        console.log('[ADS] Banner shown (placeholder)');
    },

    hideBanner: function() {
        console.log('[ADS] Banner hidden (placeholder)');
    }
};
