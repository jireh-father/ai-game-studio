// config.js - Constants, colors, difficulty tables, SVG strings

var COLORS = {
    CHAR_A: '#4FC3F7',
    CHAR_B: '#FFB74D',
    THREAD_NORMAL: '#E0E0E0',
    THREAD_COMBO5: '#00E5FF',
    THREAD_COMBO20: '#FFD740',
    BG_TOP: '#0D1B2A',
    BG_BOTTOM: '#1B3A4B',
    PLATFORM: '#546E7A',
    PLATFORM_HIGHLIGHT: '#78909C',
    OBSTACLE_NORMAL: '#EF5350',
    OBSTACLE_FAST: '#FF1744',
    DANGER_FLASH: '#F44336',
    REWARD: '#76FF03',
    UI_TEXT: '#FFFFFF',
    UI_OVERLAY: '#000000',
    HEART_FULL: '#FF5252',
    HEART_EMPTY: '#424242',
    GOLD: '#FFD740',
    SUBTITLE: '#B0BEC5'
};

var COLORS_HEX = {
    CHAR_A: 0x4FC3F7, CHAR_B: 0xFFB74D, THREAD_NORMAL: 0xE0E0E0,
    THREAD_COMBO5: 0x00E5FF, THREAD_COMBO20: 0xFFD740, BG_TOP: 0x0D1B2A,
    BG_BOTTOM: 0x1B3A4B, PLATFORM: 0x546E7A, OBSTACLE_NORMAL: 0xEF5350,
    DANGER_FLASH: 0xF44336, REWARD: 0x76FF03, GOLD: 0xFFD740, WHITE: 0xFFFFFF
};

var GAME = {
    WIDTH: 390, HEIGHT: 740,
    CHAR_A_X: 100, CHAR_B_X: 290, CHAR_Y: 480,
    PLATFORM_A_X: 100, PLATFORM_B_X: 290, PLATFORM_Y: 504,
    LIVES_Y: 710
};

var JUMP = { HEIGHT: 60, DURATION: 400, MIN_ASYMMETRIC: 45, COOLDOWN: 100 };

var SCORING = {
    DODGE_NORMAL: 10, DODGE_PERFECT: 25, COMBO_BONUS: 5,
    STAGE_CLEAR_BASE: 50, STAGE_CLEAR_PER_STAGE: 10,
    SURVIVAL_PER_SEC: 1, NEAR_MISS: 5,
    PERFECT_WINDOW_MS: 80, NEAR_MISS_PX: 8
};

var TIMING = {
    INACTIVITY_TIMEOUT: 15000, INVINCIBILITY_DURATION: 800,
    LIVES_START: 3, LIVES_MAX: 5, TAP_COOLDOWN: 100,
    DEATH_TO_GAMEOVER: 800, STAGE_ANNOUNCE_DURATION: 1200,
    COMBO_FADE_DELAY: 1500
};

var OBSTACLE_POOL_SIZE = 20;

var SVG_STRINGS = {
    charA: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><rect x="4" y="12" width="32" height="28" rx="10" fill="#4FC3F7"/><circle cx="20" cy="10" r="10" fill="#4FC3F7"/><circle cx="15" cy="9" r="2.5" fill="#0D1B2A"/><circle cx="25" cy="9" r="2.5" fill="#0D1B2A"/><rect x="8" y="40" width="10" height="8" rx="4" fill="#4FC3F7"/><rect x="22" y="40" width="10" height="8" rx="4" fill="#4FC3F7"/></svg>',
    charB: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><rect x="4" y="12" width="32" height="28" rx="10" fill="#FFB74D"/><circle cx="20" cy="10" r="10" fill="#FFB74D"/><circle cx="15" cy="9" r="2.5" fill="#0D1B2A"/><circle cx="25" cy="9" r="2.5" fill="#0D1B2A"/><rect x="8" y="40" width="10" height="8" rx="4" fill="#FFB74D"/><rect x="22" y="40" width="10" height="8" rx="4" fill="#FFB74D"/></svg>',
    obstacle: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><polygon points="16,0 32,40 0,40" fill="#EF5350"/><polygon points="16,10 26,36 6,36" fill="#FF8A80" opacity="0.4"/></svg>',
    fastObstacle: '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 26 32"><polygon points="13,0 26,32 0,32" fill="#FF1744"/><line x1="4" y1="12" x2="0" y2="14" stroke="#FF1744" stroke-width="2" opacity="0.6"/><line x1="4" y1="18" x2="0" y2="20" stroke="#FF1744" stroke-width="2" opacity="0.6"/></svg>',
    platform: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="16" viewBox="0 0 120 16"><rect x="0" y="0" width="120" height="16" rx="6" fill="#546E7A"/><rect x="4" y="2" width="112" height="4" rx="2" fill="#78909C" opacity="0.5"/></svg>',
    heartFull: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22"><path d="M12 21 C12 21 1 13 1 6.5 C1 3 4 0 7.5 0 C9.5 0 11 1.5 12 3 C13 1.5 14.5 0 16.5 0 C20 0 23 3 23 6.5 C23 13 12 21 12 21Z" fill="#FF5252"/></svg>',
    heartEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22"><path d="M12 21 C12 21 1 13 1 6.5 C1 3 4 0 7.5 0 C9.5 0 11 1.5 12 3 C13 1.5 14.5 0 16.5 0 C20 0 23 3 23 6.5 C23 13 12 21 12 21Z" fill="#424242"/></svg>',
    pauseIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="2" width="6" height="20" rx="2" fill="#FFFFFF"/><rect x="14" y="2" width="6" height="20" rx="2" fill="#FFFFFF"/></svg>'
};

// Juice helper - shared effects utility
var JuiceEffects = {
    burstParticles: function(scene, x, y, color, count) {
        for (var i = 0; i < count; i++) {
            var p = scene.add.circle(x, y, 3, color).setDepth(55);
            var angle = Math.random() * Math.PI * 2;
            var vel = 40 + Math.random() * 80;
            scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * vel, y: y + Math.sin(angle) * vel,
                alpha: 0, scaleX: 0.2, scaleY: 0.2,
                duration: 300 + Math.random() * 100,
                onComplete: function() { p.destroy(); }
            });
        }
    },
    floatingText: function(scene, x, y, text, color, size, rise, dur) {
        var ft = scene.add.text(x, y, text, {
            fontSize: (size || 18) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: color || COLORS.REWARD
        }).setOrigin(0.5).setDepth(70);
        scene.tweens.add({
            targets: ft, y: ft.y - (rise || 60), alpha: 0, duration: dur || 600,
            onComplete: function() { ft.destroy(); }
        });
    },
    scalePunch: function(scene, target, scale, dur) {
        scene.tweens.add({ targets: target, scaleX: scale, scaleY: scale, duration: dur || 80, yoyo: true, ease: 'Quad.easeOut' });
    }
};
