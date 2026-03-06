// config.js - Constants, colors, difficulty, SVG strings, fix banks

const COLORS = {
    BRASS: 0xC8963E,
    COPPER: 0xB87333,
    IRON: 0x4A4A4A,
    BG: 0x1A1A2E,
    WOOD: 0x2D1F11,
    FAIL_RED: 0xE63946,
    FAIL_ORANGE: 0xFF6B35,
    SUCCESS_GREEN: 0x2ECC71,
    GOLD: 0xFFD700,
    UI_TEXT: 0xF5E6CC,
    UI_BG: 0x0D0D1A,
    BTN_PRIMARY: 0x1ABC9C,
    BTN_DANGER: 0xC0392B,
    REST_BG: 0x1A3A4A,
    BRASS_HEX: '#C8963E',
    COPPER_HEX: '#B87333',
    IRON_HEX: '#4A4A4A',
    BG_HEX: '#1A1A2E',
    FAIL_RED_HEX: '#E63946',
    FAIL_ORANGE_HEX: '#FF6B35',
    SUCCESS_HEX: '#2ECC71',
    GOLD_HEX: '#FFD700',
    UI_TEXT_HEX: '#F5E6CC',
    BTN_PRIMARY_HEX: '#1ABC9C',
    BTN_DANGER_HEX: '#C0392B'
};

const GAME_SETTINGS = {
    LIVES: 3,
    INACTIVITY_DEATH_MS: 12000,
    INACTIVITY_WARNING_MS: 8000,
    CASCADE_BOOST_PLAUSIBLE: 0.5,
    CASCADE_BOOST_ABSURD: 1.0,
    GAME_WIDTH: 360,
    GAME_HEIGHT: 760,
    COMPONENT_SPACING: 80,
    COMPONENT_Y: 320,
    MACHINE_PAD: 60,
    FIX_ZONE_Y: 610
};

const SCORING = {
    BASE_FIX: 100, TIME_BONUS_PER_SEC: 5, COMPONENT_SAVED: 15,
    STREAK_BONUS: 25, SPEED_MULTIPLIER: 2.0, PERFECT_MULTIPLIER: 3.0,
    ABSURD_PENALTY: -50
};

const DIFFICULTY_TABLE = [
    { minStage: 1, maxStage: 3, components: 5, cascadeSpeed: 2000, parTime: 20, decoys: 0, branching: false, rootDepth: 0.35 },
    { minStage: 4, maxStage: 6, components: 7, cascadeSpeed: 1700, parTime: 18, decoys: 1, branching: false, rootDepth: 0.4 },
    { minStage: 7, maxStage: 10, components: 9, cascadeSpeed: 1400, parTime: 16, decoys: 1, branching: true, rootDepth: 0.5 },
    { minStage: 11, maxStage: 15, components: 11, cascadeSpeed: 1200, parTime: 14, decoys: 2, branching: true, rootDepth: 0.55 },
    { minStage: 16, maxStage: 20, components: 13, cascadeSpeed: 1000, parTime: 13, decoys: 2, branching: true, rootDepth: 0.6 },
    { minStage: 21, maxStage: 30, components: 15, cascadeSpeed: 900, parTime: 12, decoys: 3, branching: true, rootDepth: 0.6 },
    { minStage: 31, maxStage: 999, components: 15, cascadeSpeed: 700, parTime: 10, decoys: 3, branching: true, rootDepth: 0.6 }
];

const COMPONENT_TYPES = [
    { name: 'gear', label: 'Gear', unlockStage: 1 },
    { name: 'lever', label: 'Lever', unlockStage: 1 },
    { name: 'ramp', label: 'Ramp', unlockStage: 1 },
    { name: 'spring', label: 'Spring', unlockStage: 4 },
    { name: 'domino', label: 'Domino', unlockStage: 4 },
    { name: 'pendulum', label: 'Pendulum', unlockStage: 7 },
    { name: 'pulley', label: 'Pulley', unlockStage: 7 },
    { name: 'conveyor', label: 'Conveyor', unlockStage: 11 },
    { name: 'funnel', label: 'Funnel', unlockStage: 11 }
];

