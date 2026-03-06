// config.js - Game constants, rules, tile pools, colors, SVGs, difficulty tables

const COLORS = {
  PRIMARY: '#1565C0',
  TILE_BG: '#ECEFF1',
  BACKGROUND: '#FAFAFA',
  STICKY: '#FFF176',
  STICKY_BORDER: '#FBC02D',
  SUCCESS: '#4CAF50',
  FAIL: '#F44336',
  TIMER_HEALTHY: '#00897B',
  TIMER_WARNING: '#FF9800',
  TIMER_CRITICAL: '#D32F2F',
  PW_TEXT: '#212121',
  UI_TEXT: '#616161',
  TILE_TEXT: '#0D47A1',
  TILE_PRESSED: '#90CAF9',
  DARK_PRIMARY: '#0D47A1'
};

const CATEGORIES = {
  COUNTRIES: ['SPAIN','GERMANY','FRANCE','ITALY','JAPAN','BRAZIL','CHINA','INDIA','PERU','CHAD','BELGIUM'],
  ANIMALS: ['CAT','DOG','BAT','OWL','RAM','EEL','YAK','BEE','ANT','FOX'],
  COLORS_LIST: ['RED','BLUE','GOLD','PINK','TAN'],
  FOODS: ['PIE','HAM','JAM','NUT','FIG','YAM'],
  ELEMENTS: ['GOLD','IRON','ZINC','NEON','TIN'],
  FRANCE_BORDERS: ['SPAIN','GERMANY','ITALY','BELGIUM']
};

const WORD_POOL = [
  'SPAIN','GERMANY','FRANCE','ITALY','JAPAN','BRAZIL','CHINA','INDIA','PERU','CHAD','BELGIUM',
  'CAT','DOG','BAT','OWL','RAM','EEL','YAK','BEE','ANT','FOX',
  'RED','BLUE','GOLD','PINK','TAN','PIE','HAM','JAM','NUT','FIG','YAM',
  'IRON','ZINC','NEON','TIN','MOON','FIRE','HELLO','MOM'
];

const NUMBER_POOL = [3, 5, 7, 11, 13, 2, 4, 6, 8, 42, 99, 100];
const SYMBOL_POOL = ['!', '@', '#', '$', '%'];
const LETTER_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const PRIMES = [2, 3, 5, 7, 11, 13];

const TIMER_CONFIG = {
  startByStage: [20,20,18,18,18,15,15,15,13,13,13,13,12],
  drain: 1,
  penalty: 5,
  inactivityThreshold: 8,
  inactivityDrain: 2,
  reviveBonus: 8
};

const SCORING = {
  stageClearFirst: 500,
  stageClearRetry: 300,
  perRule: 50,
  speedBonusMax: 200,
  resetBonus: 250,
  streakThresholds: [0, 3, 5, 8],
  streakMultipliers: [1, 1.5, 2, 3]
};

const WEBSITES = [
  ['SecureBank.com','SafeEmail.net','MyAccount.org'],
  ['TotallyLegitBank.biz','Def-Not-A-Scam.org','ReallySecure.co'],
  ['Area51Files.gov','IlluminatiPortal.io','PentagonWifi.mil'],
  ['AlienTaxReturns.space','TimeTravelBooking.quantum','MarsVisa.galaxy'],
  ['ExistentialDread.void','PasswordInception.pw','404Brain.exe']
];

