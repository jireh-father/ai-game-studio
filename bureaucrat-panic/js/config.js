// config.js — Constants, SVG strings, rule library, audio synthesis

const COLORS = {
  govBlue: '#2B4C8C',
  stampRed: '#C0392B',
  officeCream: '#F5F0E8',
  approveGreen: '#27AE60',
  denyRed: '#E74C3C',
  timerOrange: '#E67E22',
  timerDanger: '#E74C3C',
  inkBlack: '#1A1A2E',
  ruleCardBg: '#EBF5FB',
  paperGray: '#BDC3C7',
  comboGold: '#F39C12',
  warmGray: '#D5CFC4'
};

const DIMS = {
  width: 360,
  height: 600,
  rulesBarHeight: 120,
  timerBarY: 122,
  timerBarH: 8,
  formCenterX: 180,
  formCenterY: 340,
  formW: 300,
  formH: 200,
  hudY: 568,
  swipeThreshold: 80,
  maxRotation: 25
};

const SCORE_VALUES = {
  correct: 100,
  speedBonus: 50,
  clutchBonus: 100,
  stageBonus: 500,
  comboThresholds: [3, 5, 8],
  comboMultipliers: [1.5, 2.0, 3.0]
};

const DIFFICULTY = [
  { stageMin: 1, stageMax: 2, decisionWindow: 9, ruleCount: 1, ruleFlipChance: 0, overrideChance: 0 },
  { stageMin: 3, stageMax: 4, decisionWindow: 10, ruleCount: 2, ruleFlipChance: 0, overrideChance: 0 },
  { stageMin: 5, stageMax: 7, decisionWindow: 9, ruleCount: 3, ruleFlipChance: 0.25, overrideChance: 0 },
  { stageMin: 8, stageMax: 11, decisionWindow: 8, ruleCount: 4, ruleFlipChance: 0.25, overrideChance: 0.10 },
  { stageMin: 12, stageMax: 19, decisionWindow: 7, ruleCount: 4, ruleFlipChance: 0.30, overrideChance: 0.10 },
  { stageMin: 20, stageMax: 999, decisionWindow: 6, ruleCount: 4, ruleFlipChance: 0.35, overrideChance: 0.15 }
];

const ICON_APPLICANTS = ['human', 'ghost', 'robot', 'werewolf', 'dragon', 'wizard', 'vampire', 'alien', 'skeleton', 'golem', 'mermaid', 'phoenix'];
const ICON_REQUESTS = ['noise', 'flame', 'overtime', 'haunting', 'flight', 'magic', 'parking', 'demolition', 'loud', 'transform'];
const ICON_TIMES = ['dawn', 'day', 'dusk', 'night'];
const ICON_MODIFIERS = ['none', 'urgent', 'restricted', 'override'];

