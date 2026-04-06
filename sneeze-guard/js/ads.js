// Sneeze Guard - Ad Manager (Placeholder)
const AdManager = {
    gameOverCount: 0,
    canShowContinue: true,
    canShowExtraLife: true,
    canShowDoubleScore: true,

    reset: function() {
        this.canShowContinue = true;
        this.canShowExtraLife = true;
        this.canShowDoubleScore = true;
    },

    onGameOver: function() {
        this.gameOverCount++;
    },

    shouldShowInterstitial: function() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    },

    showRewardedContinue: function(callback) {
        if (!this.canShowContinue) return false;
        this.canShowContinue = false;
        if (window.showAd) {
            window.showAd({ type: 'rewarded', placement: 'continue', callback: callback });
        } else {
            // Placeholder: simulate ad watched
            if (callback) callback(true);
        }
        return true;
    },

    showRewardedExtraLife: function(callback) {
        if (!this.canShowExtraLife) return false;
        this.canShowExtraLife = false;
        if (window.showAd) {
            window.showAd({ type: 'rewarded', placement: 'extra_life', callback: callback });
        } else {
            if (callback) callback(true);
        }
        return true;
    },

    showRewardedDoubleScore: function(callback) {
        if (!this.canShowDoubleScore) return false;
        this.canShowDoubleScore = false;
        if (window.showAd) {
            window.showAd({ type: 'rewarded', placement: 'double_score', callback: callback });
        } else {
            if (callback) callback(true);
        }
        return true;
    }
};