const FIX_BANKS = {
    gear: { correct: ['Tighten bolts', 'Replace teeth', 'Realign axle'], plausible: ['Oil surface', 'Spin faster', 'Add weight'], absurd: ['Kick it', 'Paint it', 'Ignore it'] },
    lever: { correct: ['Reset pivot', 'Adjust fulcrum', 'Clear jam'], plausible: ['Push harder', 'Shorten arm', 'Flip over'], absurd: ['Sit on it', 'Remove it', 'Yell at it'] },
    ramp: { correct: ['Re-angle slope', 'Smooth surface', 'Reinforce base'], plausible: ['Make steeper', 'Wax it', 'Flip it'], absurd: ['Eat it', 'Hide it', 'Lick it'] },
    spring: { correct: ['Replace spring', 'Adjust tension', 'Reattach hook'], plausible: ['Stretch it', 'Compress more', 'Heat it'], absurd: ['Freeze it', 'Sing to it', 'Tickle it'] },
    domino: { correct: ['Stand upright', 'Re-space tiles', 'Fix base'], plausible: ['Push it', 'Stack them', 'Glue down'], absurd: ['Throw it', 'Eat it', 'Dance on it'] },
    pendulum: { correct: ['Reset swing', 'Fix pivot point', 'Adjust weight'], plausible: ['Swing harder', 'Shorten arm', 'Add mass'], absurd: ['Hypnotize it', 'Spin it', 'Talk to it'] },
    pulley: { correct: ['Replace rope', 'Realign wheels', 'Grease axle'], plausible: ['Pull harder', 'Add rope', 'Tighten'], absurd: ['Cut rope', 'Tie a bow', 'Wish hard'] },
    conveyor: { correct: ['Fix belt', 'Align rollers', 'Clear debris'], plausible: ['Speed up', 'Reverse it', 'Oil belt'], absurd: ['Ride it', 'Fold it', 'Unplug it'] },
    funnel: { correct: ['Unclog opening', 'Widen base', 'Clear filter'], plausible: ['Pour water', 'Shake it', 'Flip it'], absurd: ['Plug it', 'Blow on it', 'Pray'] }
};

const JUICE = {
    TAP_PARTICLES: 8, TAP_SCALE: 1.25, TAP_FLASH_MS: 60,
    REPAIR_PARTICLES: 10, REPAIR_WAVE_SPEED: 200,
    SPARK_PARTICLES: 6, SPARK_LIFESPAN: 400,
    EXPLOSION_SHAKE: 12, EXPLOSION_DEBRIS: 15, EXPLOSION_MS: 400,
    WRONG_SHAKE_PLAUS: 6, WRONG_SHAKE_ABSURD: 10,
    SCORE_FLOAT_RISE: 60, SCORE_FLOAT_MS: 600,
    STAR_SCALE_MS: 200, STAR_STAGGER: 150
};

