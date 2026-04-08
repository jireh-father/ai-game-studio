// Number Baseball Pro - Stage types & difficulty
function getSpecialStageType(stage) {
  if (stage < 4) return 'normal';
  if (stage % 10 === 0) return 'boss';
  if (stage % 9 === 0) return 'liar';
  if (stage % 7 === 0) return 'amnesia';
  if (stage % 5 === 0) return 'forbidden';
  if (stage % 4 === 0) return 'speed';
  return 'normal';
}

function getStageConfig(stage) {
  const type = getSpecialStageType(stage);
  let digits = Math.min(3 + Math.floor((stage - 1) / 3), 6);
  let attempts = Math.max(12 - Math.floor((stage - 1) / 1), 6);
  let timeSec = Math.max(100 - (stage - 1) * 6, 30);

  if (type === 'speed') { timeSec = 25; attempts = 999; }
  if (type === 'boss') { digits = 6; timeSec = 180; attempts = 20; }
  // amnesia/liar/forbidden use normal scaling but with effect overlays
  return { digits, attempts, timeSec, type };
}

function getStageMultiplier(type) {
  return { speed: 1.5, forbidden: 1.5, amnesia: 1.5, liar: 2, boss: 3, normal: 1 }[type] || 1;
}

function getStageThemeBg(type) {
  if (type === 'speed') return PALETTE.bgSpeed;
  if (type === 'boss') return PALETTE.bgBoss;
  if (type === 'forbidden') return PALETTE.bgForbidden;
  if (type === 'amnesia') return PALETTE.bgAmnesia;
  if (type === 'liar') return PALETTE.bgLiar;
  return PALETTE.bg;
}

function getStageBannerText(stage, type) {
  if (type === 'speed') return 'SPEED DEMON';
  if (type === 'boss') return '\u2694 BOSS CIPHER';
  if (type === 'forbidden') return 'FORBIDDEN DIGITS';
  if (type === 'amnesia') return 'AMNESIA';
  if (type === 'liar') return "LIAR'S ROUND";
  return 'STAGE ' + stage;
}

function getStageBannerColor(type) {
  if (type === 'speed') return COLORS_HEX.speed;
  if (type === 'boss') return COLORS_HEX.boss;
  if (type === 'forbidden') return COLORS_HEX.forbidden;
  if (type === 'amnesia') return COLORS_HEX.amnesia;
  if (type === 'liar') return COLORS_HEX.liar;
  return COLORS_HEX.accent;
}

const POWERUPS = {
  xray:         { icon: '\ud83d\udd2c', name: 'X-RAY',        desc: 'Next guess: reveal Strike/Ball position per slot' },
  reveal:       { icon: '\ud83d\udc41', name: 'REVEAL',       desc: 'Tap any slot to reveal the correct digit' },
  time:         { icon: '\u23f0',       name: 'TIME+',        desc: 'Adds 20 seconds immediately' },
  ghost:        { icon: '\ud83d\udc7b', name: 'GHOST',        desc: 'Next guess does not cost an attempt' },
  strike_boost: { icon: '\u26a1',       name: 'STRIKE BOOST', desc: 'Next guess: convert 1 Ball into 1 Strike' },
};
const POWERUP_KEYS = ['xray','reveal','time','ghost','strike_boost'];

function pickTwoPowerups() {
  const pool = POWERUP_KEYS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [pool[0], pool[1]];
}
