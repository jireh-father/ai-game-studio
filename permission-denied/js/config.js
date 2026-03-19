// Permission Denied - Game Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
    TITLE_BAR: 0x336699,
    TITLE_BAR_HEX: '#336699',
    WINDOW_BG: 0xF0F0F0,
    WINDOW_BG_HEX: '#F0F0F0',
    BUTTON_DEFAULT: 0xD4D0C8,
    BUTTON_HIGHLIGHT: 0xFFFFFF,
    BUTTON_SHADOW: 0x808080,
    ACCEPT_GREEN: 0x4CAF50,
    ACCEPT_GREEN_HEX: '#4CAF50',
    DANGER_RED: 0xCC3333,
    DANGER_RED_HEX: '#CC3333',
    DESKTOP_TEAL: 0x008080,
    DESKTOP_TEAL_HEX: '#008080',
    TIMER_GREEN: 0x00AA44,
    TIMER_YELLOW: 0xFFCC00,
    TIMER_RED: 0xDD2222,
    TEXT_PRIMARY: '#1A1A1A',
    TEXT_DISABLED: '#999999',
    SCORE_WHITE: '#FFFFFF',
    BSOD_BLUE: 0x0000AA,
    BSOD_BLUE_HEX: '#0000AA',
    GOLD: '#FFD700',
    GOLD_HEX: 0xFFD700,
    REAL_GAME_BG: 0xFAFAFA
};

const DIFFICULTY = {
    BASE_TIMER: 8000,
    MIN_TIMER: 5000,
    TIER_DECREMENT: 300,
    BASE_BTN_SPEED: 40,
    SPEED_INCREMENT: 15,
    MAX_BTN_SPEED: 160,
    BASE_BTN_SIZE: 120,
    SIZE_DECREMENT: 8,
    MIN_BTN_SIZE: 60,
    MIN_HIT_ZONE: 80,
    CHALLENGES_PER_SET: 5,
    MAX_TIER: 8
};

const SCORE_VALUES = {
    COMPLETE: 100,
    SPEED_4S: 50,
    SPEED_2S: 150,
    SET_BONUS: 500,
    REAL_GAME_BONUS: 250,
    STREAK_INCREMENT: 0.1,
    MAX_STREAK: 2.5
};

const CHALLENGE_TYPES = [
    'MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM',
    'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR', 'SLIDER'
];

// Tier unlocks: which types are available at each tier
const TIER_UNLOCK = {
    0: ['MOVING_BUTTON', 'POPUP_CHAIN'],
    1: ['MOVING_BUTTON', 'POPUP_CHAIN'],
    2: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM'],
    3: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA'],
    4: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR'],
    5: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR', 'SLIDER'],
    6: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR', 'SLIDER'],
    7: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR', 'SLIDER'],
    8: ['MOVING_BUTTON', 'POPUP_CHAIN', 'HOLD_CONFIRM', 'TOS_SCROLL', 'CAPTCHA', 'LOADING_BAR', 'SLIDER']
};

const PERMISSION_NOUNS = [
    'soul', 'microwave', 'Tuesday', 'left shoe', 'concept of ownership',
    "grandmother's maiden name", 'existential dread', 'WiFi password',
    'childhood memories', 'browser history', 'remaining willpower',
    'sense of humor', 'future regrets', 'lunch break'
];

const POPUP_MESSAGES = [
    'Error: Success', 'Warning: This is fine', 'Notice: You have been noticed',
    'Alert: No alerts', 'URGENT: Nothing urgent', 'Error 404: Error not found',
    'Warning: Ignoring this warning', 'Fatal: Non-fatal error occurred',
    'Info: No information available', 'Critical: Not critical at all'
];

const CAPTCHA_CATEGORIES = [
    'fire hydrants', 'crosswalks', 'traffic lights', 'bicycles',
    'boats', 'ambiguity', 'regret', 'the concept of free time'
];

