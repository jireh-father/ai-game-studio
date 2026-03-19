// stages.js — Stage generation, question selection, answer shuffle

function getStageConfig(stageNumber) {
  const timerMs = DIFFICULTY.getTimerMs(stageNumber);
  const questionCount = DIFFICULTY.getQuestionCount(stageNumber);
  const obviousWeight = DIFFICULTY.getObviousWeight(stageNumber);
  const trickChance = DIFFICULTY.getTrickChance(stageNumber);
  const restBonus = DIFFICULTY.isRestStage(stageNumber) ? 500 : 0;
  return { timerMs: timerMs + restBonus, questionCount, obviousWeight, trickChance };
}

function selectQuestions(stageNumber, sessionSeed, usedIndices) {
  const config = getStageConfig(stageNumber);
  const allowTricks = stageNumber >= 7;

  // Build eligible pool
  let pool = QUESTIONS.map((q, i) => ({ ...q, originalIndex: i }))
    .filter(q => !usedIndices.has(q.originalIndex));

  // If pool exhausted, reset
  if (pool.length < config.questionCount) {
    usedIndices.clear();
    pool = QUESTIONS.map((q, i) => ({ ...q, originalIndex: i }));
  }

  // Separate by characteristics
  const obvious = pool.filter(q => q.obvious && q.category !== 'E');
  const normal = pool.filter(q => !q.obvious && q.category !== 'E');
  const tricks = pool.filter(q => q.category === 'E');

  // Early stages: only A and B categories
  let eligiblePool;
  if (stageNumber <= 3) {
    eligiblePool = pool.filter(q => q.category === 'A' || q.category === 'B');
  } else {
    eligiblePool = pool.filter(q => q.category !== 'E');
  }

  const selected = [];
  const usedInStage = new Set();

  for (let i = 0; i < config.questionCount; i++) {
    let candidate = null;
    const roll = Math.random();

    // Determine category preference
    if (allowTricks && roll < config.trickChance && tricks.length > 0) {
      candidate = pickRandom(tricks, usedInStage);
    } else if (roll < config.obviousWeight) {
      candidate = pickRandom(obvious.length > 0 ? obvious : eligiblePool, usedInStage);
    } else {
      candidate = pickRandom(normal.length > 0 ? normal : eligiblePool, usedInStage);
    }

    if (!candidate) {
      candidate = pickRandom(pool, usedInStage);
    }

    if (candidate) {
      selected.push(candidate);
      usedInStage.add(candidate.originalIndex);
      usedIndices.add(candidate.originalIndex);
    }
  }

  return selected;
}

function pickRandom(arr, excludeSet) {
  const eligible = arr.filter(q => !excludeSet.has(q.originalIndex));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// Fisher-Yates shuffle for answer positions
function shuffleAnswers(question) {
  const indices = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const displayAnswers = indices.map(i => question.answers[i]);
  const deathIndex = indices.indexOf(question.correctIndex);
  return { displayAnswers, deathIndex };
}
