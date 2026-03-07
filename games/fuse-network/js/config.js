// config.js - Colors, difficulty tables, SVG strings, score values
const COLORS = {
    BACKGROUND: 0x1A1A2E,
    BACKGROUND_HEX: '#1A1A2E',
    FUSE_UNLIT: 0x3A3A4E,
    FIRE_NORMAL: 0xFFE44D,
    FIRE_FAST: 0xFF8C00,
    FIRE_DELAYED: 0x00CED1,
    FIRE_SPLIT: 0xFF00FF,
    BOMB: 0xFF2D2D,
    BASE: 0x4488FF,
    BASE_DAMAGED: 0xFF6B35,
    SAFE_ZONE: 0x2ECC71,
    NODE: 0xAAAACC,
    CUT_MARK: 0xFF4444,
    SCORE_TEXT: 0xFFD700,
    UI_TEXT: 0xFFFFFF,
    UI_ACCENT: 0x00AAFF,
    UI_BG: 0x000000,
    HP_FULL: 0x44DDFF,
    HP_EMPTY: 0x333344,
    SPARK: 0xFFFFAA,
    GOLD: 0xFFD700
};

const FUSE_TYPES = { NORMAL: 0, FAST: 1, DELAYED: 2, SPLIT: 3 };

const FUSE_VISUAL = {
    [FUSE_TYPES.NORMAL]: { color: 0xFFE0A0, width: 3 },
    [FUSE_TYPES.FAST]: { color: 0xFF8C00, width: 4 },
    [FUSE_TYPES.DELAYED]: { color: 0x00CED1, width: 3 },
    [FUSE_TYPES.SPLIT]: { color: 0xFF00FF, width: 3 }
};

const SCORE_VALUES = {
    CUT_BASE: 50, LAST_SECOND_MULT: 3, CLOSE_CALL_MULT: 2,
    STAGE_CLEAR_BASE: 200, STAGE_CLEAR_PER_STAGE: 100,
    TIME_BONUS_PER_SEC: 15, PERFECT_BONUS: 300, FLAWLESS_BONUS: 500,
    SAFE_REDIRECT: 75, COMBO_INCREMENT: 25
};

const GAME_CONFIG = {
    INITIAL_HP: 3, LAST_SECOND_PX: 40, CLOSE_CALL_PX: 80,
    KIT_DURATION: 3000, INACTIVITY_TIMEOUT: 8000,
    TAP_RADIUS: 40, NODE_MIN_DIST: 60
};

const LAYOUT = {
    HUD_HEIGHT: 56, BOTTOM_BAR: 36,
    TOP_ZONE: { minY: 80, maxY: 140 },
    UPPER_MID: { minY: 180, maxY: 300 },
    LOWER_MID: { minY: 320, maxY: 460 },
    BOTTOM_ZONE: { minY: 500, maxY: 580 },
    BASE_Y: 620
};

const SVG_STRINGS = {
    BOMB: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="26" r="18" fill="#FF2D2D"/><circle cx="24" cy="26" r="14" fill="#CC1111"/><circle cx="24" cy="26" r="8" fill="#FF4444" opacity="0.6"/><rect x="20" y="4" width="8" height="10" rx="2" fill="#888888"/><line x1="24" y1="4" x2="24" y2="0" stroke="#FFE44D" stroke-width="2" stroke-linecap="round"/></svg>',
    BASE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><path d="M28 4 L48 16 L48 36 Q48 48 28 54 Q8 48 8 36 L8 16 Z" fill="#4488FF" stroke="#66AAFF" stroke-width="2"/><path d="M28 12 L40 20 L40 34 Q40 42 28 46 Q16 42 16 34 L16 20 Z" fill="#2266CC" opacity="0.6"/><text x="28" y="36" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">B</text></svg>',
    BASE_DAMAGED: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><path d="M28 4 L48 16 L48 36 Q48 48 28 54 Q8 48 8 36 L8 16 Z" fill="#FF6B35" stroke="#FF8855" stroke-width="2"/><path d="M28 12 L40 20 L40 34 Q40 42 28 46 Q16 42 16 34 L16 20 Z" fill="#CC4400" opacity="0.6"/><line x1="18" y1="18" x2="38" y2="42" stroke="#FFE44D" stroke-width="2" opacity="0.4"/></svg>',
    NODE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#3A3A4E" stroke="#AAAACC" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#666688"/></svg>',
    SAFE_ZONE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="6" fill="#1A3A2E" stroke="#2ECC71" stroke-width="2"/><path d="M10 16 L14 20 L22 12" stroke="#2ECC71" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    CUT_MARK: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><line x1="4" y1="4" x2="24" y2="24" stroke="#FF4444" stroke-width="4" stroke-linecap="round"/><line x1="24" y1="4" x2="4" y2="24" stroke="#FF4444" stroke-width="4" stroke-linecap="round"/></svg>',
    SHIELD_FULL: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 1 L18 5 L18 12 Q18 17 10 19 Q2 17 2 12 L2 5 Z" fill="#44DDFF" stroke="#66EEFF" stroke-width="1"/></svg>',
    SHIELD_EMPTY: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 1 L18 5 L18 12 Q18 17 10 19 Q2 17 2 12 L2 5 Z" fill="#333344" stroke="#555566" stroke-width="1"/></svg>',
    KIT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect x="4" y="10" width="28" height="20" rx="3" fill="#2A5A2A" stroke="#44AA44" stroke-width="2"/><line x1="12" y1="5" x2="12" y2="10" stroke="#44AA44" stroke-width="2"/><line x1="24" y1="5" x2="24" y2="10" stroke="#44AA44" stroke-width="2"/><rect x="8" y="14" width="20" height="12" rx="2" fill="#1A3A1A"/><text x="18" y="24" text-anchor="middle" fill="#44FF44" font-size="10" font-weight="bold">KIT</text></svg>'
};
