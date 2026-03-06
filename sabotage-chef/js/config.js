// config.js - Constants, colors, scoring, difficulty, SVG strings

const COLORS = {
    STATION: '#B0C4DE',
    BELT: '#3A3A3A',
    NORMAL_HIGHLIGHT: '#FFD93D',
    SABOTAGE_TINT: '#7FFF00',
    JUDGE_BODY: '#1B3A5C',
    VISION_CONE: '#FF4444',
    BACKGROUND: '#FFF8E7',
    HUD_TEXT: '#2C2C2C',
    DANGER: '#FF2D2D',
    SUCCESS: '#00E676',
    COMBO_GOLD: '#FFD700',
    LIFE_ICON: '#FFFFFF',
    SLOT_EMPTY: '#E0E0E0',
    SLOT_FILLED: '#C8E6C9',
    FIRE1: '#FF4500',
    FIRE2: '#FF6347',
    PAUSE_BG: '#000000',
    BUTTON_QUIT: '#888888'
};

const SCORING = {
    NORMAL_PLACE: 10,
    SABOTAGE_PLACE: 50,
    DISH_0_SAB: 20,
    DISH_1_SAB: 80,
    DISH_2_SAB: 160,
    DISH_3_SAB: 300,
    DISH_4_SAB: 500,
    DISH_MULTIPLIERS: [1, 1.5, 2, 3, 5],
    CLOSE_CALL_BONUS: 25,
    CLOSE_CALL_DIST: 30,
    BOSS_BONUS: 500,
    COMBO_MULTIPLIERS: [1.0, 1.5, 2.0, 2.5, 3.0]
};

const DIMENSIONS = {
    WIDTH: 360,
    HEIGHT: 640,
    SLOT_SIZE: 70,
    SLOT_GAP: 16,
    INGREDIENT_SIZE: 50,
    JUDGE_W: 40,
    JUDGE_H: 60,
    HUD_H: 50,
    STATION_Y: 60,
    STATION_H: 170,
    JUDGE_Y: 250,
    JUDGE_ZONE_H: 120,
    BELT_Y: 390,
    BELT_H: 130,
    TIMER_Y: 520,
    TIMER_H: 16,
    SLOT_GRID_X: 100,
    SLOT_GRID_Y: 90,
    SNAP_DIST: 45
};

const DIFFICULTY = {
    BASE_JUDGE_SPEED: 60,
    JUDGE_SPEED_PER_STAGE: 8,
    MAX_JUDGE_SPEED: 180,
    BASE_CONE_W: 100,
    CONE_W_PER_STAGE: 4,
    MAX_CONE_W: 200,
    BASE_CONE_L: 120,
    CONE_L_PER_STAGE: 3,
    MAX_CONE_L: 200,
    BASE_BELT_SPEED: 40,
    BELT_SPEED_PER_STAGE: 3,
    MAX_BELT_SPEED: 100,
    BASE_SAB_RATIO: 0.50,
    SAB_RATIO_PER_STAGE: 0.025,
    MIN_SAB_RATIO: 0.20,
    BASE_SPACING: 100,
    SPACING_PER_STAGE: 2,
    MIN_SPACING: 70,
    BASE_TIMER: 8.0,
    TIMER_PER_STAGE: 0.1,
    MIN_TIMER: 5.0,
    IRREGULARITY_PER_STAGE: 0.05,
    MAX_IRREGULARITY: 1.0,
    GLANCE_START_STAGE: 13,
    GLANCE_PER_STAGE: 0.05,
    MAX_GLANCE: 0.4
};

const JUDGE_PATROL = {
    MIN_X: 30,
    MAX_X: 330,
    PAUSE_MIN: 200,
    PAUSE_MAX: 600,
    MID_PAUSE_MIN: 300,
    MID_PAUSE_MAX: 800
};

const INGREDIENT_NAMES = {
    NORMAL: ['egg', 'milk', 'flour', 'butter', 'tomato', 'onion'],
    SABOTAGE: ['rubber_duck', 'soap', 'glitter', 'hot_sauce', 'sponge', 'sock']
};

const SVG_STRINGS = {};