function makeSVG(type, failed) {
    const b = failed ? COLORS.FAIL_RED_HEX : COLORS.BRASS_HEX;
    const c = COLORS.COPPER_HEX, ir = COLORS.IRON_HEX;
    const crack = failed ? `<line x1="10" y1="10" x2="38" y2="38" stroke="${COLORS.BG_HEX}" stroke-width="2"/>` : '';
    const svgs = {
        gear: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="20" fill="${b}" stroke="${ir}" stroke-width="2"/><circle cx="24" cy="24" r="12" fill="${c}" stroke="${ir}" stroke-width="1.5"/><circle cx="24" cy="24" r="4" fill="${ir}"/>${[0,45,90,135,180,225,270,315].map(a=>`<rect x="22" y="2" width="4" height="7" fill="${b}" transform="rotate(${a},24,24)"/>`).join('')}${crack}</svg>`,
        lever: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="40"><polygon points="24,36 32,36 28,26" fill="${ir}"/><rect x="4" y="18" width="48" height="6" rx="2" fill="${b}" stroke="${ir}" stroke-width="1.5" transform="rotate(${failed?-15:-5},28,21)"/><circle cx="28" cy="21" r="3" fill="${c}" stroke="${ir}" stroke-width="1"/>${crack}</svg>`,
        ramp: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="32"><polygon points="0,30 60,8 60,16 0,38" fill="${b}" stroke="${ir}" stroke-width="1.5"/><circle cx="15" cy="28" r="1.5" fill="${c}"/><circle cx="30" cy="20" r="1.5" fill="${c}"/><circle cx="45" cy="14" r="1.5" fill="${c}"/>${crack}</svg>`,
        spring: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="40"><rect x="2" y="0" width="20" height="4" rx="1" fill="${ir}"/><polyline points="4,6 20,12 4,18 20,24 4,30 20,36" fill="none" stroke="${b}" stroke-width="3" stroke-linecap="round"/><rect x="2" y="36" width="20" height="4" rx="1" fill="${ir}"/>${crack}</svg>`,
        domino: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="32"><rect x="2" y="2" width="12" height="28" rx="2" fill="${b}" stroke="${ir}" stroke-width="1.5"/><circle cx="8" cy="10" r="2" fill="${ir}"/><circle cx="8" cy="22" r="2" fill="${ir}"/>${crack}</svg>`,
        pendulum: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48"><line x1="20" y1="4" x2="${failed?28:20}" y2="36" stroke="${ir}" stroke-width="2"/><circle cx="20" cy="4" r="3" fill="${c}"/><circle cx="${failed?28:20}" cy="36" r="10" fill="${b}" stroke="${ir}" stroke-width="1.5"/>${crack}</svg>`,
        pulley: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="40"><circle cx="10" cy="12" r="8" fill="${b}" stroke="${ir}" stroke-width="1.5"/><circle cx="38" cy="12" r="8" fill="${b}" stroke="${ir}" stroke-width="1.5"/><line x1="10" y1="20" x2="10" y2="38" stroke="${ir}" stroke-width="2"/><line x1="38" y1="20" x2="38" y2="38" stroke="${ir}" stroke-width="2"/><line x1="18" y1="12" x2="30" y2="12" stroke="${ir}" stroke-width="2" ${failed?'stroke-dasharray="4"':''}/>${crack}</svg>`,
        conveyor: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="24"><rect x="2" y="4" width="52" height="16" rx="8" fill="${ir}" stroke="${b}" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="${c}"/><circle cx="44" cy="12" r="5" fill="${c}"/><text x="28" y="16" text-anchor="middle" fill="${b}" font-size="10">${failed?'<<<':'>>>'}</text>${crack}</svg>`,
        funnel: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="40"><polygon points="2,4 34,4 24,36 12,36" fill="${b}" stroke="${ir}" stroke-width="1.5"/><rect x="14" y="36" width="8" height="4" fill="${ir}"/>${crack}</svg>`
    };
    return svgs[type] || svgs.gear;
}

const SVG_STRINGS = {
    wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M4,16 L10,10 L8,4 L12,4 L14,10 L16,8 L16,12 L10,14 Z" fill="${COLORS.BRASS_HEX}" stroke="${COLORS.IRON_HEX}" stroke-width="1"/></svg>`,
    wrenchEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M4,16 L10,10 L8,4 L12,4 L14,10 L16,8 L16,12 L10,14 Z" fill="${COLORS.IRON_HEX}" stroke="${COLORS.IRON_HEX}" stroke-width="1"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="${COLORS.GOLD_HEX}" stroke="${COLORS.COPPER_HEX}" stroke-width="1"/></svg>`,
    starEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="${COLORS.IRON_HEX}" stroke="${COLORS.IRON_HEX}" stroke-width="1"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect x="8" y="6" width="6" height="20" rx="1" fill="${COLORS.UI_TEXT_HEX}"/><rect x="18" y="6" width="6" height="20" rx="1" fill="${COLORS.UI_TEXT_HEX}"/></svg>`,
    connector: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="8"><rect x="0" y="1" width="40" height="6" rx="2" fill="${COLORS.IRON_HEX}"/><circle cx="4" cy="4" r="2" fill="${COLORS.COPPER_HEX}"/><circle cx="36" cy="4" r="2" fill="${COLORS.COPPER_HEX}"/></svg>`
};
