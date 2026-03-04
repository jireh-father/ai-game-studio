// Stack Panic - Milestone System & Difficulty

class MilestoneManager {
    constructor() {
        this.currentMilestone = 1;
        this.blocksLanded = 0;
        this.consecutiveMisses = 0;
        this.consecutivePerfects = 0;
        this.params = getMilestoneParams(1);
        this.windOffset = 0;
        this.windDirection = 1;
    }

    reset() {
        this.currentMilestone = 1;
        this.blocksLanded = 0;
        this.consecutiveMisses = 0;
        this.consecutivePerfects = 0;
        this.params = getMilestoneParams(1);
        this.windOffset = 0;
        this.windDirection = 1;
    }

    onBlockLanded(quality) {
        this.blocksLanded++;
        this.consecutiveMisses = 0;

        if (quality === 'perfect') {
            this.consecutivePerfects++;
        } else {
            this.consecutivePerfects = 0;
        }

        const newMilestone = Math.floor(this.blocksLanded / 10) + 1;
        const changed = newMilestone !== this.currentMilestone;
        this.currentMilestone = newMilestone;
        this.params = getMilestoneParams(newMilestone);
        return changed;
    }

    onMiss() {
        this.consecutiveMisses++;
        this.consecutivePerfects = 0;
        return this.consecutiveMisses >= 3; // instant game over
    }

    getBlockVariant() {
        const p = this.params;
        let width = p.blockWidth;
        let height = BLOCK_HEIGHT;

        // Width variance +-8px
        width += (Math.random() - 0.5) * 16;
        width = Math.max(BLOCK_MIN_WIDTH, Math.min(BLOCK_BASE_WIDTH + 10, width));

        // Mercy mechanic: after 2 consecutive misses, +15% width
        if (this.consecutiveMisses >= 2) {
            width *= 1.15;
        }

        // Breathing room: every 5th consecutive perfect, force standard block
        if (this.consecutivePerfects > 0 && this.consecutivePerfects % 5 === 0) {
            return { width: Math.round(p.blockWidth), height: BLOCK_HEIGHT, irregular: false };
        }

        // Irregular block chance
        let irregular = false;
        if (Math.random() < p.irregularChance) {
            irregular = true;
            const variant = Math.random();
            if (variant < 0.33) {
                width *= 1.3; // wide
            } else if (variant < 0.66) {
                width *= 0.65; // narrow
            } else {
                height += 8; // tall
            }
        }

        return { width: Math.round(width), height: Math.round(height), irregular };
    }

    shouldTriggerEarthquake() {
        return Math.random() < this.params.earthquakeChance;
    }

    applyEarthquake(scene) {
        if (!this.shouldTriggerEarthquake()) return false;
        scene.cameras.main.shake(600, 0.025);
        return true;
    }

    getWindDrift() {
        if (this.params.windDrift === 0) return 0;
        this.windOffset += this.windDirection * this.params.windDrift * 0.016;
        if (Math.abs(this.windOffset) > this.params.windDrift) {
            this.windDirection *= -1;
        }
        return this.windOffset;
    }
}

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.musicNodes = [];
        this.musicGain = null;
        this.currentBPM = 100;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('WebAudio not available');
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(type, options = {}) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;

        switch (type) {
            case 'land_normal': this._woodThud(t, 220, 0.3); break;
            case 'land_perfect': this._woodThud(t, 220, 0.4); this._chime(t + 0.1, 880 * (options.pitch || 1), 0.25); break;
            case 'land_great': this._woodThud(t, 220, 0.35); break;
            case 'land_teeter': this._woodThud(t, 180, 0.3); this._creak(t + 0.05); break;
            case 'miss': this._woodThud(t, 80, 0.5); this._boom(t + 0.05); break;
            case 'drop_whoosh': this._whoosh(t); break;
            case 'collapse': this._rumble(t); break;
            case 'streak': this._streakChime(t); break;
            case 'milestone': this._milestoneChime(t); break;
            case 'ui_click': this._click(t); break;
            case 'earthquake': this._earthquakeRumble(t); break;
        }
    }

    _woodThud(t, freq, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.15);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.2);
    }

    _chime(t, freq, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.3);
    }

    _creak(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(160, t + 0.3);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.35);
    }

    _boom(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.3);
    }

    _whoosh(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.1);
    }

    _rumble(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.2);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.9);
    }

    _streakChime(t) {
        const notes = [523, 659, 784]; // C5 E5 G5
        notes.forEach((freq, i) => this._chime(t + i * 0.08, freq, 0.2));
    }

    _milestoneChime(t) {
        const notes = [262, 330, 392, 523]; // C4 E4 G4 C5
        notes.forEach((freq, i) => this._chime(t + i * 0.06, freq, 0.25));
    }

    _click(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.05);
    }

    _earthquakeRumble(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.3);
        osc.frequency.linearRampToValueAtTime(40, t + 0.6);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.65);
    }

    startMusic(milestone) { /* simplified: no continuous music for now */ }
    stopMusic() { }
    setMusicVolume(vol) { }
}

const audioManager = new AudioManager();