SVG_STRINGS.judge = '<svg width="40" height="60" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="8" y="20" width="24" height="35" rx="4" fill="#1B3A5C"/>'
    + '<circle cx="20" cy="14" r="12" fill="#FFDAB9"/>'
    + '<rect x="10" y="0" width="20" height="10" rx="3" fill="#FFFFFF"/>'
    + '<rect x="8" y="8" width="24" height="5" rx="1" fill="#FFFFFF"/>'
    + '<circle cx="16" cy="13" r="2" fill="#2C2C2C"/>'
    + '<circle cx="24" cy="13" r="2" fill="#2C2C2C"/>'
    + '<line x1="13" y1="9" x2="19" y2="11" stroke="#2C2C2C" stroke-width="2"/>'
    + '<line x1="21" y1="11" x2="27" y2="9" stroke="#2C2C2C" stroke-width="2"/>'
    + '<rect x="12" y="55" width="6" height="5" rx="1" fill="#1B3A5C"/>'
    + '<rect x="22" y="55" width="6" height="5" rx="1" fill="#1B3A5C"/>'
    + '</svg>';

SVG_STRINGS.normal_egg = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="25" cy="28" rx="16" ry="20" fill="#FFF5E1" stroke="#FFD93D" stroke-width="2"/>'
    + '<ellipse cx="25" cy="25" rx="10" ry="8" fill="#FFD93D" opacity="0.3"/>'
    + '</svg>';

SVG_STRINGS.normal_milk = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="14" y="12" width="22" height="32" rx="3" fill="#FFFFFF" stroke="#FFD93D" stroke-width="2"/>'
    + '<rect x="18" y="6" width="14" height="8" rx="2" fill="#EEEEEE" stroke="#FFD93D" stroke-width="1"/>'
    + '<rect x="18" y="24" width="14" height="8" rx="1" fill="#87CEEB" opacity="0.4"/>'
    + '</svg>';

SVG_STRINGS.normal_flour = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="10" y="14" width="30" height="28" rx="4" fill="#F5F0E0" stroke="#FFD93D" stroke-width="2"/>'
    + '<rect x="16" y="20" width="18" height="10" rx="2" fill="#FFD93D" opacity="0.3"/>'
    + '<ellipse cx="25" cy="12" rx="10" ry="4" fill="#F5F0E0" stroke="#FFD93D" stroke-width="1"/>'
    + '</svg>';

SVG_STRINGS.normal_butter = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="10" y="18" width="30" height="20" rx="3" fill="#FFF176" stroke="#FFD93D" stroke-width="2"/>'
    + '<rect x="14" y="22" width="22" height="6" rx="1" fill="#FFD93D" opacity="0.4"/>'
    + '</svg>';

SVG_STRINGS.normal_tomato = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="25" cy="28" r="16" fill="#FF6347" stroke="#FFD93D" stroke-width="2"/>'
    + '<path d="M20 14 Q25 8 30 14" stroke="#4CAF50" stroke-width="2" fill="none"/>'
    + '<line x1="25" y1="10" x2="25" y2="16" stroke="#4CAF50" stroke-width="2"/>'
    + '</svg>';

SVG_STRINGS.normal_onion = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="25" cy="30" rx="15" ry="16" fill="#DEB887" stroke="#FFD93D" stroke-width="2"/>'
    + '<path d="M20 16 Q25 6 30 16" stroke="#8B7355" stroke-width="2" fill="none"/>'
    + '</svg>';

