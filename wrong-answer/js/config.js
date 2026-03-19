// config.js — Constants, question bank, color palette, difficulty tables

const COLORS = {
  BG: '#0D1B2A',
  QUESTION_CARD: '#F5F0E8',
  QUESTION_CARD_STROKE: '#C8C0B0',
  BTN_DEFAULT: '#2E4057',
  BTN_STROKE: '#3D5070',
  BTN_TEXT: '#FFFFFF',
  DEATH_RED: '#E63946',
  SAFE_GREEN: '#2DC653',
  TIMER_FULL: '#FF6B35',
  TIMER_DANGER: '#E63946',
  TIMER_BG: '#1A2940',
  HUD_TEXT: '#E8DCC8',
  STREAK_GOLD: '#FFD700',
  ACCENT_TEAL: '#00F5D4',
  BG_PULSE: '#1A3A5C',
  DARK_RED: '#8B1A1A'
};

const GAME_CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  HUD_HEIGHT: 50,
  QUESTION_Y: 100,
  QUESTION_H: 130,
  TIMER_Y: 245,
  TIMER_H: 14,
  BTN_START_Y: 275,
  BTN_HEIGHT: 100,
  BTN_GAP: 10,
  BTN_WIDTH: 320,
  STREAK_Y: 610
};

const DIFFICULTY = {
  getTimerMs(stage) {
    return Math.max(2000, 5000 - (stage - 1) * 150);
  },
  getQuestionCount(stage) {
    return Math.min(10, 5 + Math.min(stage - 1, 5));
  },
  getObviousWeight(stage) {
    return Math.min(0.70, 0.20 + (stage - 1) * (0.50 / 19));
  },
  getTrickChance(stage) {
    if (stage < 7) return 0;
    return Math.min(0.30, 0.10 + (stage - 7) * 0.02);
  },
  isRestStage(stage) {
    return stage > 1 && stage % 10 === 0;
  }
};

const SCORE = {
  BASE: 100,
  SPEED_FAST: 150,
  SPEED_MID: 75,
  SPEED_FAST_THRESHOLD: 0.20,
  SPEED_MID_THRESHOLD: 0.50,
  STREAK_TABLE: [
    { threshold: 20, multiplier: 5.0 },
    { threshold: 10, multiplier: 3.0 },
    { threshold: 5, multiplier: 2.0 },
    { threshold: 2, multiplier: 1.5 }
  ],
  getMultiplier(streak) {
    for (const entry of this.STREAK_TABLE) {
      if (streak >= entry.threshold) return entry.multiplier;
    }
    return 1.0;
  }
};

