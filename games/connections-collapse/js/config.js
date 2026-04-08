// Game constants and configuration
const GAME_W = 400;
const GAME_H = 700;
const HUD_H = 70;
const PLAY_TOP = HUD_H;
const PLAY_BOTTOM = GAME_H - 20;
const PLAY_H = PLAY_BOTTOM - PLAY_TOP;
const DANGER_LINE = PLAY_TOP + PLAY_H * 0.8;

const CARD_W = 82;
const CARD_H = 56;
const CEILING = PLAY_TOP - CARD_H - 5; // game over when stacked card top rises above spawn entry
const CARD_POOL_SIZE = 20;

const PARTICLE_CAP = 48; // HARD CAP per burst (including cascade combos)

const COLORS = {
  bg: 0x0a0e1a,
  bgTop: 0x121a2e,
  hud: 0x1a2238,
  danger: 0xff3355,
  text: 0xffffff,
  cardBase: 0xf4e4bc,
  cardBorder: 0x3a2a1a,
  cardText: 0x1a1208,
  g1: 0xf4c20d, // yellow
  g2: 0x4cd964, // green
  g3: 0x5ac8fa, // blue
  g4: 0xb56dff, // purple
  trap: 0xff6b4a,
  selectLine: 0xffe066,
  gold: 0xffd700
};

const GROUP_COLORS = [COLORS.g1, COLORS.g2, COLORS.g3, COLORS.g4];

// 12 categories, 6 words each (builder/joy fix)
const CARD_CATEGORIES = [
  { name: 'OCEAN ANIMALS',  words: ['SHARK','WHALE','OCTOPUS','TUNA','CRAB','SEAL'] },
  { name: 'DESERT ANIMALS', words: ['CAMEL','LIZARD','COYOTE','FOX','SCORPION','HAWK'] },
  { name: 'KITCHEN TOOLS',  words: ['SPATULA','WHISK','LADLE','GRATER','PEELER','TONGS'] },
  { name: 'FAST WORDS',     words: ['SWIFT','RAPID','FLEET','BRISK','QUICK','HASTY'] },
  { name: 'CHEESES',        words: ['BRIE','GOUDA','CHEDDAR','FETA','SWISS','BLUE'] },
  { name: 'MOVIE GENRES',   words: ['HORROR','COMEDY','DRAMA','ACTION','SCIFI','MUSIC'] },
  { name: 'PLANETS',        words: ['MARS','VENUS','EARTH','JUPITER','SATURN','PLUTO'] },
  { name: 'BALL SPORTS',    words: ['BASKET','FOOT','BASE','VOLLEY','TENNIS','GOLF'] },
  { name: 'COLORS',         words: ['CRIMSON','AZURE','EMERALD','AMBER','IVORY','CORAL'] },
  { name: 'FRUITS',         words: ['APPLE','MANGO','GRAPE','PEACH','LEMON','KIWI'] },
  { name: 'INSTRUMENTS',    words: ['PIANO','GUITAR','DRUM','FLUTE','VIOLIN','HARP'] },
  { name: 'WEATHER',        words: ['RAIN','SNOW','STORM','MIST','CLOUD','HAIL'] }
];

const DRAG_THRESHOLD = 16; // px - above = drag mode, below = tap
const IDLE_DEATH_MS = 28000;

// SVG textures - explicit width/height!
const SVG = {
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#fff"/></svg>`,
  spark: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#ffd700"/></svg>`
};
