// config.js - Flag Me If You Can
window.CONFIG = {
  GAME_WIDTH: 400,
  GAME_HEIGHT: 700,
  COLORS: {
    MINE: 0xFF2222,
    MINE_HEX: '#FF2222',
    AI_SWEEP: 0x4488FF,
    AI_SWEEP_HEX: '#4488FF',
    BG: 0x1A1A2E,
    BG_HEX: '#1A1A2E',
    CELL_UNREVEALED: 0xC0C0C0,
    CELL_REVEALED: 0xE8E8E8,
    CELL_HOVER: 0xFFFFFF,
    BORDER: 0x888888,
    NUM1: '#0000FF',
    NUM2: '#007B00',
    NUM3: '#FF0000',
    NUM4: '#000084',
    CORRUPTED: '#FF6600',
    CORRUPT_UI: '#00FF88',
    DANGER: '#FF4444',
    DECOY: '#FFDD00',
    UI_TEXT: '#F0F0F0',
    UI_BG: '#0D0D1F',
    WALL: 0x444466,
    FLAG_WRONG: '#FF8800',
    FLAG_RIGHT: '#DD0000'
  },
  SCORE: {
    HOP: 10,
    CORRUPTION: 50,
    WRONG_FLAG: 200,
    DECOY: 100,
    STAGE_CLEAR: 500
  },
  AI_INTERVAL_BASE: 2000,
  AI_INTERVAL_MIN: 600,
  DECOY_COOLDOWN_BASE: 8000,
  DECOY_PAUSE_MS: 3000,
  IDLE_DEATH_MS: 30000,
  LIVES: 3,
  SVG: {
    MINE: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
<circle cx="24" cy="24" r="22" fill="none" stroke="#FF2222" stroke-width="2" opacity="0.4"/>
<circle cx="24" cy="24" r="14" fill="#FF2222"/>
<circle cx="19" cy="19" r="4" fill="#FF8888" opacity="0.7"/>
<line x1="24" y1="2" x2="24" y2="8" stroke="#FF2222" stroke-width="3" stroke-linecap="round"/>
<line x1="24" y1="40" x2="24" y2="46" stroke="#FF2222" stroke-width="3" stroke-linecap="round"/>
<line x1="2" y1="24" x2="8" y2="24" stroke="#FF2222" stroke-width="3" stroke-linecap="round"/>
<line x1="40" y1="24" x2="46" y2="24" stroke="#FF2222" stroke-width="3" stroke-linecap="round"/>
<line x1="7" y1="7" x2="12" y2="12" stroke="#FF2222" stroke-width="2" stroke-linecap="round"/>
<line x1="36" y1="36" x2="41" y2="41" stroke="#FF2222" stroke-width="2" stroke-linecap="round"/>
<line x1="41" y1="7" x2="36" y2="12" stroke="#FF2222" stroke-width="2" stroke-linecap="round"/>
<line x1="12" y1="36" x2="7" y2="41" stroke="#FF2222" stroke-width="2" stroke-linecap="round"/>
</svg>`,
    EXPLOSION: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<circle cx="48" cy="48" r="40" fill="#FFAA00" opacity="0.85"/>
<circle cx="48" cy="48" r="44" fill="none" stroke="#FF6600" stroke-width="4" opacity="0.7"/>
<line x1="48" y1="4" x2="48" y2="16" stroke="#FFDD00" stroke-width="4" stroke-linecap="round"/>
<line x1="48" y1="80" x2="48" y2="92" stroke="#FFDD00" stroke-width="4" stroke-linecap="round"/>
<line x1="4" y1="48" x2="16" y2="48" stroke="#FFDD00" stroke-width="4" stroke-linecap="round"/>
<line x1="80" y1="48" x2="92" y2="48" stroke="#FFDD00" stroke-width="4" stroke-linecap="round"/>
</svg>`,
    FLAG_WRONG: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<line x1="6" y1="4" x2="6" y2="20" stroke="#888888" stroke-width="2"/>
<polygon points="6,4 18,8 6,12" fill="#FF8800"/>
<line x1="2" y1="20" x2="10" y2="12" stroke="#FF0000" stroke-width="2"/>
<line x1="10" y1="20" x2="2" y2="12" stroke="#FF0000" stroke-width="2"/>
</svg>`,
    FLAG_RIGHT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<line x1="6" y1="4" x2="6" y2="20" stroke="#888888" stroke-width="2"/>
<polygon points="6,4 18,8 6,12" fill="#DD0000"/>
</svg>`,
    PARTICLE: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
<circle cx="4" cy="4" r="3" fill="#FFFFFF"/>
</svg>`
  }
};