const TOS_LINES = [
    'TERMS OF SERVICE - Permission Denied v2.0.4',
    '',
    'By reading this, you agree to everything.',
    'Section 1: You hereby forfeit your immortal soul.',
    'Section 2: All your base are belong to us.',
    'Section 3: We may change these terms retroactively.',
    'Retroactive Clause #7: This clause existed yesterday.',
    'Section 4: Your data will be used for "purposes".',
    'Section 5: We are not responsible for anything.',
    'Including (but not limited to) existential crises.',
    'Section 6: By scrolling, you agree to scroll more.',
    'Section 7: This section intentionally left confusing.',
    'Section 8: You cannot unread what you have read.',
    'Section 9: The cake is a lie. So is this EULA.',
    'Section 10: We reserve the right to reserve rights.',
    '',
    'Appendix A: Definitions of undefined terms.',
    'Appendix B: Redacted for your convenience.',
    'Appendix C: [DATA EXPUNGED]',
    '',
    'By scrolling to the bottom, you accept these terms.',
    '(You had no choice anyway.)'
];

// SVG strings
const SVG_WARNING_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 30,28 2,28" fill="#FFCC00" stroke="#CC9900" stroke-width="1"/><rect x="14" y="10" width="4" height="10" fill="#333"/><rect x="14" y="23" width="4" height="4" fill="#333"/></svg>';

const SVG_TIMEOUT_SCREEN = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#0000AA"/><circle cx="160" cy="70" r="40" fill="none" stroke="#FFF" stroke-width="3"/><circle cx="145" cy="60" r="5" fill="#FFF"/><circle cx="175" cy="60" r="5" fill="#FFF"/><path d="M140 85 Q160 75 180 85" fill="none" stroke="#FFF" stroke-width="3"/></svg>';

const SVG_CURSOR = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="2,2 2,20 8,15 12,22 15,21 11,14 18,14" fill="#333" stroke="#FFF" stroke-width="1"/></svg>';

const SVG_PARTICLE = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>';

function getDifficultyTier(challengeNum) {
    return Math.min(Math.floor((challengeNum - 1) / DIFFICULTY.CHALLENGES_PER_SET), DIFFICULTY.MAX_TIER);
}

function getChallengeTimer(tier) {
    return Math.max(DIFFICULTY.MIN_TIMER, DIFFICULTY.BASE_TIMER - tier * DIFFICULTY.TIER_DECREMENT);
}

function getButtonSpeed(tier) {
    return Math.min(DIFFICULTY.BASE_BTN_SPEED + tier * DIFFICULTY.SPEED_INCREMENT, DIFFICULTY.MAX_BTN_SPEED);
}

function getButtonSize(tier) {
    return Math.max(DIFFICULTY.BASE_BTN_SIZE - tier * DIFFICULTY.SIZE_DECREMENT, DIFFICULTY.MIN_BTN_SIZE);
}

function getPopupDepth(tier) {
    return Math.min(1 + Math.floor(tier / 2), 4);
}

// Global game state
const GameState = {
    score: 0,
    highScore: 0,
    challengeNum: 0,
    streakMultiplier: 1.0,
    gamesPlayed: 0,
    continueUsed: false,
    gameOverCount: 0,

    reset() {
        this.score = 0;
        this.challengeNum = 0;
        this.streakMultiplier = 1.0;
        this.continueUsed = false;
    },

    loadHighScore() {
        try {
            const hs = localStorage.getItem('permission-denied_high_score');
            if (hs) this.highScore = parseInt(hs, 10);
            const gp = localStorage.getItem('permission-denied_games_played');
            if (gp) this.gamesPlayed = parseInt(gp, 10);
        } catch (e) { /* localStorage unavailable */ }
    },

    saveHighScore() {
        try {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('permission-denied_high_score', this.highScore.toString());
            }
            this.gamesPlayed++;
            localStorage.setItem('permission-denied_games_played', this.gamesPlayed.toString());
        } catch (e) { /* localStorage unavailable */ }
    },

    getTopScores() {
        try {
            const raw = localStorage.getItem('permission-denied_top_scores');
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },

    saveTopScore() {
        try {
            let scores = this.getTopScores();
            scores.push(this.score);
            scores.sort((a, b) => b - a);
            scores = scores.slice(0, 5);
            localStorage.setItem('permission-denied_top_scores', JSON.stringify(scores));
        } catch (e) { /* fail silently */ }
    }
};
