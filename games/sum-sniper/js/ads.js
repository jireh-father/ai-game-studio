// Sum Sniper - Ad Hooks (POC placeholder)
const AdsManager = {
    _continueUsed: false,
    _doubleUsed: false,
    _gameOverCount: 0,

    showRewarded(type, callback) {
        if (type === 'continue' && !this._continueUsed) {
            this._continueUsed = true;
            if (callback) callback({ rewarded: true });
        } else if (type === 'double' && !this._doubleUsed) {
            this._doubleUsed = true;
            if (callback) callback({ rewarded: true });
        } else {
            if (callback) callback({ rewarded: false });
        }
    },

    showInterstitial(callback) {
        this._gameOverCount++;
        if (callback) callback();
    },

    canContinue() { return !this._continueUsed; },
    canDouble() { return !this._doubleUsed; },

    trackGameOver() {
        this._gameOverCount++;
    },

    resetSession() {
        this._continueUsed = false;
        this._doubleUsed = false;
        this._gameOverCount = 0;
    }
};
