const CONFIG = {
    WIDTH: 360,
    HEIGHT: 640,
    IDLE_DEATH_SECONDS: 24,
    IDLE_WARN_YELLOW: 15,
    IDLE_WARN_RED: 20,
    COMBO_WINDOW: 400,
    COMBO_FORGIVE: 1500,
    SWIPE_MIN_DIST: 20,
    POST_ESCAPE_METER: 40,
    METER_MAX: 100,
    SHELF_Y: 260,
    SHELF_HEIGHT: 16,
    ITEM_WIDTH: 48,
    ITEM_HEIGHT: 60,
    DOG_Y: 420,
    STAGE_CLEAR_DELAY: 1000
};

const COLORS = {
    BG: 0x1A1A2E,
    WALL: 0x2D2B3D,
    SHELF: 0x8B5E3C,
    CAT: 0x1C1C1C,
    DOG: 0xD4A76A,
    CHEAP: 0x7A8FA6,
    MID: 0xE8A838,
    VALUABLE: 0xD4AF37,
    HEIRLOOM: 0x9B59B6,
    PRECIOUS: 0x00FFF0,
    HUD_TEXT: 0xF0EDE8,
    COMBO: 0xFFE234,
    ALERT: 0xFF3333,
    STAGE_CLEAR: 0xFFD700,
    METER_BG: 0x3A3A4A,
    METER_FILL: 0xFF6B35,
    METER_DANGER: 0xFF0000
};

const NOISE_VALUES = { cheap: 8, mid: 18, valuable: 35, heirloom: 55, precious: 80 };
const ITEM_POINTS = { cheap: 100, mid: 250, valuable: 500, heirloom: 1000, precious: 2000 };

const TIER_COLORS = {
    cheap: '#7A8FA6', mid: '#E8A838', valuable: '#D4AF37',
    heirloom: '#9B59B6', precious: '#00FFF0'
};
const TIER_COLORS_INT = {
    cheap: 0x7A8FA6, mid: 0xE8A838, valuable: 0xD4AF37,
    heirloom: 0x9B59B6, precious: 0x00FFF0
};

const ESCAPE_CONFIG = {
    swipes: [3, 3, 3, 3, 4, 4],
    time: [1500, 1500, 1500, 1500, 1200, 1200]
};

const SVG_CAT = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="12" y="28" width="36" height="24" rx="12" fill="#1C1C1C"/><circle cx="38" cy="22" r="14" fill="#1C1C1C"/><polygon points="26,10 30,18 22,18" fill="#1C1C1C"/><polygon points="44,8 48,16 40,16" fill="#1C1C1C"/><circle cx="34" cy="21" r="3" fill="#FFB300"/><circle cx="42" cy="21" r="3" fill="#FFB300"/><path d="M12,44 Q4,36 8,28" stroke="#1C1C1C" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="48" cy="50" rx="8" ry="5" fill="#1C1C1C"/></svg>`;

const SVG_DOG_SLEEP = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48"><ellipse cx="38" cy="32" rx="30" ry="14" fill="#D4A76A"/><circle cx="64" cy="28" r="12" fill="#D4A76A"/><ellipse cx="70" cy="22" rx="8" ry="5" fill="#C09050" transform="rotate(-20 70 22)"/><line x1="60" y1="28" x2="68" y2="28" stroke="#5A3E28" stroke-width="2" stroke-linecap="round"/></svg>`;

const SVG_DOG_AWAKE = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48"><ellipse cx="38" cy="32" rx="30" ry="14" fill="#D4A76A"/><circle cx="64" cy="28" r="12" fill="#D4A76A"/><ellipse cx="70" cy="22" rx="8" ry="5" fill="#C09050" transform="rotate(-20 70 22)"/><circle cx="60" cy="26" r="4" fill="#FF3333"/><circle cx="68" cy="26" r="4" fill="#FF3333"/></svg>`;

const SVG_ITEMS = {
    cheap: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56"><rect x="8" y="12" width="24" height="28" rx="4" fill="#7A8FA6"/><rect x="8" y="8" width="24" height="8" rx="2" fill="#6A7F96"/><path d="M32,20 Q42,20 42,28 Q42,36 32,36" stroke="#6A7F96" stroke-width="3" fill="none"/></svg>`,
    mid: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56"><rect x="16" y="32" width="8" height="20" rx="2" fill="#E8A838"/><ellipse cx="20" cy="32" rx="10" ry="4" fill="#D4922A"/><ellipse cx="20" cy="52" rx="12" ry="4" fill="#D4922A"/><rect x="18" y="8" width="4" height="24" rx="2" fill="#F5C842"/><ellipse cx="20" cy="7" rx="3" ry="5" fill="#FF8C00" opacity="0.8"/></svg>`,
    valuable: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56"><path d="M14,48 Q6,32 12,16 Q20,4 28,16 Q34,32 26,48 Z" fill="#D4AF37"/><ellipse cx="20" cy="48" rx="8" ry="4" fill="#B8960A"/><ellipse cx="20" cy="16" rx="6" ry="4" fill="#B8960A"/><rect x="10" y="30" width="20" height="4" rx="1" fill="#B8960A" opacity="0.5"/></svg>`,
    heirloom: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56"><rect x="12" y="44" width="16" height="8" rx="2" fill="#7D3C98"/><rect x="15" y="20" width="10" height="24" rx="3" fill="#9B59B6"/><circle cx="20" cy="14" r="8" fill="#9B59B6"/><circle cx="20" cy="14" r="4" fill="#D7BDE2"/></svg>`,
    precious: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="56" viewBox="0 0 40 56"><path d="M20,4 L28,18 L36,18 L30,28 L34,44 L20,36 L6,44 L10,28 L4,18 L12,18 Z" fill="#00FFF0" opacity="0.9"/><circle cx="20" cy="24" r="6" fill="#FFFFFF" opacity="0.5"/></svg>`
};

const SVG_SHELF = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="16" viewBox="0 0 360 16"><rect x="0" y="0" width="360" height="16" rx="3" fill="#8B5E3C"/><rect x="0" y="0" width="360" height="4" rx="3" fill="#A0714F"/></svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#FFFFFF"/></svg>`;
