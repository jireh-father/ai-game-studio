// config.js — Game constants, SVG assets, color palette
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG: 0xFDF6E3,
  GRILL_DARK: 0x2C2C2C,
  GRILL_BAR: 0x444444,
  GRILL_HOT: 0xCC3300,
  RAW: 0xE8A080,
  COOKED: 0x8B4513,
  COOKED_DARK: 0x5C2A00,
  BURNT_COLOR: 0x1A0A00,
  PERFECT_GREEN: 0x44CC44,
  LATE_AMBER: 0xFFAA00,
  BURNT_RED: 0xDD2222,
  SCORE_BROWN: '#3A1A00',
  UI_BG: 0xFFFBF0,
  COMBO_GOLD: '#FFD700',
  LIVES_MAX: 5,
  LIVES_START: 3,
  INACTIVITY_WARN: 10000,
  INACTIVITY_CRIT: 13000,
  INACTIVITY_DEATH: 15000,
  PERFECT_STREAK_LIFE: 5,
  COMBO_MAX_MULTI: 5,
  STAGE_CLEAR_DELAY: 1500,
  TUTORIAL_SLOW: 0.6,
  TUTORIAL_COUNT: 3,
};

const GRADE = {
  PERFECT: { pts: 20, label: 'PERFECT!', color: '#FFD700', size: 32 },
  GOOD:    { pts: 10, label: 'GOOD!',    color: '#FFFFFF', size: 26 },
  LATE:    { pts: 3,  label: 'LATE',     color: '#FFAA00', size: 22 },
  MISS:    { pts: 0,  label: 'MISS!',    color: '#DD2222', size: 24 },
  BURNT:   { pts: 0,  label: 'BURNT!',   color: '#DD2222', size: 28 },
};

const GRILL_LAYOUTS = {
  1: [{ x: 180, y: 310, w: 180, h: 180 }],
  2: [{ x: 95, y: 300, w: 150, h: 170 }, { x: 265, y: 300, w: 150, h: 170 }],
  3: [{ x: 95, y: 250, w: 135, h: 155 }, { x: 265, y: 250, w: 135, h: 155 },
      { x: 180, y: 440, w: 135, h: 155 }],
  4: [{ x: 95, y: 235, w: 130, h: 150 }, { x: 265, y: 235, w: 130, h: 150 },
      { x: 95, y: 415, w: 130, h: 150 }, { x: 265, y: 415, w: 130, h: 150 }],
};

// SVG asset strings
const SVG = {};
SVG.pattyRaw = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="28"><ellipse cx="35" cy="14" rx="32" ry="11" fill="#E8A080" stroke="#D08060" stroke-width="1"/><ellipse cx="20" cy="12" rx="3" ry="2" fill="#D09080" opacity="0.5"/><ellipse cx="42" cy="10" rx="2" ry="2" fill="#D09080" opacity="0.5"/><ellipse cx="30" cy="16" rx="2" ry="1.5" fill="#D09080" opacity="0.4"/></svg>`;
SVG.pattyCooked = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="28"><ellipse cx="35" cy="14" rx="32" ry="11" fill="#8B4513" stroke="#5C2A00" stroke-width="1"/><line x1="15" y1="8" x2="30" y2="20" stroke="#5C2A00" stroke-width="3" stroke-linecap="round"/><line x1="28" y1="7" x2="43" y2="19" stroke="#5C2A00" stroke-width="3" stroke-linecap="round"/><line x1="40" y1="8" x2="55" y2="20" stroke="#5C2A00" stroke-width="3" stroke-linecap="round"/></svg>`;
SVG.pattyBurnt = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="28"><ellipse cx="35" cy="14" rx="32" ry="11" fill="#1A0A00" stroke="#000" stroke-width="1"/></svg>`;
SVG.burgerLife = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M3 12c0-5 4-9 9-9s9 4 9 9H3z" fill="#F4A460"/><ellipse cx="12" cy="13" rx="10" ry="3" fill="#8B4513"/><rect x="3" y="14" width="18" height="4" rx="2" fill="#DEB887"/><ellipse cx="12" cy="12" rx="10" ry="2" fill="#DEB887" opacity="0.5"/></svg>`;
SVG.burgerLifeEmpty = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M3 12c0-5 4-9 9-9s9 4 9 9H3z" fill="#CCC"/><ellipse cx="12" cy="13" rx="10" ry="3" fill="#AAA"/><rect x="3" y="14" width="18" height="4" rx="2" fill="#CCC"/></svg>`;
SVG.customerHappy = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="#FFDAB9"/><circle cx="12" cy="15" r="2.5" fill="#333"/><circle cx="24" cy="15" r="2.5" fill="#333"/><path d="M10 22 Q18 30 26 22" stroke="#333" stroke-width="2" fill="none"/><circle cx="8" cy="20" r="4" fill="#44CC44" opacity="0.3"/><circle cx="28" cy="20" r="4" fill="#44CC44" opacity="0.3"/></svg>`;
SVG.customerWait = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="#FFDAB9"/><circle cx="12" cy="15" r="2.5" fill="#333"/><circle cx="24" cy="15" r="2.5" fill="#333"/><line x1="10" y1="23" x2="26" y2="23" stroke="#333" stroke-width="2"/><circle cx="8" cy="20" r="4" fill="#FFAA00" opacity="0.3"/><circle cx="28" cy="20" r="4" fill="#FFAA00" opacity="0.3"/></svg>`;
SVG.customerAngry = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="16" fill="#FFDAB9"/><circle cx="12" cy="15" r="2.5" fill="#333"/><circle cx="24" cy="15" r="2.5" fill="#333"/><path d="M10 25 Q18 19 26 25" stroke="#333" stroke-width="2" fill="none"/><circle cx="8" cy="20" r="4" fill="#DD2222" opacity="0.3"/><circle cx="28" cy="20" r="4" fill="#DD2222" opacity="0.3"/></svg>`;
SVG.particle = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFD700"/></svg>`;
SVG.steamParticle = `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><circle cx="3" cy="3" r="3" fill="#FFF" opacity="0.7"/></svg>`;
