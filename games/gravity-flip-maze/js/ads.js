// ads.js - Ad hooks, reward callbacks, frequency tracking (POC placeholders)

const AdsManager = {
    gameOverCount: 0,

    showInterstitial(callback) {
        console.log('[Ads] Interstitial shown (POC placeholder)');
        setTimeout(() => { if (callback) callback(); }, 100);
    },

    showRewarded(callback) {
        console.log('[Ads] Rewarded ad shown (POC placeholder)');
        setTimeout(() => { if (callback) callback(); }, 100);
    },

    shouldShowInterstitial() {
        return this.gameOverCount % 2 === 0;
    },

    onGameOver() {
        this.gameOverCount++;
    },

    canShowAd() {
        return true;
    },

    onAdRewarded(type) {
        if (type === 'continue') {
            // 3 more tries handled by caller
        } else if (type === 'double') {
            GameState.score *= 2;
            if (GameState.score > GameState.highScore) {
                GameState.highScore = GameState.score;
            }
            saveGameState();
        }
    }
};