const QUESTIONS = [
  // Category A: Arithmetic
  { q: 'What is 2 + 2?', answers: ['4', '5', '7'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 3 + 3?', answers: ['6', '5', '8'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 10 - 3?', answers: ['7', '9', '4'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 5 x 2?', answers: ['10', '8', '12'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 1 + 1?', answers: ['2', '3', '4'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 100 - 1?', answers: ['99', '98', '100'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 6 / 2?', answers: ['3', '4', '2'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 4 x 4?', answers: ['16', '12', '18'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 50 + 50?', answers: ['100', '99', '101'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 7 - 4?', answers: ['3', '2', '5'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 9 x 1?', answers: ['9', '8', '10'], correctIndex: 0, category: 'A', obvious: true },
  { q: 'What is 20 / 4?', answers: ['5', '4', '6'], correctIndex: 0, category: 'A', obvious: true },

  // Category B: Colors / Nature
  { q: 'What color is the sky?', answers: ['Blue', 'Red', 'Green'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is grass?', answers: ['Green', 'Blue', 'Yellow'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is snow?', answers: ['White', 'Grey', 'Blue'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is a ripe banana?', answers: ['Yellow', 'Green', 'Orange'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is blood?', answers: ['Red', 'Blue', 'Purple'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is coal?', answers: ['Black', 'Grey', 'Brown'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'How many legs does a cat have?', answers: ['4', '2', '6'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'How many days in a week?', answers: ['7', '5', '6'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'How many months in a year?', answers: ['12', '10', '11'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'How many hours in a day?', answers: ['24', '12', '48'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What do bees make?', answers: ['Honey', 'Milk', 'Wax'], correctIndex: 0, category: 'B', obvious: true },
  { q: 'What color is a stop sign?', answers: ['Red', 'Orange', 'Yellow'], correctIndex: 0, category: 'B', obvious: true },

  // Category C: Geography / World
  { q: 'What continent is France in?', answers: ['Europe', 'Asia', 'Africa'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What ocean is the largest?', answers: ['Pacific', 'Atlantic', 'Indian'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What is the capital of Japan?', answers: ['Tokyo', 'Seoul', 'Beijing'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What country is the Eiffel Tower in?', answers: ['France', 'Germany', 'Italy'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What is the capital of Australia?', answers: ['Canberra', 'Sydney', 'Melbourne'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What direction does the sun rise?', answers: ['East', 'West', 'North'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'How many continents are there?', answers: ['7', '6', '8'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'Largest planet in our solar system?', answers: ['Jupiter', 'Saturn', 'Neptune'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What is H2O commonly known as?', answers: ['Water', 'Oxygen', 'Salt'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'On which continent is Egypt?', answers: ['Africa', 'Asia', 'Europe'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What country has the most people?', answers: ['China', 'India', 'USA'], correctIndex: 0, category: 'C', obvious: false },
  { q: 'What is the tallest mountain?', answers: ['Everest', 'K2', 'Kilimanjaro'], correctIndex: 0, category: 'C', obvious: false },

  // Category D: Pop Culture / Common Knowledge
  { q: 'How many strings on a guitar?', answers: ['6', '4', '8'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What animal is Dumbo?', answers: ['Elephant', 'Mouse', 'Dog'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What color is the Grinch?', answers: ['Green', 'Blue', 'Red'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'Players on a basketball court?', answers: ['5', '6', '4'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What do you call a baby dog?', answers: ['Puppy', 'Kitten', 'Cub'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'Fastest land animal?', answers: ['Cheetah', 'Lion', 'Horse'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What color are Smurfs?', answers: ['Blue', 'Green', 'Purple'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'Black and white keys instrument?', answers: ['Piano', 'Guitar', 'Drums'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'How many sides does a triangle have?', answers: ['3', '4', '5'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What sound does a duck make?', answers: ['Quack', 'Moo', 'Woof'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What is the opposite of cold?', answers: ['Hot', 'Warm', 'Cool'], correctIndex: 0, category: 'D', obvious: false },
  { q: 'What shape is a soccer ball made of?', answers: ['Hexagons', 'Squares', 'Triangles'], correctIndex: 0, category: 'D', obvious: false },

  // Category E: Trick Phrasing (stage 7+)
  { q: 'The WRONG answer to 2+2 is?', answers: ['5', '4', '3'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is NOT a primary color?', answers: ['Green', 'Red', 'Blue'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which planet is NOT in our solar system?', answers: ['Vulcan', 'Mars', 'Venus'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which animal does NOT have 4 legs?', answers: ['Fish', 'Dog', 'Cat'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which number is NOT even?', answers: ['7', '2', '4'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is NOT a day of the week?', answers: ['Funday', 'Monday', 'Friday'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is the WRONG spelling?', answers: ['Recieve', 'Receive', 'Correct'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which animal does NOT lay eggs?', answers: ['Dog', 'Bird', 'Snake'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is NOT a continent?', answers: ['Oceanus', 'Africa', 'Asia'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which color is NOT in a rainbow?', answers: ['Pink', 'Red', 'Blue'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is NOT a musical note?', answers: ['Bop', 'Do', 'Re'], correctIndex: 0, category: 'E', obvious: false },
  { q: 'Which is NOT a planet?', answers: ['Moon', 'Earth', 'Mars'], correctIndex: 0, category: 'E', obvious: false }
];

// SVG assets
const SVG = {
  BRAIN: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 150 100"><ellipse cx="60" cy="50" rx="30" ry="28" fill="#E63946" stroke="#C0102A" stroke-width="2"/><ellipse cx="90" cy="50" rx="30" ry="28" fill="#E63946" stroke="#C0102A" stroke-width="2"/><line x1="75" y1="25" x2="75" y2="75" stroke="#C0102A" stroke-width="2"/><path d="M50,45 Q60,38 70,45" stroke="#C0102A" stroke-width="2" fill="none"/><path d="M80,45 Q90,38 100,45" stroke="#C0102A" stroke-width="2" fill="none"/><path d="M45,55 Q58,62 70,55" stroke="#C0102A" stroke-width="2" fill="none"/><path d="M80,55 Q92,62 104,55" stroke="#C0102A" stroke-width="2" fill="none"/></svg>`,
  STREAK_BADGE: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#FFD700" stroke="#E6C200" stroke-width="2"/></svg>`
};

const DEATH_MESSAGES = [
  'YOU KNEW THE ANSWER!',
  'YOUR BRAIN BETRAYED YOU!',
  'TOO SMART FOR YOUR OWN GOOD!',
  'KNOWLEDGE IS DEADLY!',
  'INSTINCT WINS AGAIN!'
];

const TIMEOUT_MESSAGES = [
  "TIME'S UP!",
  'TOO SLOW!',
  'TICK TOCK... BOOM!',
  'THE CLOCK WINS!'
];
