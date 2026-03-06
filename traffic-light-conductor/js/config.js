// config.js - Colors, SVG strings, difficulty tables, scoring constants

const CONFIG = {
    COLORS: {
        ROAD: '#2D2D2D',
        ROAD_LINE_WHITE: '#FFFFFF',
        ROAD_LINE_YELLOW: '#FFD700',
        SIDEWALK: '#B8B8B8',
        GRASS: '#4CAF50',
        LIGHT_GREEN: '#00E676',
        LIGHT_RED: '#FF1744',
        LIGHT_YELLOW: '#FFD600',
        SEDAN: '#42A5F5',
        TRUCK: '#FF9800',
        SPORTS: '#E91E63',
        AMBULANCE_WHITE: '#FFFFFF',
        AMBULANCE_RED: '#D32F2F',
        CRASH_ORANGE: '#FF6D00',
        DEBRIS_YELLOW: '#FFEB3B',
        UI_TEXT: '#FFFFFF',
        UI_BG: 'rgba(0,0,0,0.8)',
        COMBO_GOLD: '#FFD700',
        DANGER_RED: '#FF1744',
        HUD_BAR_BG: 'rgba(0,0,0,0.4)',
        BUTTON_GREEN: '#00E676',
        BUTTON_BLUE: '#42A5F5',
        BUTTON_ORANGE: '#FF9800',
        BUTTON_GRAY: '#78909C',
        SUBTITLE: '#B0BEC5',
        LIFE_EMPTY: '#555555',
        SMOKE_GRAY: '#9E9E9E'
    },

    SCORING: {
        SEDAN_POINTS: 10,
        TRUCK_POINTS: 15,
        SPORTS_POINTS: 20,
        AMBULANCE_POINTS: 50,
        NEAR_MISS_POINTS: 25,
        STAGE_CLEAR_MULT: 100,
        PERFECT_STAGE_MULT: 200,
        RUSH_HOUR_BONUS: 500,
        COMBO_STEP: 5,
        COMBO_MULT_INC: 0.5,
        COMBO_MAX_MULT: 5.0,
        getComboMultiplier: function(combo) {
            return Math.min(this.COMBO_MAX_MULT, 1 + Math.floor(combo / this.COMBO_STEP) * this.COMBO_MULT_INC);
        }
    },

    TIMING: {
        INACTIVITY_DEATH_MS: 8000,
        MALFUNCTION_WARNING_MS: 6000,
        LIGHT_TRANSITION_MS: 200,
        EMERGENCY_COOLDOWN_MS: 3000,
        CRASH_FREEZE_MS: 60,
        CRASH_SEQUENCE_MS: 800,
        STAGE_ANNOUNCE_MS: 1500,
        REST_BEAT_MS: 3000,
        TAP_DEBOUNCE_MS: 100,
        COMBO_RESET_DELAY_MS: 2000
    },

    VEHICLES: {
        sedan:     { key: 'car_sedan',     w: 24, h: 40, speedMult: 1.0, points: 10 },
        truck:     { key: 'car_truck',     w: 28, h: 48, speedMult: 0.6, points: 15 },
        sports:    { key: 'car_sports',    w: 22, h: 36, speedMult: 1.8, points: 20 },
        ambulance: { key: 'car_ambulance', w: 26, h: 44, speedMult: 1.0, points: 50, ignoresRed: true }
    },

    LAYOUT: {
        ROAD_WIDTH: 60,
        INTERSECTION_SIZE: 120,
        LIGHT_BTN_SIZE: 56,
        STOP_LINE_OFFSET: 70,
        HUD_HEIGHT: 40,
        NEAR_MISS_PX: 20,
        COLLISION_SHRINK: 8
    },

    DEBRIS_ITEMS: ['debris_duck', 'debris_pizza', 'debris_toilet', 'debris_banana', 'debris_coffee'],

    STORAGE_KEYS: {
        HIGH_SCORE: 'traffic_light_conductor_high_score',
        GAMES_PLAYED: 'traffic_light_conductor_games_played',
        HIGHEST_STAGE: 'traffic_light_conductor_highest_stage',
        BEST_COMBO: 'traffic_light_conductor_best_combo',
        SETTINGS: 'traffic_light_conductor_settings'
    }
};

