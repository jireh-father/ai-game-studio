// ui.js - MenuScene, HUD overlay, pause/game-over overlays, matrix rain

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = CANVAS_WIDTH / 2;
        this.cameras.main.setBackgroundColor(COLORS.MENU_BG);

        // Matrix rain background
        this.rainColumns = [];
        for (let i = 0; i < 12; i++) {
            const col = this.add.text(i * 30 + 5, -Math.random() * 400, '', {
                fontFamily: FONT_FAMILY, fontSize: '12px', color: COLORS.GREEN
            }).setAlpha(0.12);
            col._chars = '';
            col._speed = 30 + Math.random() * 20;
            this.rainColumns.push(col);
        }

        // Title
        this.add.text(cx, 200, 'SEQUENCE\nLOCK', {
            fontFamily: FONT_FAMILY, fontSize: '44px', color: COLORS.CYAN,
            align: 'center', stroke: '#003344', strokeThickness: 2
        }).setOrigin(0.5).setShadow(0, 0, COLORS.CYAN, 16);

        this.add.text(cx, 280, 'CRACK THE VAULT', {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.GREEN
        }).setOrigin(0.5);

        // Play button
        this.createButton(cx, 380, 200, 56, 'PLAY', () => {
            this.scene.stop('MenuScene');
            this.scene.start('GameScene');
        });

        // Help button
        this.createButton(cx - 60, 460, 44, 44, '?', () => {
            this.scene.stop('MenuScene');
            this.scene.start('HelpScene', { returnTo: 'MenuScene' });
        }, true);

        // Trophy button
        this.createButton(cx + 60, 460, 44, 44, '\u2605', () => {
            this.showHighScore();
        }, true);

        // Sound toggle
        const soundOn = !window.GameSettings || window.GameSettings.soundOn !== false;
        this.soundBtn = this.createButton(cx, 520, 120, 40, soundOn ? 'SOUND: ON' : 'SOUND: OFF', () => {
            const s = window.GameSettings || { soundOn: true };
            s.soundOn = !s.soundOn;
            window.GameSettings = s;
            this.soundBtn.text.setText(s.soundOn ? 'SOUND: ON' : 'SOUND: OFF');
            if (window.saveSettings) window.saveSettings(s);
        });

        // High score display
        const hs = window.loadHighScore ? window.loadHighScore() : 0;
        this.add.text(cx, 570, 'BEST: ' + String(hs).padStart(6, '0'), {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);

        this.highScoreOverlay = null;
    }

    createButton(x, y, w, h, label, callback, isCircle) {
        const gfx = this.add.graphics();
        gfx.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.BTN_FILL).color, 1);
        if (isCircle) {
            gfx.fillCircle(x, y, w / 2);
            gfx.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BTN_BORDER).color, 1);
            gfx.strokeCircle(x, y, w / 2);
        } else {
            gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            gfx.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.BTN_BORDER).color, 1);
            gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        }

        const hitArea = isCircle
            ? new Phaser.Geom.Circle(0, 0, w / 2 + 4)
            : new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
        const hitCb = isCircle ? Phaser.Geom.Circle.Contains : Phaser.Geom.Rectangle.Contains;

        const zone = this.add.zone(x, y, isCircle ? w + 8 : w, isCircle ? h + 8 : h)
            .setInteractive({ hitArea, hitAreaCallback: hitCb, useHandCursor: true })
            .on('pointerdown', () => {
                SoundManager.playUIClick(this);
                callback();
            });

        const txt = this.add.text(x, y, label, {
            fontFamily: FONT_FAMILY, fontSize: isCircle ? '18px' : '20px',
            color: COLORS.BTN_TEXT
        }).setOrigin(0.5);

        return { zone, text: txt, gfx };
    }

    showHighScore() {
        if (this.highScoreOverlay) return;
        const cx = CANVAS_WIDTH / 2;
        const overlay = this.add.container(0, 0);

        const bg = this.add.rectangle(cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x050A0F, 0.92);
        overlay.add(bg);

        overlay.add(this.add.text(cx, 280, 'BEST SCORE', { fontFamily: FONT_FAMILY, fontSize: '16px', color: COLORS.HUD_TEXT }).setOrigin(0.5));
        const hs = window.loadHighScore ? window.loadHighScore() : 0;
        overlay.add(this.add.text(cx, 320, String(hs).padStart(6, '0'), { fontFamily: FONT_FAMILY, fontSize: '32px', color: COLORS.CYAN }).setOrigin(0.5));

        const hstg = window.loadHighStage ? window.loadHighStage() : 0;
        overlay.add(this.add.text(cx, 370, 'BEST STAGE: ' + hstg, { fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.GREEN }).setOrigin(0.5));

        const closeZone = this.add.zone(cx, 440, 100, 44).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { overlay.destroy(); this.highScoreOverlay = null; });
        overlay.add(closeZone);
        const closeGfx = this.add.graphics();
        closeGfx.fillStyle(0x0D2F5A, 1); closeGfx.fillRoundedRect(cx - 50, 418, 100, 44, 6);
        closeGfx.lineStyle(2, 0x00E5FF, 1); closeGfx.strokeRoundedRect(cx - 50, 418, 100, 44, 6);
        overlay.add(closeGfx);
        overlay.add(this.add.text(cx, 440, 'CLOSE', { fontFamily: FONT_FAMILY, fontSize: '16px', color: COLORS.BTN_TEXT }).setOrigin(0.5));

        this.highScoreOverlay = overlay;
    }

    update(time, delta) {
        // Animate matrix rain
        for (const col of this.rainColumns) {
            col.y += col._speed * delta / 1000;
            if (col.y > CANVAS_HEIGHT) {
                col.y = -200;
                col._chars = '';
            }
            if (Math.random() < 0.1) {
                col._chars += Math.random() > 0.5 ? '1' : '0';
                if (col._chars.length > 16) col._chars = col._chars.slice(-16);
                col.setText(col._chars.split('').join('\n'));
            }
        }
    }
}

// Simple sound manager using Web Audio API
const SoundManager = {
    ctx: null,
    getCtx: function() {
        if (!this.ctx) {
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
        return this.ctx;
    },
    isMuted: function() { return window.GameSettings && window.GameSettings.soundOn === false; },
    playTone: function(freq, freq2, duration, type, vol) {
        if (this.isMuted()) return;
        const ctx = this.getCtx(); if (!ctx) return;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freq2) osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + duration / 1000);
        gain.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + duration / 1000);
    },
    playCorrectTap: function(streakLevel) {
        const pitchMult = 1 + streakLevel * 0.1;
        this.playTone(440 * pitchMult, 550 * pitchMult, 150, 'sine', 0.4);
        if (streakLevel >= 2) this.playTone(880 * pitchMult, 1100 * pitchMult, 150, 'sine', 0.15);
    },
    playWrongTap: function() { this.playTone(200, 80, 200, 'square', 0.3); },
    playStageClear: function() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => setTimeout(() => this.playTone(f, f, 180, 'sine', 0.35), i * 150));
    },
    playGameOver: function() { this.playTone(55, 40, 900, 'sawtooth', 0.4); },
    playUIClick: function() { this.playTone(800, 800, 80, 'sine', 0.2); },
    playBomb: function() { this.playTone(60, 20, 300, 'sine', 0.5); },
    playFreeze: function() { this.playTone(1200, 1200, 250, 'sine', 0.3); },
    playReveal: function() { this.playTone(300, 600, 200, 'sine', 0.25); setTimeout(() => this.playTone(600, 300, 200, 'sine', 0.2), 200); }
};

window.SoundManager = SoundManager;