const RULE_DEFS = [
  { id:'LENGTH_MIN', cat:'A', text:'Must be {v}+ characters', gen:s=>[8,10,12][Math.min(s,2)] },
  { id:'CONTAINS_NUMBER', cat:'A', text:'Must contain a number' },
  { id:'CONTAINS_UPPERCASE', cat:'A', text:'Must contain an uppercase letter' },
  { id:'CONTAINS_SYMBOL', cat:'A', text:'Must contain a symbol (!@#)' },
  { id:'LENGTH_MAX', cat:'A', text:'Must be under {v} characters', gen:s=>[20,16,14][Math.min(s,2)] },
  { id:'CONTAINS_COUNTRY', cat:'B', text:'Must include a country name' },
  { id:'CONTAINS_ANIMAL', cat:'B', text:'Must include an animal' },
  { id:'CONTAINS_COLOR', cat:'B', text:'Must include a color' },
  { id:'CONTAINS_FOOD', cat:'B', text:'Must include a food' },
  { id:'CONTAINS_ELEMENT', cat:'B', text:'Must include an element' },
  { id:'DIGIT_SUM', cat:'C', text:'Digits must sum to {v}', gen:()=>[7,10,13,15][Math.floor(Math.random()*4)] },
  { id:'CONTAINS_PRIME', cat:'C', text:'Must contain a prime number' },
  { id:'CONTAINS_EVEN', cat:'C', text:'Must contain an even number' },
  { id:'CONTAINS_ODD', cat:'C', text:'Must contain an odd number' },
  { id:'DIGIT_COUNT', cat:'C', text:'Must contain exactly {v} digits', gen:()=>[2,3,4][Math.floor(Math.random()*3)] },
  { id:'STARTS_WITH', cat:'D', text:'Must start with {v}', gen:()=>LETTER_POOL[Math.floor(Math.random()*26)] },
  { id:'ENDS_WITH', cat:'D', text:'Must end with {v}', gen:()=>['!','@','#','A','Z'][Math.floor(Math.random()*5)] },
  { id:'NO_REPEAT_CHARS', cat:'D', text:'No character may repeat' },
  { id:'CONTAINS_DOUBLE', cat:'D', text:'Must contain a double letter (AA, BB...)' },
  { id:'PALINDROME_SUB', cat:'D', text:'Must contain a 3+ letter palindrome' },
  { id:'BORDERS_FRANCE', cat:'E', text:'Must include a country bordering France' },
  { id:'THREE_LETTER_ANIMAL', cat:'E', text:'Must include a 3-letter animal' },
  { id:'VOWEL_COUNT', cat:'E', text:'Must contain exactly {v} vowels', gen:()=>[3,4,5][Math.floor(Math.random()*3)] },
  { id:'NO_LETTER_E', cat:'E', text:'Must NOT contain letter E' },
  { id:'EXACT_LENGTH', cat:'E', text:'Must be EXACTLY {v} characters', gen:()=>[10,12,14][Math.floor(Math.random()*3)] },
  { id:'TILE_COUNT_MIN', cat:'F', text:'Must use at least {v} tiles', gen:()=>[3,4][Math.floor(Math.random()*2)] },
  { id:'TILE_COUNT_MAX', cat:'F', text:'Must use at most {v} tiles', gen:()=>[4,5][Math.floor(Math.random()*2)] },
  { id:'NO_NUMBERS', cat:'F', text:'Must NOT contain any numbers' }
];

const STAGE_CATS = {
  1:'A', 2:'A', 3:'B', 4:'B', 5:'B', 6:'CD', 7:'CD', 8:'CD', 9:'E', 10:'E', 11:'E', 12:'E'
};

const SVG = {
  stickyNote: `<svg viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="176" height="36" rx="2" fill="${COLORS.STICKY}" stroke="${COLORS.STICKY_BORDER}" stroke-width="1"/><rect x="70" y="0" width="40" height="6" rx="1" fill="#E0E0E0" opacity="0.7"/></svg>`,
  tile: `<svg viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="76" height="32" rx="6" fill="#CFD8DC"/><rect x="1" y="1" width="76" height="32" rx="6" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="1"/></svg>`,
  tilePressed: `<svg viewBox="0 0 80 36" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="76" height="32" rx="6" fill="#90CAF9"/><rect x="1" y="2" width="76" height="32" rx="6" fill="#90CAF9" stroke="#64B5F6" stroke-width="1"/></svg>`,
  submitBtn: `<svg viewBox="0 0 200 44" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="196" height="40" rx="8" fill="#0D47A1"/><rect x="1" y="1" width="196" height="40" rx="8" fill="#1565C0"/></svg>`,
  lockIcon: `<svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M15,30 L15,18 Q15,5 30,5 Q45,5 45,18 L45,30" fill="none" stroke="#D32F2F" stroke-width="4" stroke-linecap="round"/><rect x="10" y="30" width="40" height="30" rx="4" fill="#D32F2F"/><circle cx="30" cy="42" r="5" fill="#FAFAFA"/><rect x="28" y="42" width="4" height="10" rx="1" fill="#FAFAFA"/></svg>`,
  checkmark: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#4CAF50"/><polyline points="7,12 10,16 17,8" fill="none" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  xmark: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#F44336"/><line x1="8" y1="8" x2="16" y2="16" stroke="#FFF" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="8" x2="8" y2="16" stroke="#FFF" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  particle: `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" fill="#FFF"/></svg>`
};

const GameState = {
  score: 0, stage: 1, streak: 0, highScore: 0, gamesPlayed: 0,
  rules: [], password: [], tiles: [], timer: 20, maxTimer: 20,
  wrongThisStage: 0, reviveUsed: false, lastTapTime: 0, paused: false
};
