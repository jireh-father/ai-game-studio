// Blade Spin - Game Configuration
const GAME_W = 360;
const GAME_H = 667;

const LOG_RADIUS = 90;
const LOG_CENTER_X = 180;
const LOG_CENTER_Y = 330;
const LOG_DISPLAY_SCALE = 0.9; // 200px SVG → 180px display

const BLADE_WIDTH = 10;
const BLADE_HEIGHT = 50;
const BLADE_COLLISION_ARC = 10; // degrees
const BLADE_APPLE_ARC = 15;

const BASE_ROTATION_SPEED = 0.8; // degrees per frame at stage 1
const ROTATION_SPEED_INCREMENT = 0.04;
const ROTATION_SPEED_CAP = 2.2;

const IDLE_AUTO_THROW_MS = 3000;
const IDLE_WARNING_START_MS = 1500;
const COMBO_WINDOW_MS = 2500;
const COMBO_MAX = 8;

const SHIELD_ARC_DEG = 55;
const MAX_SHIELDS = 4;
const MAX_PRELOADED = 3;
const MIN_SAFE_ARC = 120;

const SWIPE_MIN_DIST = 80;
const SWIPE_MAX_TIME = 200;
const SWIPE_DEAD_ZONE_X = 60;
const MULTI_THROW_SPREAD = 15; // degrees

const BLADE_THROW_DURATION = 180;
const HIT_FREEZE_MS = 30;

// Scoring
const SCORE_BLADE = 10;
const SCORE_APPLE = 150;
const SCORE_STAGE_BASE = 50;
const SCORE_BOSS_STAGE = 200;
const SCORE_MULTI_BLADE = 15;

// Colors
const COL_BG = '#0D0D0D';
const COL_LOG = '#7B4F2E';
const COL_LOG_GRAIN = '#5A3518';
const COL_BLADE = '#E8E8E8';
const COL_BLADE_EDGE = '#9BAAB8';
const COL_SHIELD = '#5C6B7A';
const COL_SHIELD_HIGHLIGHT = '#8FA0B0';
const COL_APPLE = '#F5C842';
const COL_APPLE_SHINE = '#FFE87A';
const COL_COMBO = '#FF7A00';
const COL_SCORE = '#FFFFFF';
const COL_STAGE = '#7EC8E3';
const COL_DANGER = '#FF2E2E';
const COL_SUCCESS = '#FFFFFF';
const COL_AUTO_WARN = '#FF9900';
const COL_HUD_BG = '#1A1A1A';

// SVG Strings - MUST include width and height attributes
const SVG_LOG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="90" fill="#7B4F2E" stroke="#5A3518" stroke-width="4"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="#5A3518" stroke-width="1.5" opacity="0.6"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="#5A3518" stroke-width="1.5" opacity="0.5"/>
  <circle cx="100" cy="100" r="30" fill="none" stroke="#5A3518" stroke-width="1.5" opacity="0.4"/>
  <line x1="100" y1="10" x2="100" y2="190" stroke="#5A3518" stroke-width="1" opacity="0.3"/>
  <line x1="10" y1="100" x2="190" y2="100" stroke="#5A3518" stroke-width="1" opacity="0.3"/>
  <circle cx="100" cy="100" r="6" fill="#5A3518"/>
</svg>`;

const SVG_LOG_BOSS = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="90" fill="#2A2A3A" stroke="#5C6B7A" stroke-width="5"/>
  <circle cx="100" cy="100" r="75" fill="none" stroke="#5C6B7A" stroke-width="2"/>
  <circle cx="100" cy="100" r="55" fill="none" stroke="#5C6B7A" stroke-width="2"/>
  <circle cx="100" cy="15" r="5" fill="#8FA0B0"/>
  <circle cx="185" cy="100" r="5" fill="#8FA0B0"/>
  <circle cx="100" cy="185" r="5" fill="#8FA0B0"/>
  <circle cx="15" cy="100" r="5" fill="#8FA0B0"/>
  <circle cx="100" cy="100" r="6" fill="#8FA0B0"/>
</svg>`;

const SVG_BLADE = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="60" viewBox="0 0 12 60">
  <rect x="3" y="36" width="6" height="20" rx="2" fill="#6B3A1F"/>
  <rect x="0" y="32" width="12" height="5" rx="1" fill="#9BAAB8"/>
  <polygon points="6,0 10,34 2,34" fill="#E8E8E8"/>
  <line x1="6" y1="0" x2="9" y2="32" stroke="#9BAAB8" stroke-width="1" opacity="0.7"/>
</svg>`;

const SVG_APPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="44" viewBox="0 0 40 44">
  <rect x="18" y="0" width="3" height="7" rx="1" fill="#5A3518"/>
  <ellipse cx="20" cy="26" rx="17" ry="16" fill="#F5C842" stroke="#D4A30F" stroke-width="2"/>
  <ellipse cx="13" cy="19" rx="5" ry="4" fill="#FFE87A" opacity="0.7"/>
  <ellipse cx="23" cy="5" rx="5" ry="3" fill="#4CAF50" transform="rotate(-30 23 5)"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4">
  <rect width="4" height="4" fill="#7B4F2E"/>
</svg>`;

const SVG_GOLD_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6">
  <polygon points="3,0 4,2 6,2 4.5,3.5 5.5,6 3,4.5 0.5,6 1.5,3.5 0,2 2,2" fill="#F5C842"/>
</svg>`;
