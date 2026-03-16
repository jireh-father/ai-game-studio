// stages.js - Case generation: procedural crime/suspect/clue puzzle creation

// Simple seeded LCG random
function seededRandom(seed) {
  let s = (seed * 1103515245 + 12345) & 0x7fffffff;
  return {
    next: function() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return (s >>> 0) / 0x7fffffff;
    }
  };
}

function fisherYates(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isRestStage(caseNum) {
  return caseNum > 1 && caseNum % 10 === 0;
}

function isBossStage(caseNum) {
  return caseNum % 25 === 0;
}

function generateCase(caseNumber, sessionSalt) {
  const salt = sessionSalt || 0;

  // Rest stages: easy breather
  if (isRestStage(caseNumber)) {
    return generateSimpleCase(caseNumber, salt);
  }

  // Boss stages: hardest
  if (isBossStage(caseNumber)) {
    return generateBossCase(caseNumber, salt);
  }

  const tier = getDifficultyTier(caseNumber);
  const diff = DIFFICULTY[tier];

  // Try up to 3 seeds
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = tryGenerateCase(caseNumber, salt + attempt, diff);
    if (result) return result;
  }

  // Fallback: simple case
  return generateSimpleCase(caseNumber, salt);
}

function generateSimpleCase(caseNumber, salt) {
  const rng = seededRandom(caseNumber * 31 + salt);
  const crimeIdx = Math.floor(rng.next() * CRIMES.length);
  const crime = CRIMES[crimeIdx];
  const animals = fisherYates(ANIMALS, rng).slice(0, 2);
  const guiltyIdx = 0;

  const cat0 = crime.categories[0];
  const cat1 = crime.categories.length > 1 ? crime.categories[1] : crime.categories[0];

  const suspects = animals.map((animal, i) => {
    if (i === guiltyIdx) {
      return {
        animalKey: 'suspect-' + animal,
        name: animal.charAt(0).toUpperCase() + animal.slice(1),
        clues: [
          makeClue(cat0, true, rng),
          makeClue(cat1, true, rng)
        ],
        isGuilty: true
      };
    } else {
      return {
        animalKey: 'suspect-' + animal,
        name: animal.charAt(0).toUpperCase() + animal.slice(1),
        clues: [
          makeClue(cat0, false, rng),
          makeClue(cat1, false, rng)
        ],
        isGuilty: false
      };
    }
  });

  const shuffled = fisherYates(suspects, seededRandom(caseNumber * 13 + salt));
  const guiltyFinalIdx = shuffled.findIndex(s => s.isGuilty);

  return {
    caseNumber,
    crime,
    suspects: shuffled,
    guiltySuspectIndex: guiltyFinalIdx,
    timerSeconds: 15,
    tier: 0,
    isRest: true,
    isBoss: false
  };
}

function generateBossCase(caseNumber, salt) {
  const diff = { suspectCount: 5, timerSeconds: 8, cluesPerSuspect: 3, redHerrings: 4, inversion: true };
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = tryGenerateCase(caseNumber, salt + attempt, diff);
    if (result) {
      result.isBoss = true;
      return result;
    }
  }
  return generateSimpleCase(caseNumber, salt);
}

function tryGenerateCase(caseNumber, salt, diff) {
  const rng = seededRandom(caseNumber * 7 + salt);
  const crimeIdx = Math.floor(rng.next() * CRIMES.length);
  const crime = CRIMES[crimeIdx];
  const count = diff.suspectCount;
  const animals = fisherYates(ANIMALS, rng).slice(0, count);
  const guiltyIdx = Math.floor(rng.next() * count);
  const reqCats = crime.categories;
  let redBudget = diff.redHerrings;

  const suspects = [];

  for (let i = 0; i < count; i++) {
    const animal = animals[i];
    const isGuilty = (i === guiltyIdx);
    const clues = [];
    const numClues = diff.cluesPerSuspect;

    if (isGuilty) {
      // Guilty: match ALL required categories
      for (let c = 0; c < numClues; c++) {
        const cat = reqCats[c % reqCats.length];
        clues.push(makeClue(cat, true, rng));
      }
    } else {
      // Innocent: must fail at least one required category
      // Decide which category to fail
      const failCatIdx = Math.floor(rng.next() * reqCats.length);
      for (let c = 0; c < numClues; c++) {
        const cat = reqCats[c % reqCats.length];
        if (c === failCatIdx) {
          // This one doesn't match
          clues.push(makeClue(cat, false, rng));
        } else if (redBudget > 0 && rng.next() > 0.5) {
          // Red herring: matching clue on innocent
          clues.push(makeClue(cat, true, rng));
          clues[clues.length - 1].isRedHerring = true;
          redBudget--;
        } else {
          clues.push(makeClue(cat, false, rng));
        }
      }
    }

    suspects.push({
      animalKey: 'suspect-' + animal,
      name: animal.charAt(0).toUpperCase() + animal.slice(1),
      clues,
      isGuilty
    });
  }

  // Validate: exactly one guilty
  const guiltyCount = suspects.filter(s => s.isGuilty).length;
  if (guiltyCount !== 1) return null;

  const shuffled = fisherYates(suspects, seededRandom(caseNumber * 13 + salt));
  const guiltyFinalIdx = shuffled.findIndex(s => s.isGuilty);

  return {
    caseNumber,
    crime,
    suspects: shuffled,
    guiltySuspectIndex: guiltyFinalIdx,
    timerSeconds: diff.timerSeconds,
    tier: getDifficultyTier(caseNumber),
    isRest: false,
    isBoss: false
  };
}

function makeClue(category, matching, rng) {
  const labels = CLUE_LABELS[category];
  const labelIdx = Math.floor(rng.next() * labels.length);
  return {
    iconKey: CLUE_ICONS[category],
    label: labels[labelIdx],
    category,
    matching,
    isRedHerring: false
  };
}
