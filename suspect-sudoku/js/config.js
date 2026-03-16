// config.js - Game constants, SVG assets, crime/clue pools, difficulty tables

const COLORS = {
  BACKGROUND: '#FFF8EE',
  CARD_FACE: '#FFFFFF',
  CARD_BORDER: '#CCBBAA',
  GUILTY_RED: '#E84040',
  INNOCENT_GREY: '#888888',
  TIMER_GREEN: '#4ECB71',
  TIMER_AMBER: '#F5A623',
  TIMER_RED: '#E84040',
  HUD_BG: '#1A2340',
  HUD_TEXT: '#F0EAD6',
  BADGE_GOLD: '#FFD700',
  BADGE_LOST: '#777777',
  STREAK_ORANGE: '#FF6B35',
  CRIME_HEADER_BG: '#FFF0C0',
  CORRECT_GREEN: '#27AE60',
  ACCENT_PURPLE: '#7B5EA7'
};

const SCORE_VALUES = {
  BASE_CORRECT: 100,
  SPEED_BONUS_PER_SEC: 10,
  PERFECT_BONUS: 50
};

const STREAK_THRESHOLDS = [
  { min: 15, multiplier: 3.0, label: 'x3 GENIUS MODE' },
  { min: 10, multiplier: 2.0, label: 'x2 ON FIRE' },
  { min: 5, multiplier: 1.5, label: 'x1.5 HOT STREAK' }
];

const DIFFICULTY = [
  { suspectCount: 2, timerSeconds: 15, cluesPerSuspect: 2, redHerrings: 0, inversion: false },
  { suspectCount: 3, timerSeconds: 13, cluesPerSuspect: 2, redHerrings: 1, inversion: false },
  { suspectCount: 3, timerSeconds: 11, cluesPerSuspect: 3, redHerrings: 2, inversion: false },
  { suspectCount: 4, timerSeconds: 9,  cluesPerSuspect: 3, redHerrings: 2, inversion: false },
  { suspectCount: 4, timerSeconds: 9,  cluesPerSuspect: 3, redHerrings: 3, inversion: true },
  { suspectCount: 5, timerSeconds: 8,  cluesPerSuspect: 3, redHerrings: 3, inversion: true }
];

function getDifficultyTier(caseNum) {
  if (caseNum <= 5) return 0;
  if (caseNum <= 10) return 1;
  if (caseNum <= 20) return 2;
  if (caseNum <= 35) return 3;
  if (caseNum <= 50) return 4;
  return 5;
}

function getStreakMultiplier(streak) {
  for (const t of STREAK_THRESHOLDS) {
    if (streak >= t.min) return t;
  }
  return { min: 0, multiplier: 1.0, label: '' };
}

const ANIMALS = ['cat', 'dog', 'hamster', 'parrot', 'goldfish', 'turtle'];

const CLUE_CATEGORIES = ['location', 'time', 'motive', 'alibi', 'evidence'];

const CLUE_ICONS = {
  location: 'clue-footprint',
  time: 'clue-clock',
  motive: 'clue-motive',
  alibi: 'clue-alibi-fail',
  evidence: 'clue-evidence'
};

const CLUE_LABELS = {
  location: ['Near scene', 'At the spot', 'Seen there'],
  time: ['At crime time', 'Was awake', 'No schedule'],
  motive: ['Wanted it', 'Has motive', 'Jealous'],
  alibi: ['Alibi failed', 'No alibi', 'Story changed'],
  evidence: ['Left prints', 'Evidence found', 'Caught on cam']
};

