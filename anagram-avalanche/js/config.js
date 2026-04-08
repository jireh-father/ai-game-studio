const COLORS = {
  bg: 0x0D1117, bgDark: 0x060810,
  boulder: 0x6B7280, boulderHi: 0x9CA3AF, boulderSh: 0x374151,
  tile: 0x374151, tileEdge: 0x6B7280,
  text: '#F3F4F6', textBright: '#FFFFFF',
  correct: 0x22C55E, wrong: 0xEF4444,
  wall: 0x1E293B, wallDanger: 0xDC2626,
  hudBg: 0x000000, heart: 0xEF4444, heartEmpty: 0x374151,
  combo: '#F59E0B', particle: 0xFCD34D, particle2: 0xF97316, particle3: 0xFBBF24,
  cyan: 0x06B6D4, cyanStr: '#06B6D4',
};

const GAME_CONFIG = {
  width: 414, height: 736,
  hudHeight: 56,
  wallX: 32, wallWidth: 20,
};

const SCORE = {
  kill: 100, farBonus: 50, longBonus: 150,
  letter: 10, stageClear: 200,
};

const DIFFICULTY = [
  // [stageMax, wordLen, travelTime, boulderCount, wrongPenaltyPct]
  [2, 4, 8.0, 1, 0.15],
  [4, 5, 7.0, 1, 0.15],
  [6, 6, 6.0, 2, 0.15],
  [8, 6, 5.0, 2, 0.15],
  [10, 6, 4.5, 2, 0.18],
  [14, 6, 4.0, 2, 0.18],
  [999, 6, 3.5, 2, 0.20],
];

const WORD_POOL = {
  4: ['CATS','DOGS','BIRD','FISH','LION','BEAR','WOLF','DEER','FROG','DUCK',
      'TREE','LEAF','ROCK','SAND','SNOW','RAIN','WIND','FIRE','MOON','STAR',
      'BOOK','DESK','LAMP','DOOR','ROOF','WALL','ROAD','PATH','GATE','BELL',
      'CAKE','MILK','RICE','MEAT','SOUP','SALT','HONY','PLUM','PEAR','LIME',
      'BLUE','GOLD','PINK','GRAY','JADE','RUBY','MINT','TEAL','CORK','SILK',
      'JUMP','RUNS','WALK','SING','DANCE','PLAY','READ','COOK','BAKE','RIDE'],
  5: ['APPLE','GRAPE','LEMON','MANGO','PEACH','BERRY','MELON','OLIVE','ONION','BASIL',
      'BREAD','CREAM','CANDY','SUGAR','SAUCE','SPICE','FLOUR','GRAIN','HONEY','JELLY',
      'HORSE','SHEEP','TIGER','ZEBRA','EAGLE','SHARK','WHALE','OTTER','MOUSE','SNAKE',
      'RIVER','OCEAN','BEACH','CLOUD','STORM','LIGHT','NIGHT','EARTH','PLANT','FIELD',
      'CHAIR','TABLE','COUCH','CLOCK','PHONE','PAPER','PEN','BRUSH','SHELF','STOVE',
      'BRAVE','HAPPY','QUICK','SILLY','SMART','LUCKY','PROUD','EAGER','KINDA','CRAZY'],
  6: ['BANANA','CHERRY','ORANGE','TOMATO','POTATO','CARROT','PEPPER','GARLIC','COOKIE','MUFFIN',
      'MONKEY','RABBIT','TURTLE','PARROT','BEAVER','FALCON','BADGER','DONKEY','GOPHER','SPIDER',
      'CASTLE','BRIDGE','TUNNEL','HARBOR','MARKET','SCHOOL','CHURCH','TEMPLE','MUSEUM','GARAGE',
      'PLANET','GALAXY','NEBULA','ROCKET','STARRY','METEOR','COSMIC','LUNARY','SOLARS','VOYAGE',
      'JACKET','HOODIE','GLOVES','SCARVE','BLAZER','DENIMS','SHORTS','SHOETY','COTTON','VELVET',
      'GUITAR','VIOLIN','FLUTES','DRUMER','CELLOS','BANJOS','ORGANS','MELODY','RHYTHM','TEMPOS',
      'WINDOW','MIRROR','PILLOW','CARPET','LADDER','HAMMER','KITTEN','PUPPYS','HORSES','GOPHER'],
};

const POWERUPS = [
  { id: 'slow', name: 'SLOW', desc: '+3s travel next stage', color: 0x06B6D4 },
  { id: 'shield', name: 'SHIELD', desc: 'Block next wall hit', color: 0x22C55E },
  { id: 'vowel', name: 'VOWEL HINT', desc: 'Vowels highlighted', color: 0xF59E0B },
  { id: 'score', name: 'SCORE x2', desc: 'Double score next stage', color: 0xEF4444 },
  { id: 'first', name: 'FIRST LETTER', desc: 'First letter glows', color: 0xFCD34D },
];

const BOULDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
<polygon points="10,72 3,45 14,18 34,6 80,2 126,6 146,18 157,45 150,72 126,78 80,79 34,78"
fill="#6B7280" stroke="#374151" stroke-width="3"/>
<polyline points="14,18 34,6 80,2 126,6 146,18" fill="none" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>
<line x1="40" y1="20" x2="55" y2="48" stroke="#374151" stroke-width="2" opacity="0.6"/>
<line x1="95" y1="15" x2="115" y2="55" stroke="#374151" stroke-width="1.5" opacity="0.5"/>
</svg>`;

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="26" viewBox="0 0 28 26">
<path d="M14 23 C14 23 3 15 3 8 C3 4.5 5.5 2 9 2 C11.5 2 13 4 14 5.5 C15 4 16.5 2 19 2 C22.5 2 25 4.5 25 8 C25 15 14 23 14 23Z"
fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/></svg>`;

const HEART_EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="26" viewBox="0 0 28 26">
<path d="M14 23 C14 23 3 15 3 8 C3 4.5 5.5 2 9 2 C11.5 2 13 4 14 5.5 C15 4 16.5 2 19 2 C22.5 2 25 4.5 25 8 C25 15 14 23 14 23Z"
fill="#374151" stroke="#6B7280" stroke-width="1.5"/></svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
<circle cx="6" cy="6" r="5" fill="#FCD34D"/></svg>`;
