const ADS = {
    deathCount: 0,

    showInterstitial(onClose) {
        if (onClose) onClose();
    },

    showRewarded(onRewarded, onSkipped) {
        if (onRewarded) onRewarded();
    },

    trackDeathCount() {
        this.deathCount++;
        return this.deathCount % 3 === 0;
    },

    canShowContinue() {
        return window.GameState && !window.GameState.continueUsed;
    },

    resetSession() {
        this.deathCount = 0;
    }
};
