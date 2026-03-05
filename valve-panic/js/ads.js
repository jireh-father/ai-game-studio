// Valve Panic - Ad Integration (Placeholder)

const Ads = {
    gameOverCount: 0,
    continueUsed: false,
    scoreDoubled: false,

    reset() {
        this.continueUsed = false;
        this.scoreDoubled = false;
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

    showRewardedContinue(onRewarded, onFailed) {
        // Placeholder: simulate ad watched
        console.log('[Ads] Rewarded Continue ad shown');
        this.continueUsed = true;
        if (onRewarded) onRewarded();
    },

    showRewardedDouble(onRewarded, onFailed) {
        console.log('[Ads] Rewarded Double Score ad shown');
        this.scoreDoubled = true;
        if (onRewarded) onRewarded();
    },

    showInterstitial(onClosed) {
        console.log('[Ads] Interstitial ad shown');
        if (onClosed) setTimeout(onClosed, 500);
    },

    showBanner() {
        console.log('[Ads] Banner shown on menu');
    },

    hideBanner() {
        console.log('[Ads] Banner hidden');
    }
};