SVG_STRINGS.sab_duck = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="25" cy="32" rx="16" ry="14" fill="#FFE44D" stroke="#7FFF00" stroke-width="2"/>'
    + '<circle cx="20" cy="22" r="8" fill="#FFE44D"/>'
    + '<ellipse cx="14" cy="24" rx="5" ry="3" fill="#FF8C00"/>'
    + '<circle cx="22" cy="20" r="2" fill="#2C2C2C"/>'
    + '<circle cx="40" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="37" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.sab_soap = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="10" y="16" width="30" height="24" rx="6" fill="#E0F7FA" stroke="#7FFF00" stroke-width="2"/>'
    + '<ellipse cx="22" cy="12" rx="5" ry="4" fill="#B2EBF2" opacity="0.6"/>'
    + '<ellipse cx="32" cy="10" rx="4" ry="3" fill="#B2EBF2" opacity="0.5"/>'
    + '<circle cx="40" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="37" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.sab_glitter = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="12" y="14" width="26" height="28" rx="3" fill="#E8D5F5" stroke="#7FFF00" stroke-width="2"/>'
    + '<circle cx="20" cy="24" r="2" fill="#FFD700"/><circle cx="30" cy="20" r="2" fill="#FF69B4"/>'
    + '<circle cx="25" cy="32" r="2" fill="#00BCD4"/><circle cx="18" cy="34" r="1.5" fill="#FFD700"/>'
    + '<circle cx="40" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="37" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.sab_hotsauce = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="16" y="16" width="18" height="28" rx="3" fill="#FF4500" stroke="#7FFF00" stroke-width="2"/>'
    + '<rect x="20" y="10" width="10" height="8" rx="2" fill="#CC3700"/>'
    + '<rect x="20" y="24" width="10" height="6" rx="1" fill="#FFFFFF" opacity="0.5"/>'
    + '<circle cx="40" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="37" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.sab_sponge = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="10" y="16" width="30" height="22" rx="4" fill="#FFEB3B" stroke="#7FFF00" stroke-width="2"/>'
    + '<circle cx="18" cy="24" r="2" fill="#FBC02D"/><circle cx="25" cy="28" r="2" fill="#FBC02D"/>'
    + '<circle cx="32" cy="22" r="2" fill="#FBC02D"/><circle cx="20" cy="32" r="1.5" fill="#FBC02D"/>'
    + '<circle cx="40" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="37" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.sab_sock = '<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M18 10 L18 32 Q18 42 28 42 L34 42 Q40 42 40 34 L40 30 L28 30 L28 10 Z" fill="#9E9E9E" stroke="#7FFF00" stroke-width="2"/>'
    + '<rect x="18" y="10" width="10" height="6" rx="1" fill="#BDBDBD"/>'
    + '<circle cx="42" cy="8" r="6" fill="#7FFF00" opacity="0.7"/>'
    + '<text x="39" y="11" font-size="8" fill="#2C2C2C" font-family="Arial">x</text>'
    + '</svg>';

SVG_STRINGS.slot_empty = '<svg width="70" height="70" viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="2" y="2" width="66" height="66" rx="8" fill="#E0E0E0" stroke="#B0C4DE" stroke-width="3" stroke-dasharray="8,4"/>'
    + '<text x="35" y="44" text-anchor="middle" font-size="24" fill="#B0C4DE" font-family="Arial">?</text>'
    + '</svg>';

SVG_STRINGS.chef_hat = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="3" y="8" width="14" height="10" rx="2" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="1"/>'
    + '<ellipse cx="10" cy="7" rx="7" ry="5" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="1"/>'
    + '</svg>';

SVG_STRINGS.chef_hat_empty = '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">'
    + '<rect x="3" y="8" width="14" height="10" rx="2" fill="#666666" stroke="#555555" stroke-width="1"/>'
    + '<ellipse cx="10" cy="7" rx="7" ry="5" fill="#666666" stroke="#555555" stroke-width="1"/>'
    + '</svg>';

const INGREDIENT_TYPES = [
    { name: 'egg', svgKey: 'normal_egg', isSabotage: false },
    { name: 'milk', svgKey: 'normal_milk', isSabotage: false },
    { name: 'flour', svgKey: 'normal_flour', isSabotage: false },
    { name: 'butter', svgKey: 'normal_butter', isSabotage: false },
    { name: 'tomato', svgKey: 'normal_tomato', isSabotage: false },
    { name: 'onion', svgKey: 'normal_onion', isSabotage: false },
    { name: 'rubber_duck', svgKey: 'sab_duck', isSabotage: true },
    { name: 'soap', svgKey: 'sab_soap', isSabotage: true },
    { name: 'glitter', svgKey: 'sab_glitter', isSabotage: true },
    { name: 'hot_sauce', svgKey: 'sab_hotsauce', isSabotage: true },
    { name: 'sponge', svgKey: 'sab_sponge', isSabotage: true },
    { name: 'sock', svgKey: 'sab_sock', isSabotage: true }
];
