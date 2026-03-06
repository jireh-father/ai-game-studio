// ============================================================
// ads.js - Ad hooks, reward callbacks, frequency tracking
// ============================================================

const AdManager = {
    gameOverCount: 0,
    continueUsedThisSession: false,
    supplyUsedStages: {},

    canShowContinueAd() {
        return !this.continueUsedThisSession;
    },

    canShowSupplyAd(stageNumber) {
        return stageNumber % 5 === 0 && !this.supplyUsedStages[stageNumber];
    },

    showInterstitial() {
        // Placeholder: every 3rd game over
        this.gameOverCount++;
        if (this.gameOverCount % 3 === 0) {
            console.log('[Ad] Interstitial would show here');
        }
    },

    showRewardedContinue(callback) {
        // Placeholder: simulate rewarded ad
        console.log('[Ad] Rewarded Continue ad would show here');
        this.continueUsedThisSession = true;
        // Simulate reward after short delay
        setTimeout(() => {
            if (callback) callback(true);
        }, 500);
    },

    showRewardedSupply(stageNumber, callback) {
        // Placeholder: simulate rewarded ad for +5 walls
        console.log('[Ad] Rewarded Supply ad would show here');
        this.supplyUsedStages[stageNumber] = true;
        setTimeout(() => {
            if (callback) callback(true);
        }, 500);
    },

    showRewardedDouble(callback) {
        // Placeholder: simulate double score ad
        console.log('[Ad] Rewarded Double Score ad would show here');
        setTimeout(() => {
            if (callback) callback(true);
        }, 500);
    },

    resetSession() {
        this.continueUsedThisSession = false;
        this.supplyUsedStages = {};
    },

    onAdLoaded() {},
    onAdClosed() {},
    onAdRewarded() {},
    onAdFailed() {},
};