// Rule library
const RULE_LIBRARY = [
  { id: 'R01', check: (f) => f.applicant === 'ghost' && f.request === 'noise', verdict: 'deny', icon1: 'ghost', icon2: 'noise', label: 'No noise for ghosts', tier: 1 },
  { id: 'R02', check: (f) => f.applicant === 'dragon' && f.time === 'day', verdict: 'approve', icon1: 'dragon', icon2: 'day', label: 'Dragons OK daytime', tier: 1 },
  { id: 'R03', check: (f) => f.request === 'flame' && f.applicant !== 'dragon', verdict: 'deny', icon1: 'flame', icon2: 'no-dragon', label: 'Flame = dragons only', tier: 1 },
  { id: 'R04', check: (f) => f.applicant === 'robot' && f.request === 'overtime' && f.time === 'night', verdict: 'deny', icon1: 'robot', icon2: 'overtime', label: 'No robot OT at night', tier: 1 },
  { id: 'R05', check: (f) => f.request === 'haunting' && f.time !== 'night', verdict: 'deny', icon1: 'haunting', icon2: 'night', label: 'Haunt only at night', tier: 1 },
  { id: 'R06', check: (f) => f.applicant === 'wizard' && f.request === 'magic', verdict: 'approve', icon1: 'wizard', icon2: 'magic', label: 'Wizards get magic', tier: 1 },
  { id: 'R07', check: (f) => f.modifier === 'urgent', verdict: 'approve', icon1: 'urgent', icon2: null, label: 'URGENT = approve', tier: 2 },
  { id: 'R08', check: (f) => f.applicant === 'vampire' && f.time === 'day', verdict: 'deny', icon1: 'vampire', icon2: 'day', label: 'No vampires daytime', tier: 2 },
  { id: 'R09', check: (f) => f.applicant === 'werewolf' && f.request === 'noise' && f.time === 'dusk', verdict: 'approve', icon1: 'werewolf', icon2: 'noise', label: 'Werewolf noise @ dusk', tier: 2 },
  { id: 'R10', check: (f) => f.modifier === 'restricted', verdict: 'deny', icon1: 'restricted', icon2: null, label: 'RESTRICTED = deny', tier: 2 },
  { id: 'R11', check: (f) => f.applicant === 'alien' && f.request === 'flight', verdict: 'approve', icon1: 'alien', icon2: 'flight', label: 'Aliens may fly', tier: 2 },
  { id: 'R12', check: (f) => f.applicant === 'skeleton' && f.request === 'demolition', verdict: 'deny', icon1: 'skeleton', icon2: 'demolition', label: 'No skeleton demolition', tier: 2 },
  { id: 'R13', check: (f) => f.request === 'parking' && f.time === 'night', verdict: 'deny', icon1: 'parking', icon2: 'night', label: 'No parking at night', tier: 3 },
  { id: 'R14', check: (f) => f.applicant === 'golem' && f.request === 'demolition', verdict: 'approve', icon1: 'golem', icon2: 'demolition', label: 'Golems demolish OK', tier: 3 },
  { id: 'R15', check: (f) => f.applicant === 'mermaid' && f.request === 'overtime', verdict: 'deny', icon1: 'mermaid', icon2: 'overtime', label: 'No mermaid OT', tier: 3 },
  { id: 'R16', check: (f) => f.applicant === 'phoenix' && f.request === 'flame' && f.time !== 'dawn', verdict: 'deny', icon1: 'phoenix', icon2: 'flame', label: 'Phoenix flame dawn only', tier: 3 },
  { id: 'R17', check: (f) => f.request === 'loud' && (f.time === 'dusk' || f.time === 'night'), verdict: 'deny', icon1: 'loud', icon2: 'night', label: 'No loud after dusk', tier: 3 },
  { id: 'R18', check: (f) => f.modifier === 'override', verdict: 'approve', icon1: 'override', icon2: null, label: 'OVERRIDE = approve all', tier: 3 }
];

// SVG Strings for all textures
const SVG_STRINGS = {};

// Form card
SVG_STRINGS['form-card'] = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" rx="8" ry="8" fill="#F5F0E8" stroke="#C8B99A" stroke-width="2"/><rect x="0" y="0" width="300" height="36" rx="8" ry="8" fill="#2B4C8C"/><rect x="0" y="18" width="300" height="18" fill="#2B4C8C"/><text x="150" y="26" text-anchor="middle" font-size="12" fill="white" font-family="monospace">PERMIT APPLICATION</text><line x1="16" y1="70" x2="284" y2="70" stroke="#D5CFC4" stroke-width="1"/><line x1="16" y1="110" x2="284" y2="110" stroke="#D5CFC4" stroke-width="1"/><line x1="16" y1="150" x2="284" y2="150" stroke="#D5CFC4" stroke-width="1"/></svg>';

// Rule card
SVG_STRINGS['rule-card'] = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70" viewBox="0 0 160 70"><rect width="160" height="70" rx="6" fill="#EBF5FB" stroke="#2B4C8C" stroke-width="2"/><rect x="0" y="0" width="160" height="20" rx="6" ry="6" fill="#2B4C8C"/><rect x="0" y="10" width="160" height="10" fill="#2B4C8C"/><text x="80" y="15" text-anchor="middle" font-size="9" fill="white" font-family="monospace">RULE</text></svg>';

// Stamps
SVG_STRINGS['stamp-approved'] = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="4" fill="none" stroke="#27AE60" stroke-width="4"/><text x="60" y="40" text-anchor="middle" font-size="22" font-weight="900" fill="#27AE60" font-family="monospace" letter-spacing="2">APPROVED</text></svg>';
SVG_STRINGS['stamp-denied'] = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect width="120" height="60" rx="4" fill="none" stroke="#C0392B" stroke-width="4"/><text x="60" y="40" text-anchor="middle" font-size="22" font-weight="900" fill="#C0392B" font-family="monospace" letter-spacing="2">DENIED</text></svg>';

// Particle dot
SVG_STRINGS['particle-dot'] = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="white"/></svg>';

