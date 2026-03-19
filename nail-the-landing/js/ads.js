const AdManager = {
    _reviveUsed: false,
    _boostUsed: false,
    _gameOverCount: 0,

    reset() {
        this._reviveUsed = false;
        this._boostUsed = false;
        this._gameOverCount = 0;
    },

    showInterstitial(onComplete) {
        this._gameOverCount++;
        if (this._gameOverCount % 3 === 0) {
            console.log('[AdManager] Interstitial placeholder');
        }
        if (onComplete) onComplete();
    },

    showRewarded(onRewarded, onSkipped) {
        console.log('[AdManager] Rewarded ad placeholder');
        if (onRewarded) onRewarded();
    },

    canShowRevive() {
        return !this._reviveUsed;
    },

    useRevive() {
        this._reviveUsed = true;
    },

    canShowBoost() {
        return !this._boostUsed;
    },

    useBoost() {
        this._boostUsed = true;
    }
};
