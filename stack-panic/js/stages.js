// Stack Panic - Stage System & Audio

class StageManager {
    constructor() {
        this.currentStage = 1;
        this.stageParams = generateStage(1);
        this.blocksLandedInStage = 0;
        this.totalBlocksLanded = 0;
        this.consecutiveMisses = 0;
        this.consecutivePerfects = 0;
        this.windOffset = 0;
        this.windDirection = 1;
    }

    onBlockLanded(quality) {
        this.totalBlocksLanded++;
        this.blocksLandedInStage++;
        this.consecutiveMisses = 0;
        if (quality === 'perfect') this.consecutivePerfects++;
        else this.consecutivePerfects = 0;
        return this.blocksLandedInStage >= this.stageParams.blocksRequired ? 'stage_clear' : 'landed';
    }

    advanceStage() {
        this.currentStage++;
        this.stageParams = generateStage(this.currentStage);
        this.blocksLandedInStage = 0;
        this.windOffset = 0;
    }

    onMiss() {
        this.consecutiveMisses++;
        this.consecutivePerfects = 0;
        return this.consecutiveMisses >= 3;
    }

    getNextTetromino() {
        // Mercy: after 2 consecutive misses, give easy O piece
        if (this.consecutiveMisses >= 2) {
            return { name: 'O', cells: [[0,0],[1,0],[0,1],[1,1]], color: TETROMINOES[1].color };
        }
        return getRandomTetromino();
    }

    applyEarthquake(scene) {
        if (Math.random() >= this.stageParams.earthquakeChance) return false;
        scene.cameras.main.shake(600, 0.025);
        return true;
    }

    getWindDrift() {
        if (this.stageParams.windDrift === 0) return 0;
        this.windOffset += this.windDirection * this.stageParams.windDrift * 0.016;
        if (Math.abs(this.windOffset) > this.stageParams.windDrift) this.windDirection *= -1;
        return this.windOffset;
    }

    getProgress() {
        return this.blocksLandedInStage / this.stageParams.blocksRequired;
    }
}

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.enabled = false; }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    play(type, options = {}) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        switch (type) {
            case 'land_normal': this._woodThud(t, 220, 0.3); break;
            case 'land_perfect': this._woodThud(t, 220, 0.4); this._chime(t + 0.1, 880 * (options.pitch || 1), 0.25); break;
            case 'land_great': this._woodThud(t, 220, 0.35); break;
            case 'miss': this._woodThud(t, 80, 0.5); this._boom(t + 0.05); break;
            case 'drop_whoosh': this._whoosh(t); break;
            case 'collapse': this._rumble(t); break;
            case 'streak': this._streakChime(t); break;
            case 'stage_clear': this._fanfare(t); break;
            case 'item_use': this._itemSound(t); break;
            case 'ui_click': this._click(t); break;
            case 'earthquake': this._earthquakeRumble(t); break;
        }
    }

    _osc(t, type, freq, vol, dur, freqEnd) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t);
        if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur * 0.8);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + dur + 0.01);
    }

    _woodThud(t, f, v) { this._osc(t, 'sine', f, v, 0.18, f * 0.5); }
    _chime(t, f, v) { this._osc(t, 'triangle', f, v, 0.28); }
    _boom(t) { this._osc(t, 'sine', 80, 0.6, 0.25, 30); }
    _whoosh(t) { this._osc(t, 'sine', 400, 0.15, 0.08, 200); }
    _click(t) { this._osc(t, 'square', 1000, 0.15, 0.04); }
    _rumble(t) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(60, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.8, t + 0.2);
        g.gain.linearRampToValueAtTime(0, t + 0.8);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.9);
    }
    _streakChime(t) { [523, 659, 784].forEach((f, i) => this._chime(t + i * 0.08, f, 0.2)); }
    _fanfare(t) { [262, 330, 392, 523, 659].forEach((f, i) => this._chime(t + i * 0.1, f, 0.3)); }
    _itemSound(t) { this._chime(t, 660, 0.2); this._chime(t + 0.08, 880, 0.25); }
    _earthquakeRumble(t) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(50, t);
        o.frequency.linearRampToValueAtTime(80, t + 0.3);
        o.frequency.linearRampToValueAtTime(40, t + 0.6);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.1);
        g.gain.linearRampToValueAtTime(0, t + 0.6);
        o.connect(g).connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.65);
    }

    startMusic() {} stopMusic() {} setMusicVolume() {}
}

const audioManager = new AudioManager();