const SVG_STRINGS = {
    car_sedan: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40"><rect x="2" y="4" width="20" height="32" rx="6" fill="#42A5F5" stroke="#1565C0" stroke-width="2"/><rect x="5" y="6" width="14" height="8" rx="2" fill="#90CAF9"/><rect x="5" y="26" width="14" height="6" rx="2" fill="#90CAF9"/><circle cx="6" cy="4" r="2" fill="#FFD600"/><circle cx="18" cy="4" r="2" fill="#FFD600"/><circle cx="6" cy="36" r="2" fill="#FF1744"/><circle cx="18" cy="36" r="2" fill="#FF1744"/></svg>',

    car_truck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 48"><rect x="2" y="2" width="24" height="44" rx="4" fill="#FF9800" stroke="#E65100" stroke-width="2"/><rect x="4" y="4" width="20" height="10" rx="2" fill="#FFE0B2"/><rect x="4" y="18" width="20" height="26" rx="1" fill="#F57C00"/><circle cx="6" cy="2" r="2.5" fill="#FFD600"/><circle cx="22" cy="2" r="2.5" fill="#FFD600"/><circle cx="8" cy="46" r="3" fill="#333"/><circle cx="20" cy="46" r="3" fill="#333"/></svg>',

    car_sports: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 36"><rect x="2" y="2" width="18" height="32" rx="8" fill="#E91E63" stroke="#880E4F" stroke-width="2"/><rect x="5" y="5" width="12" height="7" rx="3" fill="#F48FB1"/><rect x="5" y="24" width="12" height="5" rx="2" fill="#F48FB1"/><line x1="4" y1="16" x2="18" y2="16" stroke="#880E4F" stroke-width="1"/><circle cx="5" cy="2" r="1.5" fill="#FFD600"/><circle cx="17" cy="2" r="1.5" fill="#FFD600"/></svg>',

    car_ambulance: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 44"><rect x="2" y="2" width="22" height="40" rx="5" fill="#FFFFFF" stroke="#D32F2F" stroke-width="2"/><rect x="8" y="16" width="10" height="3" fill="#D32F2F"/><rect x="11" y="13" width="4" height="9" fill="#D32F2F"/><rect x="4" y="4" width="18" height="8" rx="2" fill="#BBDEFB"/><circle cx="6" cy="6" r="2" fill="#2196F3"/><circle cx="20" cy="6" r="2" fill="#FF1744"/></svg>',

    light_red: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect x="5" y="5" width="50" height="50" rx="10" fill="#333333" stroke="#555555" stroke-width="3"/><circle cx="30" cy="20" r="10" fill="#FF1744"/><circle cx="30" cy="42" r="10" fill="#003300"/></svg>',

    light_green: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect x="5" y="5" width="50" height="50" rx="10" fill="#333333" stroke="#555555" stroke-width="3"/><circle cx="30" cy="20" r="10" fill="#4A0000"/><circle cx="30" cy="42" r="10" fill="#00E676"/></svg>',

    light_yellow: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect x="5" y="5" width="50" height="50" rx="10" fill="#333333" stroke="#555555" stroke-width="3"/><circle cx="30" cy="20" r="10" fill="#FFD600"/><circle cx="30" cy="42" r="10" fill="#FFD600"/></svg>',

    debris_duck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><ellipse cx="8" cy="10" rx="6" ry="5" fill="#FFD600"/><circle cx="8" cy="5" r="4" fill="#FFD600"/><circle cx="6" cy="4" r="1" fill="#333"/><polygon points="10,5 14,4 10,6" fill="#FF9800"/></svg>',

    debris_pizza: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><polygon points="8,1 1,15 15,15" fill="#FFD54F" stroke="#F57F17" stroke-width="1"/><circle cx="6" cy="10" r="1.5" fill="#D32F2F"/><circle cx="10" cy="11" r="1.5" fill="#D32F2F"/><circle cx="8" cy="7" r="1.5" fill="#D32F2F"/></svg>',

    debris_toilet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="6" ry="5" fill="none" stroke="#ECEFF1" stroke-width="3"/><rect x="5" y="2" width="6" height="4" rx="1" fill="#ECEFF1"/></svg>',

    debris_banana: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4,14 Q2,8 6,4 Q8,2 10,4 Q14,8 12,14 Z" fill="#FFD600" stroke="#F9A825" stroke-width="1"/><path d="M6,12 Q5,8 7,5" fill="none" stroke="#FFF9C4" stroke-width="1"/></svg>',

    debris_coffee: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="10" rx="1" fill="#795548"/><rect x="5" y="2" width="6" height="3" rx="1" fill="#8D6E63"/><ellipse cx="8" cy="4" rx="4" ry="1.5" fill="#4E342E"/><path d="M12,7 Q15,7 14,10 Q13,12 12,11" fill="none" stroke="#795548" stroke-width="1.5"/></svg>',

    life_full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="14" rx="4" fill="#42A5F5" stroke="#1565C0" stroke-width="1.5"/><rect x="5" y="5" width="10" height="4" rx="1" fill="#90CAF9"/></svg>',

    life_empty: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="14" rx="4" fill="#555555" stroke="#444444" stroke-width="1.5"/><rect x="5" y="5" width="10" height="4" rx="1" fill="#666666"/></svg>'
};