const CRIMES = [
  { id: 0,  title: 'The Eaten Birthday Cake', categories: ['location','motive'] },
  { id: 1,  title: 'The Stolen TV Remote', categories: ['location','time'] },
  { id: 2,  title: 'The Knocked-Over Plant', categories: ['location','evidence'] },
  { id: 3,  title: 'The Forwarded Chain Email', categories: ['time','evidence'] },
  { id: 4,  title: 'The Last Coffee Theft', categories: ['motive','time'] },
  { id: 5,  title: 'The Laptop Keyboard Nap', categories: ['location','motive'] },
  { id: 6,  title: 'The Hidden Car Keys', categories: ['evidence','motive'] },
  { id: 7,  title: 'The Hot Water Heist', categories: ['time','location'] },
  { id: 8,  title: 'The Spoiled Movie Ending', categories: ['evidence','time'] },
  { id: 9,  title: 'The Last Cookie Caper', categories: ['motive','evidence'] },
  { id: 10, title: 'The Missing Left Sock', categories: ['location','alibi'] },
  { id: 11, title: 'The WiFi Password Change', categories: ['time','evidence'] },
  { id: 12, title: 'The Empty Milk Carton', categories: ['motive','alibi'] },
  { id: 13, title: 'The Changed Thermostat', categories: ['location','time'] },
  { id: 14, title: 'The Toilet Paper Flip', categories: ['evidence','alibi'] },
  { id: 15, title: 'The Eaten Leftovers', categories: ['motive','location'] },
  { id: 16, title: 'The Drained Phone Battery', categories: ['time','motive'] },
  { id: 17, title: 'The Stolen Blanket', categories: ['location','evidence'] },
  { id: 18, title: 'The Unfed Goldfish', categories: ['alibi','time'] },
  { id: 19, title: 'The Missing Pizza Slice', categories: ['motive','evidence'] },
  { id: 20, title: 'The Alarm Clock Snooze', categories: ['time','alibi'] },
  { id: 21, title: 'The Wet Towel on Bed', categories: ['location','alibi'] },
  { id: 22, title: 'The Empty Ice Tray', categories: ['evidence','motive'] },
  { id: 23, title: 'The Clogged Drain', categories: ['location','evidence'] },
  { id: 24, title: 'The Unread Group Chat', categories: ['time','alibi'] },
  { id: 25, title: 'The Wrong Milk Purchase', categories: ['motive','alibi'] },
  { id: 26, title: 'The Loud Music at 3AM', categories: ['time','location'] },
  { id: 27, title: 'The Broken Mug Incident', categories: ['evidence','location'] },
  { id: 28, title: 'The Eaten Lunch Label', categories: ['motive','time'] },
  { id: 29, title: 'The Garage Door Left Open', categories: ['alibi','location'] }
];

const MILESTONE_CASES = [5, 10, 20, 30, 50];

// SVG Strings for all game textures
const SVG_STRINGS = {};

