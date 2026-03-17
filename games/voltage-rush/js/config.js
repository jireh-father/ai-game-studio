// Voltage Rush - Game Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const HUD_HEIGHT = 56;
const NODE_RADIUS = 22;
const NODE_SPACING_MIN = 80;
const NODE_TAP_RADIUS = 30;
const TAP_COOLDOWN = 200;
const ARC_TRANSFER = 0.15;
const HIT_STOP_MS = 40;

const COLORS = {
    bg: 0x0A0A14,
    bgHex: '#0A0A14',
    nodeIdle: 0x00AAFF,
    safe: 0x00FFCC,
    warning: 0xFFAA00,
    critical: 0xFF3300,
    rapid: 0xFF5500,
    insulated: 0x444455,
    insulatedBody: 0x222233,
    arc: 0xAADDFF,
    wire: 0x1A2040,
    uiText: 0xFFFFFF,
    uiBg: 0x0D0D1F,
    gold: 0xFFD700,
    white: 0xFFFFFF
};

const SCORE_VALUES = {
    safe: 50,
    warning: 100,
    critical: 200,
    stageClearBase: 500
};

const CHAIN_THRESHOLDS = [
    { count: 0, multiplier: 1.0 },
    { count: 5, multiplier: 1.5 },
    { count: 10, multiplier: 2.0 }
];

const DIFFICULTY = {
    baseChargeRate: 0.15,
    chargeRatePerStage: 0.012,
    maxChargeRate: 0.90,
    baseTimer: 15,
    minTimer: 8,
    timerReductionPerStage: 0.25,
    restStageTimerBonus: 5,
    restStageChargeMult: 0.7,
    bossChargeRateMult: 1.2,
    bossTimerReduction: 2,
    rapidChargeMult: 2.0,
    maxNodes: 12,
    maxInsulated: 3,
    maxRapid: 4,
    isolationCheckDist: 150
};

function getChargeRate(stage) {
    var rate = DIFFICULTY.baseChargeRate + (stage - 1) * DIFFICULTY.chargeRatePerStage;
    return Math.min(rate, DIFFICULTY.maxChargeRate);
}

function getStageTimer(stage) {
    var t = DIFFICULTY.baseTimer - (stage - 1) * DIFFICULTY.timerReductionPerStage;
    return Math.max(DIFFICULTY.minTimer, t);
}

function getNodeCount(stage) {
    return Math.min(4 + Math.floor(stage / 3), DIFFICULTY.maxNodes);
}

function getInsulatedCount(stage) {
    return Math.min(Math.floor(stage / 7), DIFFICULTY.maxInsulated);
}

function getRapidCount(stage) {
    if (stage < 16) return 0;
    return Math.min(Math.floor((stage - 15) / 4), DIFFICULTY.maxRapid);
}

function isRestStage(stage) {
    return stage > 1 && stage % 5 === 0;
}

function isBossStage(stage) {
    return stage > 1 && stage % 10 === 0;
}

function getChargeColor(fill) {
    if (fill >= 0.8) return COLORS.critical;
    if (fill >= 0.5) return COLORS.warning;
    return COLORS.safe;
}

function getChargeColorHex(fill) {
    if (fill >= 0.8) return '#FF3300';
    if (fill >= 0.5) return '#FFAA00';
    return '#00FFCC';
}

var GameState = {
    score: 0,
    stage: 1,
    highScore: 0,
    safeChain: 0,
    multiplier: 1.0,
    continueUsed: false,
    soundOn: true,
    gameOverCount: 0,

    reset: function() {
        this.score = 0;
        this.stage = 1;
        this.safeChain = 0;
        this.multiplier = 1.0;
    },

    loadHighScore: function() {
        try {
            var s = localStorage.getItem('voltage-rush_high_score');
            if (s) this.highScore = parseInt(s, 10) || 0;
        } catch(e) {}
    },

    saveHighScore: function() {
        try {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('voltage-rush_high_score', this.highScore);
                return true;
            }
        } catch(e) {}
        return false;
    }
};
