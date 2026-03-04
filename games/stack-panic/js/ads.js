// Stack Panic - Ad Manager (Placeholder)

class AdManager {
    constructor() {
        this.gameOverCount = 0;
        this.continueUsedThisSession = false;
        this.doubleScoreUsedThisSession = false;
        this.initialized = false;
    }

    init() {
        this.initialized = true;
        console.log('[AdManager] Ad SDK ready (placeholder)');
    }

    resetSession() {
        this.continueUsedThisSession = false;
        this.doubleScoreUsedThisSession = false;
    }

    onGameOver() {
        this.gameOverCount++;
    }

    shouldShowInterstitial() {
        return this.gameOverCount > 0 && this.gameOverCount % 3 === 0;
    }

    hasContinueAvailable() {
        return !this.continueUsedThisSession;
    }

    hasDoubleScoreAvailable() {
        return !this.doubleScoreUsedThisSession;
    }

    showInterstitial(onClose) {
        console.log('[AdManager] Interstitial shown (placeholder)');
        // Simulate 5s ad
        if (onClose) {
            setTimeout(onClose, 100); // instant in dev mode
        }
    }

    showRewarded(type, onRewarded, onCancelled) {
        console.log(`[AdManager] Rewarded ad (${type}) shown (placeholder)`);
        // Auto-reward in dev mode
        if (type === 'continue') {
            this.continueUsedThisSession = true;
        } else if (type === 'double_score') {
            this.doubleScoreUsedThisSession = true;
        }
        if (onRewarded) {
            setTimeout(onRewarded, 100);
        }
    }
}

const adManager = new AdManager();