SVG_STRINGS['suspect-cat'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="45" r="28" fill="#F4A261" stroke="#333" stroke-width="3"/><circle cx="40" cy="30" r="20" fill="#F4A261" stroke="#333" stroke-width="3"/><polygon points="24,16 20,4 32,12" fill="#F4A261" stroke="#333" stroke-width="2.5"/><polygon points="56,16 60,4 48,12" fill="#F4A261" stroke="#333" stroke-width="2.5"/><circle cx="34" cy="28" r="3.5" fill="#222"/><circle cx="46" cy="28" r="3.5" fill="#222"/><polygon points="40,33 37,37 43,37" fill="#FF8FA3"/><line x1="20" y1="35" x2="36" y2="34" stroke="#555" stroke-width="1.5"/><line x1="20" y1="38" x2="36" y2="37" stroke="#555" stroke-width="1.5"/><line x1="44" y1="34" x2="60" y2="35" stroke="#555" stroke-width="1.5"/><line x1="44" y1="37" x2="60" y2="38" stroke="#555" stroke-width="1.5"/></svg>';

SVG_STRINGS['suspect-dog'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="45" r="28" fill="#C68642" stroke="#333" stroke-width="3"/><circle cx="40" cy="30" r="20" fill="#C68642" stroke="#333" stroke-width="3"/><rect x="14" y="18" width="14" height="20" rx="7" fill="#A0522D" stroke="#333" stroke-width="2" transform="rotate(-15 21 28)"/><rect x="52" y="18" width="14" height="20" rx="7" fill="#A0522D" stroke="#333" stroke-width="2" transform="rotate(15 59 28)"/><circle cx="34" cy="28" r="3.5" fill="#222"/><circle cx="46" cy="28" r="3.5" fill="#222"/><ellipse cx="40" cy="36" rx="5" ry="3" fill="#A0522D"/></svg>';

SVG_STRINGS['suspect-hamster'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="42" r="30" fill="#E8C49A" stroke="#333" stroke-width="3"/><circle cx="40" cy="30" r="20" fill="#E8C49A" stroke="#333" stroke-width="3"/><circle cx="28" cy="14" r="8" fill="#E8C49A" stroke="#333" stroke-width="2"/><circle cx="52" cy="14" r="8" fill="#E8C49A" stroke="#333" stroke-width="2"/><ellipse cx="27" cy="34" rx="10" ry="8" fill="#F0D0B0"/><ellipse cx="53" cy="34" rx="10" ry="8" fill="#F0D0B0"/><circle cx="34" cy="28" r="3" fill="#222"/><circle cx="46" cy="28" r="3" fill="#222"/><circle cx="40" cy="34" r="2.5" fill="#FF8FA3"/></svg>';

SVG_STRINGS['suspect-parrot'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="40" cy="48" rx="22" ry="26" fill="#56A95E" stroke="#333" stroke-width="3"/><circle cx="40" cy="28" r="18" fill="#56A95E" stroke="#333" stroke-width="3"/><path d="M40 10 C38 4 34 2 36 10" fill="#E84040" stroke="#333" stroke-width="1.5"/><path d="M42 10 C44 4 48 2 46 10" fill="#E84040" stroke="#333" stroke-width="1.5"/><circle cx="34" cy="26" r="4" fill="#FFF"/><circle cx="46" cy="26" r="4" fill="#FFF"/><circle cx="35" cy="27" r="2" fill="#222"/><circle cx="47" cy="27" r="2" fill="#222"/><polygon points="40,32 36,38 44,38" fill="#FFD700" stroke="#333" stroke-width="1.5"/></svg>';

SVG_STRINGS['suspect-goldfish'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="36" cy="42" rx="24" ry="18" fill="#FF8C42" stroke="#333" stroke-width="3"/><polygon points="60,32 76,22 76,62 60,52" fill="#FF6B1A" stroke="#333" stroke-width="2"/><circle cx="28" cy="38" r="4" fill="#FFF"/><circle cx="29" cy="38" r="2" fill="#222"/><path d="M18 44 Q14 48 18 52" stroke="#FF6B1A" stroke-width="2" fill="none"/><path d="M22 46 Q18 50 22 54" stroke="#FF6B1A" stroke-width="2" fill="none"/><ellipse cx="36" cy="50" rx="8" ry="3" fill="#FFB070" opacity="0.5"/></svg>';

SVG_STRINGS['suspect-turtle'] = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="40" cy="48" rx="28" ry="20" fill="#6BAF6B" stroke="#333" stroke-width="3"/><ellipse cx="40" cy="46" rx="22" ry="14" fill="#4A8A4A"/><circle cx="32" cy="42" r="6" fill="#5A9A5A" stroke="#4A8A4A" stroke-width="1"/><circle cx="48" cy="42" r="6" fill="#5A9A5A" stroke="#4A8A4A" stroke-width="1"/><circle cx="40" cy="50" r="5" fill="#5A9A5A" stroke="#4A8A4A" stroke-width="1"/><circle cx="40" cy="28" r="12" fill="#8BCB6B" stroke="#333" stroke-width="3"/><circle cx="36" cy="26" r="2.5" fill="#222"/><circle cx="44" cy="26" r="2.5" fill="#222"/><path d="M38 32 Q40 35 42 32" stroke="#333" stroke-width="1.5" fill="none"/></svg>';

SVG_STRINGS['clue-footprint'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5" ry="7" fill="#7B5EA7"/><ellipse cx="7" cy="7" rx="2.5" ry="3" fill="#7B5EA7"/><ellipse cx="12" cy="5" rx="2.5" ry="3" fill="#7B5EA7"/><ellipse cx="17" cy="7" rx="2.5" ry="3" fill="#7B5EA7"/></svg>';

SVG_STRINGS['clue-clock'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFF" stroke="#333" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="6" stroke="#333" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="16" y2="14" stroke="#333" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.5" fill="#333"/></svg>';

SVG_STRINGS['clue-motive'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 20 C6 14 2 10 6 6 C10 2 12 6 12 6 C12 6 14 2 18 6 C22 10 18 14 12 20Z" fill="#E84040"/></svg>';

SVG_STRINGS['clue-alibi-fail'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" fill="#FFF8DC" stroke="#888" stroke-width="1.5"/><line x1="8" y1="10" x2="16" y2="14" stroke="#E84040" stroke-width="2.5"/><line x1="16" y1="10" x2="8" y2="14" stroke="#E84040" stroke-width="2.5"/></svg>';

SVG_STRINGS['clue-evidence'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" fill="none" stroke="#F5A623" stroke-width="2.5"/><line x1="15" y1="15" x2="21" y2="21" stroke="#F5A623" stroke-width="2.5" stroke-linecap="round"/></svg>';

SVG_STRINGS['clue-inversion'] = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="4" y1="4" x2="20" y2="20" stroke="#E84040" stroke-width="3.5" stroke-linecap="round"/><line x1="20" y1="4" x2="4" y2="20" stroke="#E84040" stroke-width="3.5" stroke-linecap="round"/></svg>';

SVG_STRINGS['stamp-guilty'] = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60"><rect x="2" y="2" width="116" height="56" rx="8" fill="none" stroke="#E84040" stroke-width="5" stroke-dasharray="4 2" opacity="0.9"/><text x="60" y="40" font-family="Arial Black,sans-serif" font-size="26" font-weight="900" fill="#E84040" text-anchor="middle" letter-spacing="4" opacity="0.9">GUILTY</text></svg>';

SVG_STRINGS['stamp-innocent'] = '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60" viewBox="0 0 140 60"><rect x="2" y="2" width="136" height="56" rx="8" fill="none" stroke="#888" stroke-width="5" stroke-dasharray="4 2" opacity="0.9"/><text x="70" y="40" font-family="Arial Black,sans-serif" font-size="22" font-weight="900" fill="#888" text-anchor="middle" letter-spacing="3" opacity="0.9">INNOCENT</text></svg>';

SVG_STRINGS['stamp-timeout'] = '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60" viewBox="0 0 140 60"><rect x="2" y="2" width="136" height="56" rx="8" fill="none" stroke="#F5A623" stroke-width="5" stroke-dasharray="4 2" opacity="0.9"/><text x="70" y="40" font-family="Arial Black,sans-serif" font-size="22" font-weight="900" fill="#F5A623" text-anchor="middle" letter-spacing="3" opacity="0.9">TIMEOUT</text></svg>';

SVG_STRINGS['badge-active'] = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,2 25,14 38,14 28,22 32,36 20,28 8,36 12,22 2,14 15,14" fill="#FFD700" stroke="#C9A800" stroke-width="2"/><circle cx="20" cy="19" r="6" fill="#1A2340"/><text x="20" y="22" font-family="Arial" font-size="9" fill="#FFD700" text-anchor="middle">?</text></svg>';

SVG_STRINGS['badge-lost'] = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,2 25,14 38,14 28,22 32,36 20,28 8,36 12,22 2,14 15,14" fill="#777" stroke="#555" stroke-width="2"/><path d="M18 12 L22 22 L17 28" stroke="#555" stroke-width="1.5" fill="none"/></svg>';

SVG_STRINGS['particle'] = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFF"/></svg>';
