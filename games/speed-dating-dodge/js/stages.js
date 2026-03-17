// Speed Dating Dodge — Date Generation & Difficulty
const DateGenerator = {
  usedQuestionIds: [],

  reset() {
    this.usedQuestionIds = [];
  },

  getTimerDuration(dateNum) {
    let ms = 1500;
    for (const row of CONFIG.TIMER_TABLE) {
      if (dateNum >= row.min && dateNum <= row.max) { ms = row.ms; break; }
    }
    // Breather date: every 5th date gets bonus time
    if (dateNum > 0 && dateNum % 5 === 0) ms += CONFIG.BREATHER_BONUS_MS;
    return ms;
  },

  getLandminePct(dateNum) {
    for (const row of CONFIG.LANDMINE_TABLE) {
      if (dateNum >= row.min && dateNum <= row.max) return row.pct;
    }
    return 0.5;
  },

  getQuestionsPerDate(dateNum) {
    for (const row of CONFIG.QUESTIONS_TABLE) {
      if (dateNum >= row.min && dateNum <= row.max) return row.count;
    }
    return 5;
  },

  getDifficultyTier(dateNum) {
    return Math.min(5, Math.floor((dateNum - 1) / 6) + 1);
  },

  getPersonalityType(dateNum) {
    if (dateNum <= CONFIG.EARLY_DATE_LIMIT) {
      return CONFIG.EARLY_TYPES[Math.floor(Math.random() * CONFIG.EARLY_TYPES.length)];
    }
    return CONFIG.PERSONALITY_TYPES[Math.floor(Math.random() * CONFIG.PERSONALITY_TYPES.length)];
  },

  selectQuestions(personalityType, count, dateNum) {
    const tier = this.getDifficultyTier(dateNum);
    const landminePct = this.getLandminePct(dateNum);
    const selected = [];
    const recentIds = this.usedQuestionIds.slice(-CONFIG.QUESTION_ROTATION * count);

    for (let i = 0; i < count; i++) {
      const wantLandmine = Math.random() < landminePct;
      let pool = QUESTION_BANK.filter(q =>
        q.tier <= tier &&
        q.is_landmine === wantLandmine &&
        !recentIds.includes(q.id) &&
        !selected.find(s => s.id === q.id)
      );

      // Fallback: relax landmine constraint
      if (pool.length === 0) {
        pool = QUESTION_BANK.filter(q =>
          q.tier <= tier &&
          !recentIds.includes(q.id) &&
          !selected.find(s => s.id === q.id)
        );
      }
      // Fallback: any unused question
      if (pool.length === 0) {
        pool = QUESTION_BANK.filter(q => !selected.find(s => s.id === q.id));
      }

      const q = pool[Math.floor(Math.random() * pool.length)];
      selected.push(q);
    }

    selected.forEach(q => this.usedQuestionIds.push(q.id));
    // Trim rotation buffer
    if (this.usedQuestionIds.length > CONFIG.QUESTION_ROTATION * 10) {
      this.usedQuestionIds = this.usedQuestionIds.slice(-CONFIG.QUESTION_ROTATION * 5);
    }

    return selected;
  },

  getCorrectAnswer(question, personalityType) {
    // Right answer is "safe" for the personality type
    if (question.safe_for.includes(personalityType)) return 'right';
    if (question.red_flag_for.includes(personalityType)) return 'left';
    // Neutral: random with session entropy for variety
    return (Math.random() < 0.5) ? 'left' : 'right';
  },

  generateDate(dateNum) {
    const personalityType = this.getPersonalityType(dateNum);
    const numQuestions = this.getQuestionsPerDate(dateNum);
    const timerMs = this.getTimerDuration(dateNum);
    const questions = this.selectQuestions(personalityType, numQuestions, dateNum);
    const variant = CONFIG.AVATAR_VARIANTS[Math.floor(Math.random() * CONFIG.AVATAR_VARIANTS.length)];
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];

    return {
      personalityType,
      questions,
      timerMs,
      avatarColor: CONFIG.PERSONALITY_COLORS[personalityType],
      avatarVariant: variant,
      name,
      dateNum
    };
  }
};
