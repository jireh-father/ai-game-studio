// Copycat Killer - Configuration
const COLORS = {
  player: 0xFFFFFF,
  playerGlow: 0xCCDDFF,
  ghost1: 0x44AAFF,
  ghost2: 0x9966FF,
  background: 0x0A0A12,
  obstacle: 0xFF4422,
  obstacleGlow: 0xFF8866,
  poison: 0x44FF66,
  poisonMid: 0xFFFF00,
  poisonEnd: 0xFF4422,
  hudText: 0xE8EEF8,
  hudBar: 0x12121E,
  stageBanner: 0xFFD700,
  nearMiss: 0xFFFF00,
  nearMissObstacle: 0xFF8800
};

const COLORS_CSS = {
  background: '#0A0A12',
  hudBar: '#12121E',
  obstacle: '#FF4422',
  gold: '#FFD700',
  subtitle: '#9999BB'
};

const GAME_CONFIG = {
  width: 360,
  height: 640,
  hudHeight: 48,
  playerRadius: 12,
  ghostRadius: 10,
  obstacleRadiusNormal: 14,
  obstacleRadiusFast: 10,
  obstacleRadiusMega: 28,
  ghostKillDist: 22,
  ghostNearMissDist: 52,
  obstacleKillDist: 26,
  obstacleNearMissDist: 46,
  ghostRecordInterval: 100,
  ghostReplayDelay: 5000,
  ghostMaxHistory: 30000,
  playerLerp: 0.85,
  trailCount: 6,
  trailAlphaStart: 0.4,
  trailAlphaDecay: 0.07,
  idleRadius: 60,
  poisonExpandTime: 4000,
  poisonMaxRadius: 200,
  poisonExpandRate: 50,
  minArenaWidth: 220,
  minArenaHeight: 280,
  arenaShrinkPerStage: 4
};

const SCORE_CONFIG = {
  perSecond: 10,
  ghostBonusPerSecond: 5,
  nearMissGhost: 50,
  nearMissObstacle: 25,
  stageClearMultiplier: 200,
  multiplier3Ghosts: 1.5,
  multiplier5Ghosts: 2.0
};

const DEATH_MESSAGES = [
  'YOUR PAST SELF KILLED YOU',
  'YOU CANNOT ESCAPE YOUR OWN HISTORY',
  'GHOST OF MISTAKES PAST',
  'DEJA DIE'
];

const SVG_STRINGS = {
  player: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#CCDDFF" stroke-width="2" opacity="0.4"/><circle cx="12" cy="12" r="7" fill="#FFFFFF"/><circle cx="9" cy="9" r="2.5" fill="#FFFFFF" opacity="0.8"/></svg>',
  ghost: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#44AAFF" stroke-width="2" opacity="0.3"/><circle cx="12" cy="12" r="7" fill="#44AAFF" opacity="0.6"/></svg>',
  obstacle: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="none" stroke="#FF8866" stroke-width="2" opacity="0.5"/><circle cx="14" cy="14" r="9" fill="#FF4422"/><circle cx="10" cy="10" r="3" fill="#FF9977" opacity="0.7"/></svg>',
  megaObstacle: '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="none" stroke="#FF8866" stroke-width="3" opacity="0.5"/><circle cx="28" cy="28" r="18" fill="#FF4422"/><circle cx="20" cy="20" r="6" fill="#FF9977" opacity="0.7"/></svg>',
  particle: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>',
  goldParticle: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFD700"/></svg>'
};

const DIFFICULTY_TABLE = [
  // [stageMin, stageMax, fallSpeed, obstPerWave, waveInterval, maxGhosts, idleTrigger, stageDuration]
  [1,   2,  120, 3, 2200, 1, 4000, 30000],
  [3,   5,  165, 4, 1900, 3, 4000, 25000],
  [6,  10,  210, 6, 1600, 3, 3500, 20000],
  [11, 20,  270, 9, 1200, 5, 3000, 20000],
  [21, 30,  340, 10, 1000, 5, 3000, 20000],
  [31, 999, 380, 12, 800,  5, 3000, 20000]
];

function getDifficultyForStage(stage) {
  for (const row of DIFFICULTY_TABLE) {
    if (stage >= row[0] && stage <= row[1]) {
      return {
        fallSpeed: row[2],
        obstaclesPerWave: Math.floor(2 + stage * 0.4),
        waveInterval: Math.max(800, 2500 - stage * 60),
        maxGhosts: row[5],
        idleTrigger: row[6],
        stageDuration: row[7]
      };
    }
  }
  return DIFFICULTY_TABLE[DIFFICULTY_TABLE.length - 1];
}

const AUDIO = {
  enabled: true
};
