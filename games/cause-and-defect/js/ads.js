// ads.js - Ad integration placeholders, reward callbacks, toolkit logic

const AdManager = {
    gameOverCount: 0,
    toolkitUsesSession: 0,
    maxToolkitPerSession: 3,

    reset() {
        this.gameOverCount = 0;
        this.toolkitUsesSession = 0;
    },

    showInterstitial(callback) {
        this.gameOverCount++;
        // Placeholder: every 3rd game over
        if (this.gameOverCount % 3 === 0) {
            console.log('[Ad] Interstitial would show here');
            // Simulate ad delay
            setTimeout(() => {
                if (callback) callback();
            }, 100);
        } else {
            if (callback) callback();
        }
    },

    showRewarded(type, callback) {
        console.log(`[Ad] Rewarded ad (${type}) would show here`);
        // Placeholder: auto-grant reward
        setTimeout(() => {
            if (callback) callback(true);
        }, 100);
    },

    canShowContinue() {
        const gs = window.GameState;
        return gs && !gs.adContinueUsed;
    },

    canShowToolkit() {
        const gs = window.GameState;
        return gs && gs.currentStage >= 5 && this.toolkitUsesSession < this.maxToolkitPerSession;
    },

    showToolkit(gameScene) {
        if (!this.canShowToolkit() || !gameScene) return;
        this.showRewarded('toolkit', (success) => {
            if (success && gameScene.stageData) {
                this.toolkitUsesSession++;
                const rootIdx = gameScene.stageData.rootCauseIndex;
                const sprite = gameScene.compSprites[rootIdx];
                if (sprite && sprite.active) {
                    // Highlight root cause with bright arrow
                    const arrow = gameScene.add.text(sprite.x, sprite.y - 40, 'ROOT CAUSE', {
                        fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
                        color: COLORS.GOLD_HEX, backgroundColor: '#000000'
                    }).setOrigin(0.5).setDepth(100);
                    gameScene.machineContainer.add(arrow);

                    gameScene.tweens.add({
                        targets: arrow, y: arrow.y - 8, duration: 400,
                        yoyo: true, repeat: 3,
                        onComplete: () => { if (arrow && arrow.active) arrow.destroy(); }
                    });
                }
            }
        });
    }
};
