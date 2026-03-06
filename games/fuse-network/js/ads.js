// ads.js - Ad integration hooks and reward callbacks (placeholder)
const AdManager = {
    _gameOverCount: 0,
    _continueUsed: false,
    _kitEarned: false,
    _scoreDoubled: false,

    resetSession() {
        this._gameOverCount = 0;
        this._continueUsed = false;
        this._kitEarned = false;
        this._scoreDoubled = false;
    },

    resetGame() {
        this._continueUsed = false;
        this._scoreDoubled = false;
    },

    onGameOver() {
        this._gameOverCount++;
    },

    shouldShowInterstitial() {
        return this._gameOverCount > 0 && this._gameOverCount % 3 === 0;
    },

    canContinue() {
        return !this._continueUsed;
    },

    canGetKit() {
        return !this._kitEarned;
    },

    canDoubleScore() {
        return !this._scoreDoubled;
    },

    showRewarded(rewardType, callback) {
        // Placeholder: immediately grant reward
        if (rewardType === 'continue') {
            this._continueUsed = true;
            if (callback) callback();
        } else if (rewardType === 'kit') {
            this._kitEarned = true;
            if (callback) callback();
        } else if (rewardType === 'doubleScore') {
            this._scoreDoubled = true;
            if (callback) callback();
        }
    },

    showInterstitial(callback) {
        // Placeholder: immediately proceed
        if (callback) callback();
    }
};
