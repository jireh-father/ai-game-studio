// config.js - Colors, SVG strings, rule definitions, difficulty tables
const COLORS = {
    BG: '#0D1B2A',
    SURFACE: '#1B2838',
    TILE_RED: '#E63946',
    TILE_BLUE: '#457B9D',
    TILE_GREEN: '#2A9D8F',
    TILE_YELLOW: '#E9C46A',
    CORRECT: '#06D6A0',
    WRONG: '#FF006E',
    TEXT: '#EDF2F4',
    ACCENT: '#A8DADC',
    CRACK_BURST: '#FFFFFF',
    HUD_BG: 'rgba(13,27,42,0.8)'
};

const TILE_COLORS = ['red', 'blue', 'green', 'yellow'];
const TILE_COLOR_HEX = { red: '#E63946', blue: '#457B9D', green: '#2A9D8F', yellow: '#E9C46A' };
const SHAPES = ['circle', 'triangle', 'square', 'diamond'];

const SCORING = {
    correctTap: 50,
    ruleCracked: 500,
    perfectCrack: 300,
    speedBonus: 200,
    firstGuess: 100,
    wrongPenalty: 25
};

const RULE_CATEGORIES = {
    COLOR: 'color', SHAPE: 'shape', POSITION: 'position',
    NEIGHBOR: 'neighbor', COMPOUND_AND: 'compound_and',
    COMPOUND_OR: 'compound_or', NEGATION: 'negation', COMPLEX: 'complex'
};

const UNLOCK_THRESHOLDS = { detective: 20, mastermind: 50 };

const STREAK_TO_CRACK = 5;
const MAX_LIVES = 3;
const HINTS_PER_RULE = 1;

function buildTileSVG(colorHex, shape) {
    const bg = COLORS.SURFACE;
    let inner = '';
    if (shape === 'circle') inner = `<circle cx="40" cy="40" r="22" fill="${colorHex}" opacity="0.9"/>`;
    else if (shape === 'triangle') inner = `<polygon points="40,16 62,60 18,60" fill="${colorHex}" opacity="0.9"/>`;
    else if (shape === 'square') inner = `<rect x="20" y="20" width="40" height="40" rx="4" fill="${colorHex}" opacity="0.9"/>`;
    else if (shape === 'diamond') inner = `<polygon points="40,14 64,40 40,66 16,40" fill="${colorHex}" opacity="0.9"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
        `<rect x="2" y="2" width="76" height="76" rx="12" fill="${bg}" stroke="${colorHex}" stroke-width="3"/>` +
        inner + `</svg>`;
}

const SVG_STRINGS = {};
// Generate 16 tile textures: color_shape
TILE_COLORS.forEach(c => {
    SHAPES.forEach(s => {
        SVG_STRINGS[`tile_${c}_${s}`] = buildTileSVG(TILE_COLOR_HEX[c], s);
    });
});

// UI icons
SVG_STRINGS['life_icon'] = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="none" stroke="#EDF2F4" stroke-width="2"/><line x1="15" y1="15" x2="21" y2="21" stroke="#EDF2F4" stroke-width="2" stroke-linecap="round"/></svg>`;
SVG_STRINGS['life_icon_empty'] = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="none" stroke="#555" stroke-width="2"/><line x1="15" y1="15" x2="21" y2="21" stroke="#555" stroke-width="2" stroke-linecap="round"/></svg>`;
SVG_STRINGS['hint_icon'] = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="18" r="10" fill="#E9C46A" opacity="0.8"/><rect x="18" y="28" width="8" height="6" rx="2" fill="#E9C46A" opacity="0.6"/><line x1="22" y1="6" x2="22" y2="2" stroke="#E9C46A" stroke-width="1.5"/><line x1="32" y1="10" x2="35" y2="7" stroke="#E9C46A" stroke-width="1.5"/><line x1="12" y1="10" x2="9" y2="7" stroke="#E9C46A" stroke-width="1.5"/></svg>`;
SVG_STRINGS['streak_filled'] = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="#06D6A0"/></svg>`;
SVG_STRINGS['streak_empty'] = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke="#A8DADC" stroke-width="1.5"/></svg>`;

function getDifficultyForStage(stage) {
    if (stage <= 3) return { category: RULE_CATEGORIES.COLOR, timer: 15, validRange: [5, 10] };
    if (stage <= 6) return { category: RULE_CATEGORIES.SHAPE, timer: 14, validRange: [4, 10] };
    if (stage <= 10) return { category: RULE_CATEGORIES.POSITION, timer: 13, validRange: [3, 8] };
    if (stage <= 15) return { category: RULE_CATEGORIES.NEIGHBOR, timer: 12, validRange: [3, 8] };
    if (stage <= 20) return { category: RULE_CATEGORIES.COMPOUND_AND, timer: 11, validRange: [3, 7] };
    if (stage <= 30) return { category: RULE_CATEGORIES.COMPOUND_OR, timer: 10, validRange: [3, 7] };
    if (stage <= 40) return { category: RULE_CATEGORIES.NEGATION, timer: 9, validRange: [3, 7] };
    if (stage <= 50) return { category: RULE_CATEGORIES.COMPLEX, timer: 8, validRange: [3, 6] };
    return { category: RULE_CATEGORIES.COMPLEX, timer: 7, validRange: [3, 6] };
}

function getTimerDuration(stage) {
    return Math.max(7, 16 - Math.floor(stage / 3));
}

function isRestStage(stage) {
    return stage > 1 && stage % 8 === 0;
}

// Audio helper using Web Audio API
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playTone(freq, duration, type, volume) {
    if (typeof GameState === 'undefined' || !GameState || !GameState.settings.sound) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume || 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) { /* ignore audio errors */ }
}

function playCorrectSound(streak) {
    const base = 523 + (streak || 0) * 50;
    playTone(base, 80, 'sine', 0.4);
    setTimeout(() => playTone(base * 1.26, 80, 'sine', 0.35), 60);
}

function playWrongSound() { playTone(100, 200, 'sawtooth', 0.5); }

function playCrackSound(streak) {
    const base = 523 + (streak || 0) * 100;
    [0, 80, 160, 240].forEach((t, i) => {
        setTimeout(() => playTone(base * [1, 1.26, 1.5, 2][i], 80, 'sine', 0.5), t);
    });
}

function playLifeLostSound() { playTone(262, 130, 'square', 0.4); setTimeout(() => playTone(247, 130, 'square', 0.35), 100); }

function playGameOverSound() {
    const notes = [523, 494, 466, 440, 415, 392];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 100, 'sine', 0.5), i * 100));
}

function playButtonSound() { playTone(4000, 50, 'sine', 0.15); }
function playHintSound() { playTone(1200, 180, 'triangle', 0.3); }
function playStreakDotSound(idx) { playTone(600 + idx * 100, 80, 'sine', 0.3); }
function playTickSound() { playTone(800, 60, 'sine', 0.25); }
