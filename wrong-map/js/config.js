// Wrong Map - Game Configuration
const CONFIG = {
  GRID_SIZE: 7,
  TILE_SIZE: 51,
  GAME_WIDTH: 360,
  GAME_HEIGHT: 640,

  COLORS: {
    BG: 0x0D1117,
    FLOOR: 0x1C2333,
    WALL: 0xE8EDF2,
    PLAYER: 0x00D4FF,
    GHOST: 0x8B5CF6,
    EXIT: 0x22C55E,
    MINIMAP_BG: 0x1E3A5F,
    MINIMAP_WALL: 0xA8C4E0,
    MINIMAP_FLOOR: 0x0F1F35,
    DANGER: 0xEF4444,
    HUD_TEXT: 0xF0F4F8,
    SCORE_POPUP: 0xF59E0B,
    TILE_FLASH: 0x2A4A6B
  },

  HEX: {
    BG: '#0D1117',
    FLOOR: '#1C2333',
    WALL: '#E8EDF2',
    PLAYER: '#00D4FF',
    GHOST: '#8B5CF6',
    EXIT: '#22C55E',
    DANGER: '#EF4444',
    HUD_TEXT: '#F0F4F8',
    SCORE_POPUP: '#F59E0B',
    GOLD: '#F59E0B'
  },

  // Ghost speed in tiles/second by room range
  GHOST_SPEED: function(room) {
    if (room <= 3) return 0.5;
    if (room <= 7) return 0.8;
    if (room <= 14) return 1.0;
    if (room <= 25) return 1.3;
    return 1.5;
  },

  // Ghost spawn delay in ms by room range
  GHOST_DELAY: function(room) {
    if (room <= 3) return 8000;
    if (room <= 7) return 6000;
    if (room <= 14) return 5000;
    if (room <= 25) return 4000;
    if (room <= 40) return 3000;
    return 2000;
  },

  // Minimap tile size by room range
  MINIMAP_TILE: function(room) {
    if (room <= 7) return 18;
    if (room <= 14) return 16;
    if (room <= 25) return 14;
    return 12;
  },

  // Corridor branches by room range
  BRANCHES: function(room) {
    if (room <= 7) return 2 + Math.floor(Math.random() * 2);
    if (room <= 20) return 4 + Math.floor(Math.random() * 2);
    return 5 + Math.floor(Math.random() * 3);
  },

  SCORE: {
    EXIT: 100,
    LIE_BONUS: 50,
    CLUTCH_BONUS: 200,
    SPEED_BONUS: 150,
    STREAK_BASE: 100,
    STREAK_MAX: 5,
    SPEED_THRESHOLD: 8000 // 8 seconds
  },

  MOVE_TWEEN_MS: 120,
  GHOST_BFS_INTERVAL: 500,
  INACTIVITY_LIMIT: 25000,

  // Rest room bonus: every 10 rooms, +2s ghost delay
  isRestRoom: function(room) { return room % 10 === 0; },
  isMilestoneRoom: function(room) { return room % 5 === 0 && room > 0; }
};

// SVG strings
const SVG = {
  PLAYER: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="none" stroke="#00D4FF" stroke-width="2" opacity="0.4"/><circle cx="14" cy="14" r="9" fill="#00D4FF"/><polygon points="14,5 18,18 14,15 10,18" fill="#0D1117"/></svg>',
  GHOST: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><ellipse cx="16" cy="14" rx="12" ry="14" fill="#8B5CF6" opacity="0.7"/><path d="M4,22 Q7,28 10,22 Q13,28 16,22 Q19,28 22,22 Q25,28 28,22 L28,30 L4,30 Z" fill="#8B5CF6" opacity="0.7"/><ellipse cx="11" cy="12" rx="3" ry="4" fill="white"/><ellipse cx="21" cy="12" rx="3" ry="4" fill="white"/><circle cx="12" cy="13" r="1.5" fill="#0D1117"/><circle cx="22" cy="13" r="1.5" fill="#0D1117"/></svg>',
  EXIT: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#22C55E" stroke-width="3" opacity="0.6"/><circle cx="20" cy="20" r="12" fill="#22C55E" opacity="0.4"/><polygon points="14,20 26,14 26,26" fill="#22C55E"/></svg>',
  PARTICLE: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#00D4FF"/></svg>',
  PARTICLE_GREEN: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#22C55E"/></svg>',
  PARTICLE_GOLD: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#F59E0B"/></svg>'
};

// Global game state
const GameState = {
  score: 0,
  room: 1,
  streak: 0,
  highScore: parseInt(localStorage.getItem('wrong-map_high_score') || '0'),
  adUsed: false,
  deathCount: 0,
  lastRoom: null, // stores room data for death screen lie reveal

  reset: function() {
    this.score = 0;
    this.room = 1;
    this.streak = 0;
    this.adUsed = false;
    this.deathCount = 0;
    this.lastRoom = null;
  },

  saveHighScore: function() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('wrong-map_high_score', String(this.highScore));
      return true;
    }
    return false;
  }
};
