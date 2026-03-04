// main.js — Phaser config, scene management, state, audio

// --- Global State ---
window.GAME_STATE = {
    score: 0,
    stage: 1,
    highScore: 0,
    highestStage: 0,
    gamesPlayed: 0,
    settings: { sound: true, music: true },
};

function loadState() {
    try {
        const hs = localStorage.getItem('spin-clash_high_score');
        if (hs) window.GAME_STATE.highScore = parseInt(hs, 10);
        const gp = localStorage.getItem('spin-clash_games_played');
        if (gp) window.GAME_STATE.gamesPlayed = parseInt(gp, 10);
        const hst = localStorage.getItem('spin-clash_highest_stage');
        if (hst) window.GAME_STATE.highestStage = parseInt(hst, 10);
        const settings = localStorage.getItem('spin-clash_settings');
        if (settings) window.GAME_STATE.settings = JSON.parse(settings);
    } catch (e) { /* ignore */ }
}

function saveState() {
    try {
        localStorage.setItem('spin-clash_high_score', window.GAME_STATE.highScore);
        localStorage.setItem('spin-clash_games_played', window.GAME_STATE.gamesPlayed);
        localStorage.setItem('spin-clash_highest_stage', window.GAME_STATE.highestStage);
        localStorage.setItem('spin-clash_settings', JSON.stringify(window.GAME_STATE.settings));
    } catch (e) { /* ignore */ }
}

loadState();

// --- Web Audio Sound Effects ---
const SoundFX = {
    ctx: null,

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { /* no audio */ }
    },

    play(name) {
        if (!this.ctx || !window.GAME_STATE.settings.sound) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        try { this[name](); } catch (e) { /* ignore */ }
    },

    launch() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(200, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.4, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.15);
    },

    hit() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(440, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.25);
        g.gain.setValueAtTime(0.5, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.25);
    },

    enemyOff() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(600, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.4, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.5);
    },

    stageClear() {
        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.4, t + i * 0.2);
            g.gain.linearRampToValueAtTime(0, t + i * 0.2 + 0.2);
            o.connect(g).connect(this.ctx.destination);
            o.start(t + i * 0.2);
            o.stop(t + i * 0.2 + 0.2);
        });
    },

    death() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(200, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.8);
        g.gain.setValueAtTime(0.5, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.8);
    },

    uiTap() {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
        }
        const src = this.ctx.createBufferSource();
        const g = this.ctx.createGain();
        src.buffer = buffer;
        g.gain.setValueAtTime(0.15, this.ctx.currentTime);
        src.connect(g).connect(this.ctx.destination);
        src.start();
    },

    chainKill() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(1320, this.ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.35, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        o.connect(g).connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
    },
};

// --- Boot Scene (texture-less, just init audio) ---
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    create() {
        // Init audio on first interaction
        this.input.once('pointerdown', () => SoundFX.init());
        SoundFX.init();
        this.scene.start('MenuScene');
    }
}

// --- Phaser Config ---
const phaserConfig = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0A0E1A',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    input: {
        activePointers: 1,
    },
    render: {
        pixelArt: false,
        antialias: true,
    },
};

const game = new Phaser.Game(phaserConfig);

// Prevent scrolling/zooming on touch
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', (e) => {
    if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });
