// ads.js - Ad trigger hooks (POC placeholders)

const AdsManager = {
    gamesPlayed: 0,
    interstitialEvery: 3,
    continueUsedThisRun: false,
    shieldUsedThisStage: false,

    onGameOver: function() {
        this.gamesPlayed++;
        if (this.gamesPlayed % this.interstitialEvery === 0) {
            console.log('AD_TRIGGER: interstitial (every 3rd game over)');
        }
    },

    showRewarded: function(type, rewardCallback) {
        console.log('AD_TRIGGER: rewarded_' + type);
        // POC: immediately grant reward
        if (typeof rewardCallback === 'function') {
            rewardCallback();
        }
    },

    canContinue: function() {
        return !this.continueUsedThisRun;
    },

    useContinue: function() {
        this.continueUsedThisRun = true;
    },

    resetRun: function() {
        this.continueUsedThisRun = false;
        this.shieldUsedThisStage = false;
    },

    showBanner: function() {
        console.log('AD_TRIGGER: banner_show');
    },

    hideBanner: function() {
        console.log('AD_TRIGGER: banner_hide');
    }
};

window.AdsManager = AdsManager;
