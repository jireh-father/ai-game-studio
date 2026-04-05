// Monty's Goats - Stage Generation
const StageManager = {
  lastLieId: -1,

  generateRound(roundNumber, playerDoor) {
    const numDoors = this.getNumDoors(roundNumber);
    const variant = this.getVariant(roundNumber);
    const diff = this.getDifficulty(roundNumber);
    const seed = roundNumber * 7919 + Date.now() % 100000;

    // Random car position
    const carDoor = Math.floor(Math.random() * numDoors);

    // Monty reveals goat door(s) — not player's pick, not the car (unless Corrupt Monty)
    const revealDoors = this.getMontyReveals(numDoors, playerDoor, carDoor, variant);

    // Determine correct action
    const correctAction = this.computeCorrectAction(carDoor, playerDoor, variant, roundNumber);

    // Get lie text
    const lieData = this.getLie(roundNumber, diff.lieFrequency);

    // Goat hint
    let goatHint = null;
    if (roundNumber >= 11) {
      const hintAcc = this.getHintAccuracy(roundNumber);
      const truthful = Math.random() < hintAcc;
      goatHint = {
        text: truthful ? (correctAction === 'switch' ? 'Baa... SWITCH!' : 'Baa... STAY!') :
                         (correctAction === 'switch' ? 'Baa... STAY!' : 'Baa... SWITCH!'),
        isTruthful: truthful
      };
    }

    // Rest round every 10 rounds
    const isRestRound = roundNumber > 1 && roundNumber % 10 === 0;

    return {
      roundNumber,
      numDoors,
      carDoor,
      revealDoors,
      correctAction,
      lieText: isRestRound ? null : lieData.text,
      lieId: isRestRound ? -1 : lieData.id,
      variant: isRestRound ? 'classic' : variant,
      timerSeconds: diff.timerSeconds,
      goatHint: isRestRound ? null : goatHint,
      isRestRound
    };
  },

  getNumDoors(round) {
    if (round >= 16 && Math.random() < Math.min(0.4, (round - 15) * 0.04)) return 4;
    return 3;
  },

  getVariant(round) {
    if (round <= 5) return 'classic';
    if (round <= 10) return 'lies';
    if (round <= 15) return 'goatHints';
    if (round <= 20) {
      const r = Math.random();
      if (r < 0.3) return 'fourDoor';
      if (r < 0.5) return 'goatHints';
      return 'lies';
    }
    if (round <= 30) {
      const r = Math.random();
      if (r < 0.25) return 'migration';
      if (r < 0.45) return 'fourDoor';
      if (r < 0.65) return 'goatHints';
      return 'lies';
    }
    if (round <= 50) {
      const r = Math.random();
      if (r < 0.2) return 'corruptMonty';
      if (r < 0.4) return 'migration';
      if (r < 0.55) return 'fourDoor';
      if (r < 0.7) return 'goatHints';
      return 'lies';
    }
    // 51+: random mix
    const variants = ['classic', 'lies', 'goatHints', 'fourDoor', 'migration', 'corruptMonty'];
    return variants[Math.floor(Math.random() * variants.length)];
  },

  getMontyReveals(numDoors, playerDoor, carDoor, variant) {
    const candidates = [];
    for (let i = 0; i < numDoors; i++) {
      if (i !== playerDoor && i !== carDoor) candidates.push(i);
    }
    // Corrupt Monty: might reveal the car door
    if (variant === 'corruptMonty' && Math.random() < 0.3) {
      // Reveal a non-player door that IS the car (trick!)
      if (carDoor !== playerDoor) return [carDoor];
    }
    // Shuffle and pick
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    // 4-door: reveal 2, otherwise reveal 1
    const revealCount = numDoors === 4 ? 2 : 1;
    return candidates.slice(0, revealCount);
  },

  computeCorrectAction(carDoor, playerDoor, variant, roundNumber) {
    if (playerDoor === carDoor) return 'stay';
    return 'switch';
  },

  getLie(roundNumber, lieFreq) {
    if (Math.random() > lieFreq || roundNumber <= 5) {
      return { id: -1, text: null };
    }
    const available = LIE_POOL.filter(l => l.id !== this.lastLieId);
    const lie = available[Math.floor(Math.random() * available.length)];
    this.lastLieId = lie.id;
    return { id: lie.id, text: lie.text };
  },

  getDifficulty(roundNumber) {
    let timerSeconds = 8;
    for (const range of DIFFICULTY.timerByRange) {
      if (roundNumber >= range.min && roundNumber <= range.max) {
        timerSeconds = range.timer;
        break;
      }
    }
    let lieFrequency = 0;
    for (const range of DIFFICULTY.lieFrequency) {
      if (roundNumber >= range.min && roundNumber <= range.max) {
        lieFrequency = range.freq;
        break;
      }
    }
    return { timerSeconds, lieFrequency };
  },

  getHintAccuracy(roundNumber) {
    for (const range of DIFFICULTY.hintAccuracy) {
      if (roundNumber >= range.min && roundNumber <= range.max) return range.accuracy;
    }
    return 0.5;
  }
};
