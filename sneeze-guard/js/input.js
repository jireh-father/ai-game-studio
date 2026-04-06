// Sneeze Guard - Input Handling & Pause/Tutorial (mixin for GameScene)
const GameInput = {
    onTap: function() {
        const now = Date.now();
        if (now - this.lastTapTime < CONFIG.TAP_DEBOUNCE) return;
        this.lastTapTime = now;

        if (this.eventTransitioning) return;

        // Raise guard visual
        this.raiseGuard();
        this.vibrate(40);

        if (this.fakeoutActive) {
            this.handleEarlyBlock();
            return;
        }

        if (this.tapWindowOpen && !this.sneezeFired) {
            this.sneezeFired = true;
            this.tapWindowOpen = false;
            const elapsed = now - this.tapWindowStart;
            const ev = this.stageData.events[this.currentEventIndex];

            if (elapsed <= ev.tapWindow * 0.4) {
                this.handlePerfectBlock();
            } else {
                this.handleGoodBlock();
            }
        } else if (!this.tapWindowOpen && !this.fakeoutActive && !this.sneezeFired) {
            this.handleEarlyBlock();
        }
    },

    raiseGuard: function() {
        if (this.guardUp) return;
        this.guardUp = true;
        this.guard.setAlpha(1);
        this.guard.y = this.guardLineY + 40;
        this.tweens.add({
            targets: this.guard, y: this.guardLineY,
            duration: CONFIG.GUARD_RAISE_DURATION, ease: 'Back.easeOut'
        });
        this.guardSparkles(this.guardLineY, GameState.streak >= 3 ? 8 : 3);

        this.time.delayedCall(CONFIG.GUARD_UP_TIME, () => {
            this.tweens.add({
                targets: this.guard, alpha: 0, y: this.guardLineY + 40,
                duration: CONFIG.GUARD_LOWER_DURATION,
                onComplete: () => { this.guardUp = false; }
            });
        });
    },

    togglePause: function() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.scene.pause();
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
            this.scene.resume();
        }
    },

    showPauseOverlay: function() {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;
        this.pauseGroup = this.add.group();

        const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(100);
        this.pauseGroup.add(bg);

        const title = this.add.text(W / 2, 200, 'PAUSED', {
            fontSize: '36px', fontFamily: 'Arial Black', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(101);
        this.pauseGroup.add(title);

        const btns = [
            { y: 300, text: 'RESUME', color: 0x4A90D9, action: () => this.togglePause() },
            { y: 360, text: 'RESTART', color: 0x88CC44, action: () => {
                GameState.score = 0; GameState.stage = 1;
                GameState.hygiene = CONFIG.MAX_HYGIENE; GameState.streak = 0;
                this.scene.stop('HUDScene');
                this.scene.stop('GameScene');
                this.scene.start('GameScene');
            }},
            { y: 420, text: '? HELP', color: 0xF0A830, action: () => {
                this.scene.launch('HelpScene', { returnTo: 'GameScene' });
            }},
            { y: 480, text: 'MENU', color: 0x666666, action: () => {
                this.scene.stop('HUDScene');
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            }}
        ];

        btns.forEach(b => {
            const btn = this.add.rectangle(W / 2, b.y, 180, 45, b.color)
                .setInteractive({ useHandCursor: true }).setDepth(101);
            this.pauseGroup.add(btn);
            const txt = this.add.text(W / 2, b.y, b.text, {
                fontSize: '18px', fontFamily: 'Arial Black', color: '#FFF'
            }).setOrigin(0.5).setDepth(102);
            txt.disableInteractive();
            this.pauseGroup.add(txt);
            btn.on('pointerdown', b.action);
        });
    },

    hidePauseOverlay: function() {
        if (this.pauseGroup) {
            this.pauseGroup.clear(true, true);
            this.pauseGroup = null;
        }
    },

    showTutorial: function(message) {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;
        const bg = this.add.rectangle(W / 2, H / 2, W - 40, 150, 0x000000, 0.9)
            .setDepth(80).setStrokeStyle(2, 0xFFD700);
        const txt = this.add.text(W / 2, H / 2, message, {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
            align: 'center', wordWrap: { width: W - 80 }
        }).setOrigin(0.5).setDepth(81);

        this.time.delayedCall(2500, () => {
            if (bg && bg.scene) bg.destroy();
            if (txt && txt.scene) txt.destroy();
        });
    }
};
