// Grocery Gamble - Ad Manager (POC Placeholder)
const AdManager = {
    gameOverCount: 0,
    init() {},
    showInterstitial(onClose) {
        this.gameOverCount++;
        if (onClose) onClose();
    },
    showRewarded(onRewarded, onClose) {
        if (onRewarded) onRewarded();
        if (onClose) onClose();
    },
    showBanner() {},
    hideBanner() {}
};