// Applicant icons (48x48)
function makeIcon(body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">' + body + '</svg>'; }

SVG_STRINGS['icon-human'] = makeIcon('<circle cx="24" cy="16" r="10" fill="#F5CDA7" stroke="#1A1A2E" stroke-width="2"/><rect x="12" y="28" width="24" height="16" rx="4" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/><circle cx="20" cy="14" r="2" fill="#1A1A2E"/><circle cx="28" cy="14" r="2" fill="#1A1A2E"/>');
SVG_STRINGS['icon-ghost'] = makeIcon('<ellipse cx="24" cy="20" rx="14" ry="14" fill="#FFFFFF" stroke="#1A1A2E" stroke-width="2"/><path d="M10 28 L10 42 Q16 38 20 42 Q24 38 28 42 Q32 38 38 42 L38 28" fill="white" stroke="#1A1A2E" stroke-width="2"/><circle cx="19" cy="20" r="3" fill="#1A1A2E"/><circle cx="29" cy="20" r="3" fill="#1A1A2E"/>');
SVG_STRINGS['icon-robot'] = makeIcon('<rect x="12" y="8" width="24" height="20" rx="3" fill="#BDC3C7" stroke="#1A1A2E" stroke-width="2"/><rect x="16" y="30" width="16" height="14" fill="#BDC3C7" stroke="#1A1A2E" stroke-width="2"/><rect x="18" y="14" width="5" height="5" fill="#27AE60"/><rect x="25" y="14" width="5" height="5" fill="#27AE60"/><rect x="20" y="22" width="8" height="3" fill="#1A1A2E"/><line x1="22" y1="4" x2="26" y2="4" stroke="#1A1A2E" stroke-width="2"/><line x1="24" y1="4" x2="24" y2="8" stroke="#1A1A2E" stroke-width="2"/>');
SVG_STRINGS['icon-werewolf'] = makeIcon('<ellipse cx="24" cy="18" rx="12" ry="14" fill="#8B6914" stroke="#1A1A2E" stroke-width="2"/><polygon points="14,10 10,2 18,8" fill="#8B6914" stroke="#1A1A2E" stroke-width="1.5"/><polygon points="34,10 38,2 30,8" fill="#8B6914" stroke="#1A1A2E" stroke-width="1.5"/><circle cx="19" cy="16" r="2.5" fill="#F39C12"/><circle cx="29" cy="16" r="2.5" fill="#F39C12"/><path d="M18 26 Q24 30 30 26" stroke="#1A1A2E" stroke-width="2" fill="none"/>');
SVG_STRINGS['icon-dragon'] = makeIcon('<ellipse cx="24" cy="22" rx="14" ry="12" fill="#27AE60" stroke="#1A1A2E" stroke-width="2"/><polygon points="14,16 6,6 12,18" fill="#27AE60" stroke="#1A1A2E" stroke-width="1.5"/><polygon points="34,16 42,6 36,18" fill="#27AE60" stroke="#1A1A2E" stroke-width="1.5"/><circle cx="19" cy="20" r="3" fill="#E74C3C"/><circle cx="29" cy="20" r="3" fill="#E74C3C"/><path d="M20 28 L24 32 L28 28" stroke="#E67E22" stroke-width="2" fill="#E67E22"/>');
SVG_STRINGS['icon-wizard'] = makeIcon('<polygon points="24,2 14,18 34,18" fill="#8E44AD" stroke="#1A1A2E" stroke-width="2"/><circle cx="24" cy="10" r="2" fill="#F39C12"/><circle cx="24" cy="24" r="10" fill="#F5CDA7" stroke="#1A1A2E" stroke-width="2"/><circle cx="20" cy="22" r="2" fill="#1A1A2E"/><circle cx="28" cy="22" r="2" fill="#1A1A2E"/><path d="M14 36 Q24 42 34 36" fill="#8E44AD" stroke="#1A1A2E" stroke-width="2"/>');
SVG_STRINGS['icon-vampire'] = makeIcon('<ellipse cx="24" cy="20" rx="12" ry="14" fill="#ECF0F1" stroke="#1A1A2E" stroke-width="2"/><circle cx="19" cy="18" r="2.5" fill="#C0392B"/><circle cx="29" cy="18" r="2.5" fill="#C0392B"/><path d="M20 28 L22 34 L24 28 L26 34 L28 28" fill="white" stroke="#1A1A2E" stroke-width="1.5"/><path d="M12 8 Q24 14 36 8" fill="#1A1A2E"/>');
SVG_STRINGS['icon-alien'] = makeIcon('<ellipse cx="24" cy="22" rx="14" ry="16" fill="#2ECC71" stroke="#1A1A2E" stroke-width="2"/><ellipse cx="17" cy="18" rx="5" ry="3" fill="#1A1A2E"/><ellipse cx="31" cy="18" rx="5" ry="3" fill="#1A1A2E"/><ellipse cx="17" cy="18" rx="3" ry="2" fill="#27AE60"/><ellipse cx="31" cy="18" rx="3" ry="2" fill="#27AE60"/><ellipse cx="24" cy="30" rx="3" ry="1.5" fill="#1A1A2E"/>');
SVG_STRINGS['icon-skeleton'] = makeIcon('<circle cx="24" cy="16" r="10" fill="#ECF0F1" stroke="#1A1A2E" stroke-width="2"/><circle cx="20" cy="14" r="3" fill="#1A1A2E"/><circle cx="28" cy="14" r="3" fill="#1A1A2E"/><polygon points="22,20 24,24 26,20" fill="#1A1A2E"/><line x1="18" y1="28" x2="30" y2="28" stroke="#1A1A2E" stroke-width="2"/><line x1="20" y1="28" x2="20" y2="32" stroke="#1A1A2E" stroke-width="1.5"/><line x1="24" y1="28" x2="24" y2="32" stroke="#1A1A2E" stroke-width="1.5"/><line x1="28" y1="28" x2="28" y2="32" stroke="#1A1A2E" stroke-width="1.5"/>');
SVG_STRINGS['icon-golem'] = makeIcon('<rect x="10" y="8" width="28" height="28" rx="4" fill="#95A5A6" stroke="#1A1A2E" stroke-width="2"/><rect x="16" y="14" width="6" height="4" fill="#E67E22"/><rect x="26" y="14" width="6" height="4" fill="#E67E22"/><rect x="18" y="24" width="12" height="4" fill="#1A1A2E"/><line x1="22" y1="24" x2="22" y2="28" stroke="#95A5A6" stroke-width="1"/><line x1="26" y1="24" x2="26" y2="28" stroke="#95A5A6" stroke-width="1"/>');
SVG_STRINGS['icon-mermaid'] = makeIcon('<circle cx="24" cy="14" r="10" fill="#F5CDA7" stroke="#1A1A2E" stroke-width="2"/><circle cx="20" cy="12" r="2" fill="#1A1A2E"/><circle cx="28" cy="12" r="2" fill="#1A1A2E"/><path d="M14 26 Q24 34 34 26" fill="#3498DB" stroke="#1A1A2E" stroke-width="2"/><path d="M20 36 Q24 44 28 36" fill="#3498DB" stroke="#1A1A2E" stroke-width="1.5"/>');
SVG_STRINGS['icon-phoenix'] = makeIcon('<ellipse cx="24" cy="22" rx="12" ry="10" fill="#E74C3C" stroke="#1A1A2E" stroke-width="2"/><polygon points="16,14 8,4 14,16" fill="#E67E22" stroke="#1A1A2E" stroke-width="1"/><polygon points="32,14 40,4 34,16" fill="#E67E22" stroke="#1A1A2E" stroke-width="1"/><polygon points="24,10 20,4 28,4" fill="#F39C12" stroke="#1A1A2E" stroke-width="1"/><circle cx="20" cy="20" r="2" fill="#F39C12"/><circle cx="28" cy="20" r="2" fill="#F39C12"/><path d="M20 28 L24 34 L28 28" fill="#E67E22"/>');

// Request icons (48x48)
SVG_STRINGS['req-noise'] = makeIcon('<polygon points="12,18 22,18 30,10 30,38 22,30 12,30" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/><path d="M33 16 Q39 24 33 32" fill="none" stroke="#2B4C8C" stroke-width="2.5" stroke-linecap="round"/><path d="M36 12 Q44 24 36 36" fill="none" stroke="#2B4C8C" stroke-width="2" stroke-linecap="round"/>');
SVG_STRINGS['req-flame'] = makeIcon('<path d="M24 6 Q30 18 26 24 Q32 18 28 30 Q34 22 30 36 Q24 42 18 36 Q14 22 16 30 Q12 18 20 24 Q16 18 24 6Z" fill="#E67E22" stroke="#E74C3C" stroke-width="2"/>');
SVG_STRINGS['req-overtime'] = makeIcon('<circle cx="24" cy="24" r="16" fill="none" stroke="#2B4C8C" stroke-width="2.5"/><line x1="24" y1="24" x2="24" y2="12" stroke="#1A1A2E" stroke-width="2.5" stroke-linecap="round"/><line x1="24" y1="24" x2="32" y2="28" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="2" fill="#E74C3C"/>');
SVG_STRINGS['req-haunting'] = makeIcon('<rect x="10" y="16" width="28" height="24" rx="2" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/><polygon points="10,16 24,6 38,16" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/><rect x="20" y="28" width="8" height="12" fill="#F5F0E8"/><circle cx="18" cy="24" r="2" fill="#F39C12"/><circle cx="30" cy="24" r="2" fill="#F39C12"/>');
SVG_STRINGS['req-flight'] = makeIcon('<path d="M24 8 L28 20 L42 20 L30 28 L34 42 L24 32 L14 42 L18 28 L6 20 L20 20Z" fill="#3498DB" stroke="#1A1A2E" stroke-width="1.5"/>');
SVG_STRINGS['req-magic'] = makeIcon('<polygon points="24,4 28,16 40,16 30,24 34,36 24,28 14,36 18,24 8,16 20,16" fill="#8E44AD" stroke="#1A1A2E" stroke-width="1.5"/><circle cx="24" cy="20" r="3" fill="#F39C12"/>');
SVG_STRINGS['req-parking'] = makeIcon('<rect x="8" y="8" width="32" height="32" rx="4" fill="#2B4C8C" stroke="#1A1A2E" stroke-width="2"/><text x="24" y="34" text-anchor="middle" font-size="26" font-weight="bold" fill="white" font-family="sans-serif">P</text>');
SVG_STRINGS['req-demolition'] = makeIcon('<circle cx="24" cy="16" r="10" fill="#95A5A6" stroke="#1A1A2E" stroke-width="2"/><line x1="24" y1="26" x2="24" y2="40" stroke="#1A1A2E" stroke-width="3"/><line x1="16" y1="40" x2="32" y2="40" stroke="#1A1A2E" stroke-width="2"/><path d="M14 16 L10 10" stroke="#E74C3C" stroke-width="2"/><path d="M34 16 L38 10" stroke="#E74C3C" stroke-width="2"/>');
SVG_STRINGS['req-loud'] = makeIcon('<polygon points="12,18 22,18 30,10 30,38 22,30 12,30" fill="#E74C3C" stroke="#1A1A2E" stroke-width="2"/><text x="38" y="30" font-size="18" font-weight="bold" fill="#E74C3C" font-family="sans-serif">!</text>');
SVG_STRINGS['req-transform'] = makeIcon('<path d="M12 24 L20 12 L28 24 L36 12" stroke="#8E44AD" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M12 36 L20 24 L28 36 L36 24" stroke="#2ECC71" stroke-width="3" fill="none" stroke-linecap="round"/>');

// Time of day icons (36x36)
function makeTimeIcon(body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' + body + '</svg>'; }

SVG_STRINGS['time-dawn'] = makeTimeIcon('<circle cx="18" cy="24" r="10" fill="#F39C12" stroke="#E67E22" stroke-width="2"/><line x1="18" y1="10" x2="18" y2="6" stroke="#F39C12" stroke-width="2"/><line x1="8" y1="16" x2="5" y2="13" stroke="#F39C12" stroke-width="2"/><line x1="28" y1="16" x2="31" y2="13" stroke="#F39C12" stroke-width="2"/><rect x="0" y="28" width="36" height="8" fill="#E67E22" opacity="0.4"/>');
SVG_STRINGS['time-day'] = makeTimeIcon('<circle cx="18" cy="18" r="10" fill="#F1C40F" stroke="#F39C12" stroke-width="2"/><line x1="18" y1="4" x2="18" y2="1" stroke="#F1C40F" stroke-width="2"/><line x1="18" y1="32" x2="18" y2="35" stroke="#F1C40F" stroke-width="2"/><line x1="4" y1="18" x2="1" y2="18" stroke="#F1C40F" stroke-width="2"/><line x1="32" y1="18" x2="35" y2="18" stroke="#F1C40F" stroke-width="2"/>');
SVG_STRINGS['time-dusk'] = makeTimeIcon('<circle cx="18" cy="24" r="10" fill="#E67E22" stroke="#C0392B" stroke-width="2"/><line x1="18" y1="10" x2="18" y2="6" stroke="#E67E22" stroke-width="2"/><rect x="0" y="28" width="36" height="8" fill="#8E44AD" opacity="0.4"/>');
SVG_STRINGS['time-night'] = makeTimeIcon('<circle cx="18" cy="18" r="16" fill="#1A1A2E" stroke="#2B4C8C" stroke-width="2"/><path d="M22 8 A10 10 0 1 0 22 28 A7 7 0 1 1 22 8 Z" fill="#F5F0E8"/><circle cx="10" cy="10" r="1" fill="#F5F0E8"/><circle cx="28" cy="14" r="1.5" fill="#F5F0E8"/>');

// Modifier badges (32x32)
function makeBadge(body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' + body + '</svg>'; }

SVG_STRINGS['badge-urgent'] = makeBadge('<rect x="2" y="2" width="28" height="28" rx="4" fill="#E74C3C" stroke="#1A1A2E" stroke-width="2"/><text x="16" y="24" text-anchor="middle" font-size="20" font-weight="bold" fill="white" font-family="sans-serif">!</text>');
SVG_STRINGS['badge-restricted'] = makeBadge('<circle cx="16" cy="16" r="13" fill="none" stroke="#E74C3C" stroke-width="3"/><line x1="6" y1="6" x2="26" y2="26" stroke="#E74C3C" stroke-width="3"/>');
SVG_STRINGS['badge-override'] = makeBadge('<polygon points="16,2 30,28 2,28" fill="#E67E22" stroke="#1A1A2E" stroke-width="2"/><text x="16" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#1A1A2E">!</text>');

// Desk decoration SVGs
SVG_STRINGS['deco-pencilcup'] = makeIcon('<rect x="14" y="20" width="20" height="24" rx="2" fill="#8B6914" stroke="#1A1A2E" stroke-width="2"/><line x1="18" y1="20" x2="16" y2="6" stroke="#E74C3C" stroke-width="2"/><line x1="24" y1="20" x2="24" y2="4" stroke="#2B4C8C" stroke-width="2"/><line x1="30" y1="20" x2="32" y2="8" stroke="#27AE60" stroke-width="2"/>');
SVG_STRINGS['deco-plant'] = makeIcon('<rect x="16" y="30" width="16" height="14" rx="2" fill="#8B6914" stroke="#1A1A2E" stroke-width="2"/><ellipse cx="24" cy="24" rx="12" ry="10" fill="#27AE60" stroke="#1A1A2E" stroke-width="2"/><ellipse cx="18" cy="18" rx="6" ry="8" fill="#2ECC71"/>');
SVG_STRINGS['deco-nameplate'] = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" rx="3" fill="#C8B99A" stroke="#8B6914" stroke-width="2"/><text x="50" y="20" text-anchor="middle" font-size="10" fill="#1A1A2E" font-family="monospace">BUREAUCRAT</text></svg>';

// Swipe diagram for help
SVG_STRINGS['swipe-diagram'] = '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="80" viewBox="0 0 280 80"><polygon points="30,40 55,25 55,35 100,35 100,45 55,45 55,55" fill="#E74C3C"/><text x="15" y="70" font-size="11" fill="#E74C3C" font-family="monospace">DENY</text><rect x="110" y="15" width="60" height="50" rx="4" fill="#F5F0E8" stroke="#C8B99A" stroke-width="2"/><polygon points="250,40 225,25 225,35 180,35 180,45 225,45 225,55" fill="#27AE60"/><text x="230" y="70" font-size="11" fill="#27AE60" font-family="monospace">APPROVE</text></svg>';

// Audio synthesis (Web Audio API)
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function synthSound(type, freq, dur, vol) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function synthStamp() {
  synthSound('square', 120, 0.18, 0.4);
  synthSound('triangle', 800, 0.05, 0.2);
}

function synthShred() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

function synthChime() {
  synthSound('sine', 523, 0.1, 0.25);
  setTimeout(() => synthSound('sine', 659, 0.15, 0.25), 80);
}

function synthBuzz() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

function synthCombo(n) {
  const freq = 600 + n * 50;
  synthSound('sine', freq, 0.08, 0.2);
}

function synthTick() { synthSound('sine', 880, 0.02, 0.15); }

function synthNewRule() {
  synthSound('sine', 587, 0.12, 0.2);
  setTimeout(() => synthSound('sine', 698, 0.12, 0.2), 130);
  setTimeout(() => synthSound('sine', 880, 0.15, 0.2), 260);
}

function synthStageComplete() {
  [523, 587, 659, 784].forEach((f, i) => setTimeout(() => synthSound('sawtooth', f, 0.15, 0.15), i * 120));
}

function synthFired() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(293, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

function synthClick() { synthSound('sine', 1200, 0.04, 0.1); }
function synthSnap() { synthSound('triangle', 600, 0.08, 0.15); }
