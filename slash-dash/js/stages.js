// Slash Dash - Stage Generation
function getTypeWeights(stageNum) {
  if (stageNum <= 3) return { red: 1.0, blue: 0.0 };
  if (stageNum <= 5) return { red: 0.6, blue: 0.4 };
  return { red: 0.55, blue: 0.45 };
}

function generateSingleType(weights) {
  return Math.random() < weights.red ? 'red' : 'blue';
}

function generateEncounter(stageNum, weights, simultChance, poisonChance, isRest) {
  const w = GAME.CANVAS_W;
  const margin = 50;

  if (isRest) {
    const type = generateSingleType(weights);
    const x = margin + Math.random() * (w - margin * 2);
    return [{ type, x, poison: false }];
  }

  const isSimult = Math.random() < simultChance;
  if (isSimult) {
    const isPoisoned = Math.random() < poisonChance;
    const tripleChance = stageNum >= 11 ? Math.min((stageNum - 11) * 0.08, 0.5) : 0;
    const isTriple = Math.random() < tripleChance;

    if (isTriple) {
      const twoRed = Math.random() < 0.5;
      const types = twoRed ? ['red', 'red', 'blue'] : ['red', 'blue', 'blue'];
      const positions = [margin, w / 2, w - margin];
      return types.map((type, i) => ({
        type, x: positions[i] + (Math.random() - 0.5) * 30, poison: isPoisoned
      }));
    }
    const x1 = margin + Math.random() * (w / 2 - margin - 20);
    const x2 = w / 2 + 20 + Math.random() * (w / 2 - margin - 20);
    return [
      { type: 'red', x: x1, poison: isPoisoned },
      { type: 'blue', x: x2, poison: isPoisoned }
    ];
  }

  const type = generateSingleType(weights);
  const x = margin + Math.random() * (w - margin * 2);
  const isPoisoned = Math.random() < poisonChance;
  return [{ type, x, poison: isPoisoned }];
}

function generateStage(stageNum) {
  const seed = stageNum * 7919 + Date.now() % 100000;
  const weights = getTypeWeights(stageNum);
  const simultChance = getSimultChance(stageNum);
  const poisonChance = getPoisonChance(stageNum);
  const rest = isRestStage(stageNum);
  const encounters = [];
  let lastType = null;
  let sameCount = 0;

  // Guarantee at least 1 red and 1 blue in first 3 (if blue unlocked)
  const forceRed = stageNum > 3 ? Math.floor(Math.random() * 3) : -1;
  const forceBlue = stageNum > 3 ? (forceRed === 0 ? 1 : 0) : -1;

  for (let i = 0; i < GAME.OBJECTS_PER_STAGE; i++) {
    let enc = generateEncounter(stageNum, weights, simultChance, poisonChance, rest);

    // Force types for solvability
    if (i === forceRed && enc.length === 1) enc[0].type = 'red';
    if (i === forceBlue && enc.length === 1) enc[0].type = 'blue';

    // Variety threshold: no more than 4 consecutive same type
    if (enc.length === 1) {
      if (enc[0].type === lastType) {
        sameCount++;
        if (sameCount >= 4) {
          enc[0].type = enc[0].type === 'red' ? 'blue' : 'red';
          sameCount = 0;
        }
      } else {
        sameCount = 0;
      }
      lastType = enc[0].type;
    } else {
      sameCount = 0;
      lastType = null;
    }

    // First poison in a run at stage 15: solo, announced
    if (stageNum === 15 && i === 0 && poisonChance > 0) {
      enc = [{ type: generateSingleType(weights), x: GAME.CANVAS_W / 2, poison: true, announce: true }];
    }

    encounters.push(enc);
  }

  return {
    encounters,
    gapMs: getGapMs(stageNum),
    speedPxPerSec: getSpeed(stageNum),
    stageNum
  };
}
