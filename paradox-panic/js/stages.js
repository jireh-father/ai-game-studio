// Paradox Panic - Stage Generation & Card Factory
const Stages = {
  lastCards: [],     // track last N card types for spacing rules
  correctCount: 0,
  breatherRemaining: 0,

  reset() {
    this.lastCards = [];
    this.correctCount = 0;
    this.breatherRemaining = 0;
  },

  getStageNumber() {
    return Math.floor(this.correctCount / GAME_CONFIG.correctPerStage);
  },

  getDifficulty(stageNum) {
    let diff = DIFFICULTY.stages[0];
    for (let i = DIFFICULTY.stages.length - 1; i >= 0; i--) {
      if (stageNum >= DIFFICULTY.stages[i].minStage) {
        diff = DIFFICULTY.stages[i];
        break;
      }
    }
    return diff;
  },

  getUnlockedParadoxes(stageNum) {
    return PARADOX_POOL.filter(p => p.unlockStage <= stageNum);
  },

  getUnlockedNearParadoxes(stageNum) {
    if (stageNum < 5) return [];
    return NEAR_PARADOX_POOL.filter(p => p.unlockStage <= stageNum);
  },

  onCorrect() {
    this.correctCount++;
    // Rest cadence: every 15 correct, queue 3 breather cards
    if (this.correctCount > 0 && this.correctCount % 15 === 0) {
      this.breatherRemaining = 3;
    }
  },

  generateCard() {
    const stageNum = this.getStageNumber();
    const diff = this.getDifficulty(stageNum);
    const entropy = Date.now() % 100000;

    // Breather cards: simple TRUE/FALSE
    if (this.breatherRemaining > 0) {
      this.breatherRemaining--;
      return this._generateSimpleCard();
    }

    // Paradox spacing: no 2 consecutive paradox cards
    const lastWasParadox = this.lastCards.length > 0 && this.lastCards[this.lastCards.length - 1] === 'PARADOX';
    const secondLastWasParadox = this.lastCards.length > 1 && this.lastCards[this.lastCards.length - 2] === 'PARADOX';

    // Variety: no more than 3 consecutive same type
    const last3Same = this.lastCards.length >= 3 &&
      this.lastCards[this.lastCards.length - 1] === this.lastCards[this.lastCards.length - 2] &&
      this.lastCards[this.lastCards.length - 2] === this.lastCards[this.lastCards.length - 3];

    let roll = Math.random();

    // Near-paradox distractor chance (stage 5+)
    const nearParadoxes = this.getUnlockedNearParadoxes(stageNum);
    const nearParadoxChance = nearParadoxes.length > 0 ? 0.12 : 0;

    // Try paradox
    if (!lastWasParadox && roll < diff.paradoxChance) {
      const pool = this.getUnlockedParadoxes(stageNum);
      if (pool.length > 0) {
        const p = pool[Math.floor(Math.random() * pool.length)];
        this._pushType('PARADOX');
        return { text: p.text, answer: 'PARADOX', type: 'PARADOX', arrivalTime: Date.now() };
      }
    }

    // Try near-paradox
    roll = Math.random();
    if (roll < nearParadoxChance && nearParadoxes.length > 0) {
      const np = nearParadoxes[Math.floor(Math.random() * nearParadoxes.length)];
      this._pushType(np.answer);
      return { text: np.text, answer: np.answer, type: 'NEAR_PARADOX', arrivalTime: Date.now() };
    }

    // TRUE or FALSE (50/50, with variety guard)
    let cardType = Math.random() < 0.5 ? 'TRUE' : 'FALSE';
    if (last3Same) {
      cardType = this.lastCards[this.lastCards.length - 1] === 'TRUE' ? 'FALSE' : 'TRUE';
    }

    if (cardType === 'TRUE') {
      const template = TRUE_TEMPLATES[Math.floor(Math.random() * TRUE_TEMPLATES.length)];
      const text = template();
      this._pushType('TRUE');
      return { text, answer: 'TRUE', type: 'TRUE', arrivalTime: Date.now() };
    } else {
      const template = FALSE_TEMPLATES[Math.floor(Math.random() * FALSE_TEMPLATES.length)];
      const text = template();
      this._pushType('FALSE');
      return { text, answer: 'FALSE', type: 'FALSE', arrivalTime: Date.now() };
    }
  },

  _generateSimpleCard() {
    const cardType = Math.random() < 0.5 ? 'TRUE' : 'FALSE';
    const pool = cardType === 'TRUE' ? TRUE_TEMPLATES : FALSE_TEMPLATES;
    const template = pool[Math.floor(Math.random() * pool.length)];
    this._pushType(cardType);
    return { text: template(), answer: cardType, type: cardType, arrivalTime: Date.now() };
  },

  _pushType(type) {
    this.lastCards.push(type);
    if (this.lastCards.length > 5) this.lastCards.shift();
  }
};
