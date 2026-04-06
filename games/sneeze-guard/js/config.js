// Sneeze Guard - Configuration
const CONFIG = {
    GAME_WIDTH: 460,
    GAME_HEIGHT: 700,
    MAX_HYGIENE: 5,
    GUARD_RAISE_DURATION: 80,
    GUARD_LOWER_DURATION: 120,
    GUARD_UP_TIME: 400,
    TAP_DEBOUNCE: 100,
    HITSTOP_MS: 80,
    INACTIVITY_TIMEOUT: 25000,

    COLOR: {
        PRIMARY: '#4A90D9',
        BG: '#F5F0E8',
        SKIN: '#E8C99A',
        SNOT: '#7FD43A',
        SNOT_DARK: '#5AAF1E',
        FOOD_WARM: '#F0A830',
        FOOD_COOL: '#D45A5A',
        HEART_FULL: '#FF5C5C',
        HEART_EMPTY: '#CCCCCC',
        TEXT: '#2C2C2C',
        UI_BG: '#FEFCF7',
        GOLD: '#FFD700',
        GUARD_GLASS: '#4A90D9'
    },

    SCORE: {
        PERFECT: 500,
        GOOD: 200,
        FAKE_SURVIVED: 150,
        STAGE_CLEAR_BASE: 100,
        STREAK_DOUBLE: 3,
        STREAK_TRIPLE: 5
    },

    getDifficultyParams: function(stage) {
        const isRest = stage % 10 === 0 && stage > 0;
        let tapWindow = Math.max(200, 600 - stage * 8);
        let fakeChance = stage >= 8 ? Math.min(0.50, 0.20 + (stage - 8) * 0.015) : 0;
        let multiChance = stage >= 12 ? Math.min(0.35, (stage - 12) * 0.05) : 0;
        let approachSpeed = Math.max(1200, 3000 - stage * 40);
        let windupDuration = Math.max(800, 2000 - stage * 20);
        let eventCount = Math.min(12, 4 + Math.floor(stage / 3));

        if (isRest) {
            tapWindow += 100;
            fakeChance *= 0.5;
        }

        return {
            tapWindow, fakeChance, multiChance,
            approachSpeed, windupDuration, eventCount, isRest
        };
    }
};

// SVG Assets - all include explicit width/height
const SVG = {
    PATRON_NEUTRAL: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="72" viewBox="0 0 48 72">
  <rect x="10" y="30" width="28" height="38" rx="8" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <circle cx="24" cy="22" r="16" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <circle cx="18" cy="20" r="3" fill="#2C2C2C"/>
  <circle cx="30" cy="20" r="3" fill="#2C2C2C"/>
  <ellipse cx="24" cy="26" rx="4" ry="3" fill="#D4A882" stroke="#2C2C2C" stroke-width="1.5"/>
</svg>`,

    PATRON_WINDUP1: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="72" viewBox="0 0 48 72">
  <rect x="10" y="30" width="28" height="38" rx="8" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <circle cx="24" cy="22" r="16" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <ellipse cx="18" cy="20" rx="3" ry="2" fill="#2C2C2C"/>
  <ellipse cx="30" cy="20" rx="3" ry="2" fill="#2C2C2C"/>
  <ellipse cx="24" cy="26" rx="5" ry="4" fill="#D46060" stroke="#2C2C2C" stroke-width="1.5"/>
  <circle cx="22" cy="25" r="1.5" fill="#FF4444" opacity="0.8"/>
  <circle cx="26" cy="25" r="1.5" fill="#FF4444" opacity="0.8"/>
</svg>`,

    PATRON_WINDUP2: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="72" viewBox="0 0 48 72">
  <rect x="8" y="32" width="32" height="36" rx="8" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <circle cx="24" cy="19" r="16" fill="#E8C99A" stroke="#2C2C2C" stroke-width="2"/>
  <line x1="15" y1="18" x2="21" y2="18" stroke="#2C2C2C" stroke-width="2" stroke-linecap="round"/>
  <line x1="27" y1="18" x2="33" y2="18" stroke="#2C2C2C" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="24" cy="24" rx="6" ry="5" fill="#FF3030" stroke="#2C2C2C" stroke-width="1.5"/>
  <line x1="14" y1="38" x2="20" y2="36" stroke="#2C2C2C" stroke-width="1.5" opacity="0.4"/>
  <line x1="34" y1="38" x2="28" y2="36" stroke="#2C2C2C" stroke-width="1.5" opacity="0.4"/>
</svg>`,

    GUARD: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="60" viewBox="0 0 320 60">
  <rect x="0" y="0" width="320" height="60" rx="4" fill="#4A90D9" fill-opacity="0.25" stroke="#4A90D9" stroke-width="3"/>
  <rect x="0" y="0" width="320" height="8" rx="4" fill="#8AAAC8" stroke="#4A90D9" stroke-width="1"/>
  <rect x="0" y="52" width="320" height="8" rx="4" fill="#8AAAC8" stroke="#4A90D9" stroke-width="1"/>
  <line x1="20" y1="10" x2="40" y2="50" stroke="white" stroke-width="3" stroke-opacity="0.15"/>
  <line x1="40" y1="10" x2="55" y2="50" stroke="white" stroke-width="2" stroke-opacity="0.10"/>
</svg>`,

    TRAY: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30" viewBox="0 0 80 30">
  <rect x="0" y="10" width="80" height="20" rx="4" fill="#C8B89A" stroke="#8A7A6A" stroke-width="1.5"/>
  <ellipse cx="40" cy="12" rx="30" ry="10" fill="#F0A830"/>
  <ellipse cx="34" cy="9" rx="10" ry="4" fill="#F8C060" opacity="0.5"/>
</svg>`,

    TRAY_RED: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30" viewBox="0 0 80 30">
  <rect x="0" y="10" width="80" height="20" rx="4" fill="#C8B89A" stroke="#8A7A6A" stroke-width="1.5"/>
  <ellipse cx="40" cy="12" rx="30" ry="10" fill="#D45A5A"/>
  <ellipse cx="34" cy="9" rx="10" ry="4" fill="#E87070" opacity="0.5"/>
</svg>`,

    SNOT_SPLAT: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="18" fill="#5AAF1E" opacity="0.9"/>
  <ellipse cx="40" cy="60" rx="5" ry="12" fill="#5AAF1E" opacity="0.7"/>
  <ellipse cx="20" cy="30" rx="7" ry="4" fill="#7FD43A" opacity="0.8" transform="rotate(-30 20 30)"/>
  <ellipse cx="60" cy="28" rx="6" ry="4" fill="#7FD43A" opacity="0.8" transform="rotate(20 60 28)"/>
  <ellipse cx="15" cy="52" rx="5" ry="3" fill="#7FD43A" opacity="0.7" transform="rotate(45 15 52)"/>
  <ellipse cx="65" cy="55" rx="5" ry="3" fill="#7FD43A" opacity="0.7" transform="rotate(-45 65 55)"/>
</svg>`,

    EXCLAMATION: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="40" viewBox="0 0 24 40">
  <rect x="8" y="2" width="8" height="24" rx="4" fill="#FF3030"/>
  <circle cx="12" cy="34" r="4" fill="#FF3030"/>
</svg>`,

    HEART: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="FILL_COLOR"/>
</svg>`,

    PARTICLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7" fill="#7FD43A"/>
</svg>`
};
