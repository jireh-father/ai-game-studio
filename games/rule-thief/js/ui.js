// ui.js - MenuScene, UIScene (HUD overlay), GameOverScene

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Title
        this.add.text(w / 2, 100, 'RULE THIEF', { fontSize: '36px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5);
        this.add.text(w / 2, 140, 'Crack the code.', { fontSize: '16px', fontFamily: 'Arial',
            fontStyle: 'italic', color: COLORS.ACCENT }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.rectangle(w / 2, 260, 200, 60, 0x2A9D8F, 1).setInteractive({ useHandCursor: true });
        playBtn.setStrokeStyle(2, 0x06D6A0);
        const playText = this.add.text(w / 2, 260, 'PLAY', { fontSize: '24px', fontFamily: 'Arial',
            fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => { playButtonSound(); this.scene.start('GameScene'); });
        playBtn.on('pointerover', () => playBtn.setFillStyle(0x3AB8A5));
        playBtn.on('pointerout', () => playBtn.setFillStyle(0x2A9D8F));

        // How to play button
        const helpBtn = this.add.rectangle(w - 40, 30, 44, 44, 0x1B2838, 1).setInteractive({ useHandCursor: true });
        helpBtn.setStrokeStyle(1, 0xA8DADC);
        this.add.text(w - 40, 30, '?', { fontSize: '24px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.ACCENT }).setOrigin(0.5);
        helpBtn.on('pointerdown', () => { playButtonSound(); this.scene.start('HelpScene', { returnTo: 'MenuScene' }); });

        // High score
        const hs = localStorage.getItem('rule_thief_high_score') || '0';
        this.add.text(w / 2, 340, `Best: ${hs}`, { fontSize: '18px', fontFamily: 'Arial',
            color: '#E9C46A' }).setOrigin(0.5);

        // Total rules cracked
        const total = localStorage.getItem('rule_thief_total_rules_cracked') || '0';
        this.add.text(w / 2, 370, `Total Rules Cracked: ${total}`, { fontSize: '14px',
            fontFamily: 'Arial', color: COLORS.ACCENT }).setOrigin(0.5);

        // Tier
        const tier = localStorage.getItem('rule_thief_unlocked_tier') || 'rookie';
        this.add.text(w / 2, 400, tier.charAt(0).toUpperCase() + tier.slice(1), { fontSize: '14px',
            fontFamily: 'Arial', color: COLORS.ACCENT }).setOrigin(0.5);

        // Sound toggle
        const soundText = this.add.text(24, h - 40, GameState.settings.sound ? '🔊' : '🔇',
            { fontSize: '28px' }).setInteractive({ useHandCursor: true });
        soundText.on('pointerdown', () => {
            GameState.settings.sound = !GameState.settings.sound;
            soundText.setText(GameState.settings.sound ? '🔊' : '🔇');
            saveGameState();
        });
    }
}

class UIScene extends Phaser.Scene {
    constructor() { super('UIScene'); }

    create() {
        const w = this.scale.width;
        this.scoreText = this.add.text(16, 16, `Score: ${GameState.score}`, { fontSize: '18px',
            fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.TEXT }).setDepth(10);
        this.stageText = this.add.text(w / 2, 16, `Stage ${GameState.stage}`, { fontSize: '14px',
            fontFamily: 'Arial', color: COLORS.ACCENT }).setOrigin(0.5, 0).setDepth(10);

        // Lives
        this.lifeIcons = [];
        for (let i = 0; i < MAX_LIVES; i++) {
            const icon = this.add.image(w - 80 + i * 28, 24, 'life_icon').setDepth(10);
            this.lifeIcons.push(icon);
        }

        // Timer bar background
        this.timerBg = this.add.rectangle(w / 2, 56, w - 32, 14, 0x1B2838).setDepth(10);
        this.timerBar = this.add.rectangle(16, 50, w - 32, 12, 0x06D6A0).setOrigin(0, 0).setDepth(11);
        this.timerBarWidth = w - 32;

        // Rule display
        this.ruleText = this.add.text(w / 2, 85, '???', { fontSize: '16px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.ACCENT, align: 'center' }).setOrigin(0.5).setDepth(10);
        this.hintRevealed = false;

        // Streak dots
        this.streakDots = [];
        for (let i = 0; i < STREAK_TO_CRACK; i++) {
            const dot = this.add.image(60 + i * 22, 520, 'streak_empty').setDepth(10);
            this.streakDots.push(dot);
        }
        this.add.text(16, 514, 'Streak:', { fontSize: '12px', fontFamily: 'Arial',
            color: COLORS.ACCENT }).setDepth(10);

        // Hint button
        const hintBtn = this.add.image(w - 90, 525, 'hint_icon').setDepth(10).setInteractive({ useHandCursor: true });
        hintBtn.setDisplaySize(44, 44);
        this.hintCountText = this.add.text(w - 74, 540, `${GameState.hintsRemaining}`, { fontSize: '10px',
            fontFamily: 'Arial', color: '#E9C46A' }).setDepth(11);
        hintBtn.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            if (gameScene) gameScene.useHint();
        });

        // Pause button
        const pauseBtn = this.add.rectangle(w - 35, 525, 44, 44, 0x1B2838, 0.8).setDepth(10)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xA8DADC);
        this.add.text(w - 35, 525, '||', { fontSize: '20px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5).setDepth(11);
        pauseBtn.on('pointerdown', () => {
            playButtonSound();
            const gameScene = this.scene.get('GameScene');
            if (gameScene) gameScene.togglePause();
        });

        // Rule streak display
        this.ruleStreakText = this.add.text(w / 2, 555, '', { fontSize: '13px', fontFamily: 'Arial',
            fontStyle: 'bold', color: '#E9C46A' }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Pause overlay elements (hidden by default)
        this.pauseOverlay = this.createPauseOverlay();
        this.pauseOverlay.setVisible(false);
        this.pauseOverlay.each(child => { if (child.input) child.disableInteractive(); });

        // Listen to game events
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('stateUpdate', this.onStateUpdate, this);
            gameScene.events.on('timerUpdate', this.onTimerUpdate, this);
            gameScene.events.on('lifeLost', this.onLifeLost, this);
            gameScene.events.on('hintUsed', this.onHintUsed, this);
            gameScene.events.on('pauseToggled', this.onPauseToggled, this);
            gameScene.events.on('ruleCracked', this.onRuleCracked, this);
            gameScene.events.on('newRule', this.onNewRule, this);
            gameScene.events.on('newHighScore', this.onNewHighScore, this);
        }
    }

    onStateUpdate(state) {
        if (!state) return;
        this.scoreText.setText(`Score: ${state.score}`);
        this.stageText.setText(`Stage ${state.stage}`);
        this.hintCountText.setText(`${state.hintsRemaining}`);

        // Update lives
        for (let i = 0; i < MAX_LIVES; i++) {
            this.lifeIcons[i].setTexture(i < state.lives ? 'life_icon' : 'life_icon_empty');
        }

        // Update streak dots
        for (let i = 0; i < STREAK_TO_CRACK; i++) {
            if (i < state.streak) {
                this.streakDots[i].setTexture('streak_filled');
            } else {
                this.streakDots[i].setTexture('streak_empty');
            }
        }

        // Rule streak
        if (state.ruleStreak >= 2) {
            this.ruleStreakText.setText(`Rule Streak: ${state.ruleStreak}`).setAlpha(1);
        } else {
            this.ruleStreakText.setAlpha(0);
        }
    }

    onTimerUpdate(val, max) {
        if (!this.timerBar || !this.timerBar.active) return;
        const ratio = Math.max(0, val / max);
        this.timerBar.setDisplaySize(this.timerBarWidth * ratio, 12);

        // Color: green -> yellow -> red
        if (ratio > 0.5) {
            this.timerBar.setFillStyle(0x06D6A0);
        } else if (ratio > 0.25) {
            this.timerBar.setFillStyle(0xE9C46A);
        } else {
            this.timerBar.setFillStyle(0xFF006E);
            // Pulse effect when critical
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            this.timerBar.setAlpha(pulse);
        }
    }

    onLifeLost(lives) {
        if (lives >= 0 && lives < MAX_LIVES) {
            const icon = this.lifeIcons[lives];
            if (icon && icon.active) {
                this.tweens.add({ targets: icon, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 300,
                    onComplete: () => { icon.setScale(1).setAlpha(1).setTexture('life_icon_empty'); } });
            }
        }
    }

    onHintUsed(hintText) {
        if (this.ruleText && this.ruleText.active) {
            this.ruleText.setText(hintText);
            this.hintRevealed = true;
        }
    }

    onPauseToggled(paused) {
        this.pauseOverlay.setVisible(paused);
        this.pauseOverlay.each(child => {
            if (child.input) {
                if (paused) child.setInteractive();
                else child.disableInteractive();
            }
        });
    }

    onRuleCracked(ruleText) {
        this.hintRevealed = false;
    }

    onNewRule() {
        if (this.ruleText && this.ruleText.active) {
            this.ruleText.setText('???');
        }
        this.hintRevealed = false;
        if (this.timerBar && this.timerBar.active) this.timerBar.setAlpha(1);
    }

    onNewHighScore() {
        const t = this.add.text(this.scale.width / 2, 40, 'NEW BEST!', { fontSize: '18px',
            fontFamily: 'Arial', fontStyle: 'bold', color: '#E9C46A' }).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: t, alpha: 0, y: 20, duration: 1500, onComplete: () => t.destroy() });
    }

    createPauseOverlay() {
        const w = this.scale.width, h = this.scale.height;
        const container = this.add.container(0, 0).setDepth(200);

        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.85);
        container.add(bg);

        const title = this.add.text(w / 2, 160, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5);
        container.add(title);

        const btns = [
            { y: 240, text: 'Resume', color: 0x2A9D8F, action: () => { const g = this.scene.get('GameScene'); if(g) g.togglePause(); } },
            { y: 310, text: 'How to Play', color: 0x457B9D, action: () => { this.scene.launch('HelpScene', { returnTo: 'UIScene' }); } },
            { y: 380, text: 'Restart', color: 0xE63946, action: () => { this.scene.stop('GameScene'); this.scene.start('GameScene'); } },
            { y: 450, text: 'Menu', color: 0x1B2838, action: () => { this.scene.stop('GameScene'); this.scene.start('MenuScene'); } },
        ];
        btns.forEach(b => {
            const rect = this.add.rectangle(w / 2, b.y, 180, 50, b.color, 1).setInteractive({ useHandCursor: true });
            if (b.color === 0x1B2838) rect.setStrokeStyle(1, 0xA8DADC);
            const txt = this.add.text(w / 2, b.y, b.text, { fontSize: '18px', fontFamily: 'Arial',
                fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
            rect.on('pointerdown', () => { playButtonSound(); b.action(); });
            container.add([rect, txt]);
        });

        return container;
    }
}
