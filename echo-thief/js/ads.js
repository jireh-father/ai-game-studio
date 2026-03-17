// Echo Thief - Ad Manager (Placeholder)
class AdManager {
    constructor() {
        this.deathCount = 0;
        this.hasUsedContinue = false;
        this.hasUsedDoubleScore = false;
    }

    reset() {
        this.hasUsedContinue = false;
    }

    onDeath() {
        this.deathCount++;
        if (this.deathCount % 3 === 0) {
            this.showInterstitial();
        }
    }

    canContinue() {
        return !this.hasUsedContinue;
    }

    showInterstitial() {
        // Placeholder — real SDK integration here
        console.log('[Ad] Interstitial shown');
    }

    showContinueAd(callback) {
        // Placeholder — simulate watching ad
        console.log('[Ad] Rewarded ad: Continue');
        this.hasUsedContinue = true;
        if (callback) callback(true);
    }

    showDoubleScoreAd(finalScore, callback) {
        // Placeholder — simulate watching ad
        console.log('[Ad] Rewarded ad: Double Score');
        this.hasUsedDoubleScore = true;
        if (callback) callback(finalScore * 2);
    }

    canDoubleScore() {
        return !this.hasUsedDoubleScore && this.deathCount >= 5;
    }
}

const adManager = new AdManager();
