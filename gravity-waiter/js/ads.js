// Gravity Waiter - Ad Manager (Placeholder)

const AdsManager = {
    gameOverCount: 0,
    continueUsed: false,

    init() {
        this.gameOverCount = 0;
        this.continueUsed = false;
    },

    resetSession() {
        this.continueUsed = false;
    },

    onGameOver() {
        this.gameOverCount++;
        if (this.gameOverCount % 3 === 0) {
            this.showInterstitial();
        }
    },

    showInterstitial() {
        console.log('[ADS] INTERSTITIAL AD TRIGGERED');
        if (window.adProvider && window.adProvider.showInterstitial) {
            window.adProvider.showInterstitial();
        }
    },

    showRewarded(callback) {
        console.log('[ADS] REWARDED AD TRIGGERED');
        if (window.adProvider && window.adProvider.showRewarded) {
            window.adProvider.showRewarded(callback);
        } else {
            // Dev mode: simulate ad watch after 1s
            setTimeout(() => {
                if (callback) callback(true);
            }, 1000);
        }
    },

    canContinue() {
        return !this.continueUsed;
    },

    markContinueUsed() {
        this.continueUsed = true;
    }
};
