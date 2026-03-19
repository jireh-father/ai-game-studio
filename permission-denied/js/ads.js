// Permission Denied - Ad Placeholder Hooks (POC - no real ads)

const AdManager = {
    continueUsedThisSession: false,
    doubleScoreUsedThisSession: false,

    canShowContinue() {
        return !this.continueUsedThisSession;
    },

    showContinuePrompt(onAccept, onDecline) {
        // POC: simulate ad watched after brief delay
        if (!this.canShowContinue()) {
            if (onDecline) onDecline();
            return;
        }
        // In real implementation, show rewarded ad here
        // For POC, the UI will show the button and call onAccept/onDecline
        this._continueAccept = () => {
            this.continueUsedThisSession = true;
            if (onAccept) onAccept();
        };
        this._continueDecline = onDecline;
    },

    acceptContinue() {
        if (this._continueAccept) this._continueAccept();
    },

    declineContinue() {
        if (this._continueDecline) this._continueDecline();
    },

    showGameOverInterstitial(gameOverCount) {
        // POC: every 3rd game over, would show interstitial
        if (gameOverCount % 3 === 0 && gameOverCount > 0) {
            // console.log('[AD] Interstitial would show here');
        }
    },

    showDoubleScoreOffer(score, onAccept, onDecline) {
        if (this.doubleScoreUsedThisSession) {
            if (onDecline) onDecline();
            return;
        }
        this._doubleAccept = () => {
            this.doubleScoreUsedThisSession = true;
            if (onAccept) onAccept(score * 2);
        };
        this._doubleDecline = onDecline;
    },

    resetSession() {
        this.continueUsedThisSession = false;
        this.doubleScoreUsedThisSession = false;
    }
};
