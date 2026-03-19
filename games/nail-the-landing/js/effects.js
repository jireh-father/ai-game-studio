// Effects and Audio mixin for GameScene
// These methods are added to GameScene's prototype after the class is defined

const GameEffects = {
    screenFlash(color, maxAlpha, duration) {
        const flash = (color === 0xFFFFFF) ? this.whiteFlash : this.redFlash;
        flash.setFillStyle(color, 0);
        this.tweens.add({
            targets: flash, alpha: maxAlpha, duration: duration / 2,
            yoyo: true, onComplete: () => flash.setAlpha(0)
        });
    },

    spawnInputRipple(x, y) {
        for (let i = 0; i < 6; i++) {
            const circle = this.add.circle(x, y, 4, 0xFFFFFF, 0.8).setDepth(90);
            this.tweens.add({
                targets: circle, scaleX: 3 + i * 0.5, scaleY: 3 + i * 0.5, alpha: 0,
                duration: 200 + i * 30, onComplete: () => circle.destroy()
            });
        }
    },

    spawnParticles(x, y, count, key, minSpeed, maxSpeed, life) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const color = key === 'particle_gold' ? COLORS.GOLD : key === 'particle_green' ? COLORS.GOOD : COLORS.DARK_BLUE;
            const p = this.add.circle(x, y, 4, color, 1).setDepth(8);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: life,
                onComplete: () => p.destroy()
            });
        }
    },

    floatingText(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontSize: '22px', fontFamily: 'Arial', color: color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: txt, y: y - 50, alpha: 0, duration: 600,
            onComplete: () => txt.destroy()
        });
    },

    // --- Audio via WebAudio ---

    getAudioCtx() {
        if (!this._audioCtx) {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioCtx;
    },

    playTone(freq, duration, type, gain) {
        try {
            const ctx = this.getAudioCtx();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            g.gain.value = gain || 0.15;
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
        } catch (e) {}
    },

    playPerfectSound() {
        const pitchBonus = Math.floor(this.combo / 5) * 30;
        this.playTone(523 + pitchBonus, 150, 'sine', 0.15);
        setTimeout(() => this.playTone(659 + pitchBonus, 200, 'sine', 0.12), 100);
    },

    playGoodSound() {
        this.playTone(392, 150, 'sine', 0.1);
    },

    playSplatSound() {
        this.playTone(131, 200, 'triangle', 0.2);
        setTimeout(() => this.playTone(110, 200, 'triangle', 0.15), 100);
    },

    playGameOverSound() {
        [262, 220, 175, 131].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 200, 'sine', 0.12), i * 150);
        });
    }
};
