// main.js - BootScene, Phaser config, GameState - LOADS LAST

// Global game state
const GameState = {
    score: 0, stage: 1, strikes: 0, combo: 0,
    highScore: 0, gamesPlayed: 0, highestStage: 0,
    settings: { sound: true, vibration: true }
};

function resetGameState() {
    GameState.score = 0;
    GameState.stage = 1;
    GameState.strikes = 0;
    GameState.combo = 0;
}

function loadState() {
    try {
        const hs = localStorage.getItem('trash_sort_panic_high_score');
        if (hs) GameState.highScore = parseInt(hs) || 0;
        const gp = localStorage.getItem('trash_sort_panic_games_played');
        if (gp) GameState.gamesPlayed = parseInt(gp) || 0;
        const hst = localStorage.getItem('trash_sort_panic_highest_stage');
        if (hst) GameState.highestStage = parseInt(hst) || 0;
        const settings = localStorage.getItem('trash_sort_panic_settings');
        if (settings) GameState.settings = JSON.parse(settings);
    } catch (e) { /* localStorage unavailable */ }
}

function saveState() {
    try {
        localStorage.setItem('trash_sort_panic_high_score', GameState.highScore);
        localStorage.setItem('trash_sort_panic_games_played', GameState.gamesPlayed);
        localStorage.setItem('trash_sort_panic_highest_stage', GameState.highestStage);
        localStorage.setItem('trash_sort_panic_settings', JSON.stringify(GameState.settings));
    } catch (e) { /* localStorage unavailable */ }
}

// Simple Web Audio sound system
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioCtx();
    return audioCtx;
}

function playSound(type, comboLevel) {
    if (!GameState.settings.sound) return;
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (type === 'grab') {
            const osc = ctx.createOscillator();
            osc.frequency.value = 800; osc.type = 'sine';
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'correct') {
            const pitch = 600 + (comboLevel || 0) * 50;
            const osc = ctx.createOscillator();
            osc.frequency.value = pitch; osc.type = 'square';
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'wrong') {
            const osc = ctx.createOscillator();
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(200, now + 0.3);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'splat') {
            const buf = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
            buf.buffer = buffer;
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            buf.connect(lp); lp.connect(gain); buf.start(now);
        } else if (type === 'condemned') {
            const osc = ctx.createOscillator();
            osc.frequency.value = 80; osc.type = 'sawtooth';
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.8);
        } else if (type === 'stageClear') {
            [523, 659, 784].forEach((f, i) => {
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.frequency.value = f; o.type = 'sine';
                g.gain.setValueAtTime(0.1, now + i * 0.12);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                o.connect(g); g.connect(ctx.destination);
                o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.3);
            });
        } else if (type === 'inspector') {
            const o1 = ctx.createOscillator(); o1.frequency.value = 800; o1.type = 'sine';
            const o2 = ctx.createOscillator(); o2.frequency.value = 600; o2.type = 'sine';
            const g1 = ctx.createGain(); const g2 = ctx.createGain();
            g1.gain.setValueAtTime(0.12, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            g2.gain.setValueAtTime(0.12, now + 0.25); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            o1.connect(g1); g1.connect(ctx.destination); o1.start(now); o1.stop(now + 0.2);
            o2.connect(g2); g2.connect(ctx.destination); o2.start(now + 0.25); o2.stop(now + 0.45);
        } else if (type === 'swap') {
            const buf = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
            buf.buffer = buffer;
            const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
            gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            buf.connect(hp); hp.connect(gain); buf.start(now);
        }
    } catch (e) { /* audio error */ }
}

// BootScene - load all textures once
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        loadState();
        const textures = {};

        // Bin textures
        for (const [key, svg] of Object.entries(SVG.bins)) {
            textures['bin_' + key] = `data:image/svg+xml;base64,${btoa(svg)}`;
        }
        // Item textures
        for (const [key, svg] of Object.entries(SVG.items)) {
            textures['item_' + key] = `data:image/svg+xml;base64,${btoa(svg)}`;
        }
        // Special textures
        textures['condemned'] = `data:image/svg+xml;base64,${btoa(SVG.condemned)}`;
        textures['inspector'] = `data:image/svg+xml;base64,${btoa(SVG.inspector)}`;
        textures['particle'] = `data:image/svg+xml;base64,${btoa(SVG.particle)}`;

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once(`addtexture-${key}`, () => {
                    if (--pending === 0) this.scene.start('MenuScene');
                });
                this.textures.addBase64(key, src);
            }
        }
        if (pending === 0) this.scene.start('MenuScene');
    }
}

// Phaser game config
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene],
    input: { activePointers: 3 },
    render: { pixelArt: false, antialias: true }
};

const game = new Phaser.Game(config);

// Orientation change handler
window.addEventListener('resize', () => {
    if (game && game.scale) game.scale.refresh();
});
