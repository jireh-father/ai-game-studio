// game.js - GameScene: grid, tile taps, rule checking, timer, streak, scoring

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.gameOver = false;
        this.stageTransitioning = false;
        this.inputLocked = false;
        this.streak = 0;
        this.wrongThisRule = 0;
        this.firstTapDone = false;
        this.timerValue = 0;
        this.timerMax = 0;
        this.paused = false;
        this.lastTickTime = 0;

        GameState.score = 0;
        GameState.lives = MAX_LIVES;
        GameState.stage = 1;
        GameState.ruleStreak = 0;
        GameState.hintsRemaining = HINTS_PER_RULE;
        GameState.rulesThisGame = 0;
        GameState.bestStreakThisGame = 0;
        GameState.gamesPlayed++;
        saveGameState();

        this.grid = generateGrid();
        this.tileSprites = [];
        this.createTileGrid();
        this.currentRule = generateRule(GameState.stage, this.grid);
        this.timerMax = this.currentRule.timerDuration;
        this.timerValue = this.timerMax;

        this.scene.launch('UIScene');
        this.time.delayedCall(50, () => { this.events.emit('stateUpdate', this.getState()); });
    }

    createTileGrid() {
        const w = this.scale.width;
        const ts = 76, gap = 8, gridW = ts * 4 + gap * 3;
        const sx = (w - gridW) / 2 + ts / 2, sy = 150;
        this.tileSprites.forEach(s => s.destroy());
        this.tileSprites = [];
        this.grid.forEach((tile, i) => {
            const x = sx + tile.col * (ts + gap), y = sy + tile.row * (ts + gap);
            const sprite = this.add.image(x, y, `tile_${tile.color}_${tile.shape}`).setDisplaySize(ts, ts);
            sprite.setInteractive();
            sprite.tileIndex = i;
            sprite.baseX = x;
            sprite.on('pointerdown', () => this.handleTileTap(i, sprite));
            this.tileSprites.push(sprite);
        });
    }

    getState() {
        return { score: GameState.score, lives: GameState.lives, stage: GameState.stage,
            streak: this.streak, timerValue: this.timerValue, timerMax: this.timerMax,
            ruleStreak: GameState.ruleStreak, hintsRemaining: GameState.hintsRemaining };
    }

    handleTileTap(index, sprite) {
        if (this.gameOver || this.stageTransitioning || this.inputLocked || this.paused) return;
        this.inputLocked = true;
        this.time.delayedCall(200, () => { this.inputLocked = false; });
        const tile = this.grid[index];
        if (this.currentRule.check(tile)) this.onCorrectTap(sprite);
        else this.onWrongTap(sprite);
    }

    onCorrectTap(sprite) {
        playCorrectSound(this.streak);
        this.streak++;
        let pts = SCORING.correctTap * (1 + 0.5 * (this.streak - 1));
        if (!this.firstTapDone) { pts += SCORING.firstGuess; this.firstTapDone = true; }
        else this.firstTapDone = true;
        GameState.score += Math.round(pts);

        this.tweens.add({ targets: sprite, scaleX: 1.15, scaleY: 1.15, duration: 80,
            ease: 'Quad.Out', yoyo: true, onComplete: () => sprite.setScale(ts()) });
        this.emitParticles(sprite.x, sprite.y, 8, 0x06D6A0, 60, 300);
        this.floatText(sprite.x, sprite.y - 40, `+${Math.round(pts)}`, COLORS.CORRECT, 18);
        playStreakDotSound(this.streak - 1);
        this.events.emit('stateUpdate', this.getState());
        if (this.streak >= STREAK_TO_CRACK) this.crackRule();
    }

    onWrongTap(sprite) {
        playWrongSound();
        this.streak = 0;
        this.wrongThisRule++;
        this.firstTapDone = true;
        GameState.score = Math.max(0, GameState.score - SCORING.wrongPenalty);
        GameState.lives--;
        sprite.setTint(0xFF006E);
        this.time.delayedCall(150, () => { if (sprite.active) sprite.clearTint(); });
        this.tweens.add({ targets: sprite, x: sprite.baseX + 6, duration: 50, yoyo: true, repeat: 3,
            onComplete: () => { if (sprite.active) sprite.x = sprite.baseX; } });
        this.emitParticles(sprite.x, sprite.y, 6, 0xFF006E, 45, 250);
        this.floatText(sprite.x, sprite.y - 40, `-${SCORING.wrongPenalty}`, COLORS.WRONG, 16);
        playLifeLostSound();
        this.cameras.main.shake(200, 0.01);
        this.events.emit('stateUpdate', this.getState());
        this.events.emit('lifeLost', GameState.lives);
        if (GameState.lives <= 0) this.triggerGameOver('lives');
    }

    crackRule() {
        this.stageTransitioning = true;
        playCrackSound(GameState.ruleStreak);
        let bonus = SCORING.ruleCracked * Math.min(2.5, 1 + 0.5 * GameState.ruleStreak);
        if (this.wrongThisRule === 0) bonus += SCORING.perfectCrack;
        if (this.timerValue / this.timerMax > 0.5) bonus += Math.round(SCORING.speedBonus * (this.timerValue / this.timerMax));
        GameState.score += Math.round(bonus);
        GameState.ruleStreak++;
        GameState.rulesThisGame++;
        GameState.bestStreakThisGame = Math.max(GameState.bestStreakThisGame, GameState.ruleStreak);
        const total = parseInt(localStorage.getItem('rule_thief_total_rules_cracked') || '0') + 1;
        localStorage.setItem('rule_thief_total_rules_cracked', total.toString());
        checkUnlocks(total);

        // White flash
        const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0xFFFFFF, 0).setDepth(100);
        this.tweens.add({ targets: flash, alpha: 0.6, duration: 100, yoyo: true, hold: 50, onComplete: () => flash.destroy() });
        this.cameras.main.zoomTo(1.05, 150);
        this.time.delayedCall(300, () => { if (!this.gameOver) this.cameras.main.zoomTo(1, 300); });

        // Rule reveal
        const rt = this.add.text(this.scale.width/2, 330, `"${this.currentRule.text}"`,
            { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
            align: 'center', wordWrap: { width: 350 } }).setOrigin(0.5).setDepth(101).setAlpha(0);
        this.tweens.add({ targets: rt, alpha: 1, duration: 100, onComplete: () => {
            this.time.delayedCall(600, () => { this.tweens.add({ targets: rt, alpha: 0, duration: 200, onComplete: () => rt.destroy() }); });
        }});

        this.floatText(this.scale.width/2, 280, `+${Math.round(bonus)}`, '#E9C46A', 28);
        if (this.wrongThisRule === 0) this.floatText(this.scale.width/2, 310, 'PERFECT!', COLORS.CORRECT, 20);
        this.crackParticles();

        if (GameState.score > GameState.highScore) {
            GameState.highScore = GameState.score;
            localStorage.setItem('rule_thief_high_score', GameState.highScore.toString());
            this.events.emit('newHighScore');
        }
        this.events.emit('stateUpdate', this.getState());
        this.events.emit('ruleCracked', this.currentRule.text);
        this.time.delayedCall(900, () => { if (!this.gameOver) this.advanceStage(); });
    }

    advanceStage() {
        GameState.stage++;
        this.streak = 0;
        this.wrongThisRule = 0;
        this.firstTapDone = false;
        GameState.hintsRemaining = HINTS_PER_RULE;
        this.reshuffleGrid();
    }

    reshuffleGrid() {
        this.tileSprites.forEach((s, i) => {
            this.tweens.add({ targets: s, scaleX: 0, scaleY: 0, duration: 200, delay: i * 15, ease: 'Quad.In' });
        });
        this.time.delayedCall(440, () => {
            this.grid = generateGrid();
            this.currentRule = generateRule(GameState.stage, this.grid);
            this.timerMax = this.currentRule.timerDuration;
            this.timerValue = this.timerMax;
            this.tileSprites.forEach((s, i) => {
                const tile = this.grid[i];
                s.setTexture(`tile_${tile.color}_${tile.shape}`).setScale(0);
                this.tweens.add({ targets: s, scaleX: ts(), scaleY: ts(), duration: 200, delay: i * 15, ease: 'Back.Out' });
            });
            this.time.delayedCall(440, () => {
                this.stageTransitioning = false;
                this.events.emit('stateUpdate', this.getState());
                this.events.emit('newRule');
            });
        });
    }

    triggerGameOver(reason) {
        if (this.gameOver) return;
        this.gameOver = true;
        playGameOverSound();
        this.cameras.main.shake(400, 0.025);
        this.tileSprites.forEach((s, i) => {
            this.tweens.add({ targets: s, y: s.y + 400 + Math.random() * 200,
                angle: 90 + Math.random() * 270, alpha: 0, duration: 500, delay: i * 30, ease: 'Quad.In' });
        });
        const hs = parseInt(localStorage.getItem('rule_thief_highest_stage') || '0');
        if (GameState.stage > hs) localStorage.setItem('rule_thief_highest_stage', GameState.stage.toString());
        const bs = parseInt(localStorage.getItem('rule_thief_best_rule_streak') || '0');
        if (GameState.bestStreakThisGame > bs) localStorage.setItem('rule_thief_best_rule_streak', GameState.bestStreakThisGame.toString());
        localStorage.setItem('rule_thief_games_played', GameState.gamesPlayed.toString());
        if (GameState.score > GameState.highScore) {
            GameState.highScore = GameState.score;
            localStorage.setItem('rule_thief_high_score', GameState.highScore.toString());
        }
        saveGameState();
        this.time.delayedCall(600, () => {
            this.scene.stop('UIScene');
            this.scene.start('GameOverScene', { score: GameState.score, highScore: GameState.highScore,
                stage: GameState.stage, rulesThisGame: GameState.rulesThisGame,
                bestStreak: GameState.bestStreakThisGame, reason, isNewHigh: GameState.score >= GameState.highScore });
        });
    }

    useHint() {
        if (this.gameOver || this.stageTransitioning || GameState.hintsRemaining <= 0) return;
        GameState.hintsRemaining--;
        playHintSound();
        this.events.emit('hintUsed', this.currentRule.hintText);
        this.events.emit('stateUpdate', this.getState());
    }

    togglePause() {
        this.paused = !this.paused;
        this.events.emit('pauseToggled', this.paused);
    }

    emitParticles(x, y, count, color, radius, life) {
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            const p = this.add.circle(x, y, 4, color, 1).setDepth(50);
            this.tweens.add({ targets: p, x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius,
                alpha: 0, duration: life, onComplete: () => p.destroy() });
        }
    }

    crackParticles() {
        const cx = this.scale.width / 2, cy = 320;
        const cols = [0xE63946, 0x457B9D, 0x2A9D8F, 0xE9C46A, 0x06D6A0];
        for (let i = 0; i < Math.min(30 + GameState.ruleStreak * 10, 60); i++) {
            const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 200;
            const p = this.add.circle(cx, cy, 3 + Math.random() * 5, Phaser.Utils.Array.GetRandom(cols), 1).setDepth(90);
            this.tweens.add({ targets: p, x: cx + Math.cos(a) * sp, y: cy + Math.sin(a) * sp + 80,
                alpha: 0, scaleX: 0, scaleY: 0, duration: 600, onComplete: () => p.destroy() });
        }
    }

    floatText(x, y, text, color, size) {
        const t = this.add.text(x, y, text, { fontSize: `${size}px`, fontFamily: 'Arial',
            fontStyle: 'bold', color }).setOrigin(0.5).setDepth(80);
        this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 600, ease: 'Quad.Out', onComplete: () => t.destroy() });
    }

    update(time, delta) {
        if (this.gameOver || this.stageTransitioning || this.paused) return;
        this.timerValue -= delta / 1000;
        if (this.timerValue < 4 && this.timerValue > 0 && time - this.lastTickTime > 500) {
            playTickSound();
            this.lastTickTime = time;
        }
        if (this.timerValue <= 0) { this.timerValue = 0; this.triggerGameOver('timer'); }
        this.events.emit('timerUpdate', this.timerValue, this.timerMax);
    }
}

function ts() { return 76 / 80; }

function checkUnlocks(total) {
    const cur = localStorage.getItem('rule_thief_unlocked_tier') || 'rookie';
    if (total >= UNLOCK_THRESHOLDS.mastermind && cur !== 'mastermind') localStorage.setItem('rule_thief_unlocked_tier', 'mastermind');
    else if (total >= UNLOCK_THRESHOLDS.detective && cur === 'rookie') localStorage.setItem('rule_thief_unlocked_tier', 'detective');
}
