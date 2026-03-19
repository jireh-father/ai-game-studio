// Torque Tower - Stage Generation
function getStageConfig(stageNum) {
  const fallDuration = Math.max(800, 2500 - (stageNum - 1) * 20);
  const maxSpin = Math.min(180, 60 + (stageNum - 1) * 10);
  const isRestStage = (stageNum % 5 === 0);

  let weights;
  if (stageNum <= 6)       weights = { standard: 100, narrow: 0, heavy: 0, light: 0 };
  else if (stageNum <= 10) weights = { standard: 70, narrow: 30, heavy: 0, light: 0 };
  else if (stageNum <= 15) weights = { standard: 50, narrow: 30, heavy: 20, light: 0 };
  else if (stageNum <= 20) weights = { standard: 40, narrow: 25, heavy: 15, light: 20 };
  else                     weights = { standard: 30, narrow: 25, heavy: 22, light: 23 };

  return {
    fallDuration,
    maxSpin: isRestStage ? Math.floor(maxSpin / 2) : maxSpin,
    blockTypeWeights: weights,
    isRestStage
  };
}

function getBlockTypeForStage(stageNum, blockIndex) {
  // Milestone introductions
  if (stageNum === 10 && blockIndex === 2) return 'narrow';
  if (stageNum === 15 && blockIndex === 2) return 'heavy';
  if (stageNum === 20 && blockIndex === 2) return 'light';

  const config = getStageConfig(stageNum);
  const w = config.blockTypeWeights;
  const total = w.standard + w.narrow + w.heavy + w.light;
  const seed = stageNum * 7919 + blockIndex * 131 + Date.now() % 100000;
  const rand = ((seed * 16807) % 2147483647) / 2147483647;
  const roll = rand * total;

  let acc = 0;
  if ((acc += w.standard) >= roll) return 'standard';
  if ((acc += w.narrow) >= roll) return 'narrow';
  if ((acc += w.heavy) >= roll) return 'heavy';
  return 'light';
}

function generateBlockSpin(stageNum, blockIndex) {
  const config = getStageConfig(stageNum);
  const seed = stageNum * 3571 + blockIndex * 257 + Date.now() % 100000;
  const rand = ((seed * 16807) % 2147483647) / 2147483647;
  const spin = (rand * 2 - 1) * config.maxSpin;
  // Ensure minimum spin so idle player always gets angle
  const minSpin = 30;
  if (Math.abs(spin) < minSpin) {
    return spin >= 0 ? minSpin : -minSpin;
  }
  return spin;
}
