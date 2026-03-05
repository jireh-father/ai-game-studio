// ads.js - Stub ad hooks + Web Audio synth

// Stub ad functions (POC - no real ads)
function showInterstitial(cb) { if (cb) cb(true); }
function showRewarded(cb) { if (cb) cb(true); }

// Audio Synth - Web Audio API
class AudioSynth {
    constructor() {
        this.ctx = null;
        this.driftOsc = null;
        this.driftGain = null;
        this.musicInterval = null;
        this.enabled = true;
        this.musicEnabled = true;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { this.enabled = false; }
    }

    _osc(freq, type, dur, vol) {
        if (!this.ctx || !this.enabled) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol || 0.15;
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        o.stop(this.ctx.currentTime + dur + 0.05);
    }

    _noise(dur, vol) {
        if (!this.ctx || !this.enabled) return;
        const bufSize = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        const g = this.ctx.createGain();
        src.buffer = buf;
        g.gain.value = vol || 0.1;
        src.connect(g);
        g.connect(this.ctx.destination);
        src.start();
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    }

    playDriftStart() {
        if (!this.ctx || !this.enabled) return;
        if (this.driftOsc) return;
        this.driftOsc = this.ctx.createOscillator();
        this.driftGain = this.ctx.createGain();
        this.driftOsc.type = 'sawtooth';
        this.driftOsc.frequency.value = 80;
        this.driftGain.gain.value = 0.08;
        this.driftOsc.connect(this.driftGain);
        this.driftGain.connect(this.ctx.destination);
        this.driftOsc.start();
    }

    updateDriftPitch(progress) {
        if (this.driftOsc) {
            this.driftOsc.frequency.value = 80 + progress * 120;
        }
    }

    stopDrift() {
        if (this.driftOsc) {
            try { this.driftOsc.stop(); } catch(e) {}
            this.driftOsc = null;
            this.driftGain = null;
        }
    }

    playLaunch() {
        this._osc(200, 'sine', 0.2, 0.12);
        setTimeout(() => this._osc(500, 'sine', 0.15, 0.1), 50);
        setTimeout(() => this._osc(800, 'sine', 0.1, 0.08), 100);
    }

    playLanding(quality) {
        if (quality === 'bullseye') {
            this._osc(523, 'sine', 0.12, 0.15);
            setTimeout(() => this._osc(659, 'sine', 0.12, 0.15), 80);
            setTimeout(() => this._osc(784, 'sine', 0.2, 0.18), 160);
            setTimeout(() => this._osc(200, 'triangle', 0.15, 0.12), 50);
        } else if (quality === 'good') {
            this._osc(440, 'sine', 0.12, 0.12);
            setTimeout(() => this._osc(554, 'sine', 0.15, 0.12), 80);
            this._osc(150, 'triangle', 0.1, 0.08);
        } else if (quality === 'ok') {
            this._osc(220, 'triangle', 0.15, 0.1);
        } else {
            this._osc(180, 'sawtooth', 0.3, 0.1);
            setTimeout(() => this._osc(120, 'sawtooth', 0.2, 0.08), 100);
        }
    }

    playCrash() {
        this._osc(120, 'sawtooth', 0.4, 0.15);
        this._osc(80, 'square', 0.3, 0.1);
        this._noise(0.4, 0.15);
    }

    playComboMilestone(level) {
        const base = 600 + level * 100;
        this._osc(base, 'sine', 0.1, 0.12);
        setTimeout(() => this._osc(base + 200, 'sine', 0.1, 0.12), 60);
        setTimeout(() => this._osc(base + 400, 'sine', 0.15, 0.14), 120);
    }

    playGameOver() {
        this._osc(300, 'sine', 0.4, 0.12);
        setTimeout(() => this._osc(200, 'sine', 0.6, 0.1), 300);
    }

    playMenuTap() {
        this._osc(800, 'sine', 0.06, 0.08);
    }

    playStageClear() {
        this._osc(523, 'sine', 0.1, 0.1);
        setTimeout(() => this._osc(659, 'sine', 0.1, 0.1), 80);
        setTimeout(() => this._osc(784, 'sine', 0.1, 0.1), 160);
        setTimeout(() => this._osc(1047, 'sine', 0.2, 0.12), 240);
    }

    startMusic(bpm) {
        if (!this.ctx || !this.musicEnabled) return;
        this.stopMusic();
        const interval = 60000 / bpm / 2;
        let beat = 0;
        this.musicInterval = setInterval(() => {
            if (!this.musicEnabled) return;
            if (beat % 4 === 0) this._osc(55, 'triangle', 0.15, 0.04);
            if (beat % 2 === 1) this._noise(0.03, 0.02);
            beat++;
        }, interval);
    }

    stopMusic() {
        if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
    }
}

const audioSynth = new AudioSynth();
