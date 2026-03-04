// config.js — Game constants and configuration
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG_COLOR: 0x0A0A0F,

  // Patience
  PATIENCE_MAX: 100,
  PATIENCE_DRAIN_ANSWER_SPAM: -20,
  PATIENCE_DRAIN_HANGUP_REAL: -30,
  PATIENCE_DRAIN_MISS: -10,
  PATIENCE_GAIN_SPAM: 2,
  PATIENCE_GAIN_REAL: 5,
  PATIENCE_CRITICAL: 25,
  PATIENCE_DIRE: 10,

  // Scoring
  SCORE_SPAM: 10,
  SCORE_REAL: 15,
  SPEED_BONUS_MULT: 1.5,
  COMBO_MULTS: [1, 1, 1.5, 2, 2.5, 2.5],

  // Timing
  DEATH_TIMER_MS: 15000,
  CARD_ENTRY_MS: 200,
  CARD_EXIT_MS: 150,
  HOLD_THRESHOLD_MS: 600,
  HOLD_CANCEL_PX: 10,
  MULTI_TAP_WINDOW_MS: 1000,

  // Card layout
  CARD_W: 320,
  CARD_H: 82,
  CARD_RADIUS: 16,
  CARD_ZONE_TOP: 80,
  CARD_ZONE_BOT: 560,
  CARD_GAP: 96,
  MAX_CARDS: 6,

  // Colors
  COL_SPAM: 0xFF3B3B,
  COL_DISGUISED: 0xFF8C42,
  COL_REAL: 0x34C85A,
  COL_FAKE_REAL: 0x7B9E87,
  COL_BG: 0x0A0A0F,
  COL_TEXT: 0xE8E8F0,
  COL_PATIENCE_FULL: 0x34C85A,
  COL_PATIENCE_MID: 0xFFD60A,
  COL_PATIENCE_LOW: 0xFF3B3B,

  // Names
  SPAM_NAMES: [
    'Unknown Number', 'Scam Likely', '+1 555-0199', 'SPAM RISK',
    'Insurance Offer', 'Free Cruise!', 'IRS WARNING', 'Car Warranty',
    'Tech Support', '+1 800-SCAM', 'Prize Winner!', 'Debt Relief'
  ],
  REAL_NAMES: [
    'Mom', 'Dad', 'Boss', 'Doctor', 'Bestie', 'Babe',
    'Landlord', 'Bank', 'School', 'Delivery', 'Dentist', 'Sis'
  ],

  // Contact name colors (for real calls icon)
  CONTACT_COLORS: [0x4FC3F7, 0xBA68C8, 0xFFB74D, 0x81C784, 0xE57373, 0x64B5F6]
};

// Call type definitions
const CALL_TYPES = {
  SPAM:       { action: 'tap',       isSpam: true,  color: CONFIG.COL_SPAM },
  REAL:       { action: 'hold',      isSpam: false, color: CONFIG.COL_REAL },
  DISGUISED:  { action: 'tap',       isSpam: true,  color: CONFIG.COL_DISGUISED },
  FAKE_REAL:  { action: 'tap',       isSpam: true,  color: CONFIG.COL_FAKE_REAL },
  MULTI_TAP:  { action: 'multi-tap', isSpam: true,  color: CONFIG.COL_SPAM },
  URGENT:     { action: 'hold',      isSpam: false, color: CONFIG.COL_REAL },
  SPOOFED:    { action: 'tap',       isSpam: true,  color: CONFIG.COL_REAL },
  CONFERENCE: { action: 'tap',       isSpam: true,  color: CONFIG.COL_SPAM },
  EVOLVING:   { action: 'evolve',    isSpam: null,  color: CONFIG.COL_SPAM },
  SILENT:     { action: 'hold',      isSpam: false, color: CONFIG.COL_REAL },
  BURST:      { action: 'tap',       isSpam: true,  color: CONFIG.COL_SPAM }
};
