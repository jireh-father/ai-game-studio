// Zeno's Dash - Stage Generation (pure functions, uses config.js constants)

function loadStageParams(stageNumber) {
  const params = getStageParams(stageNumber);
  const parTaps = getParTaps(params.startGap, params.closeEnough);
  const milestone = isMilestoneStage(stageNumber);
  return Object.assign(params, { parTaps, milestone, stageNumber });
}

function calculateStageScore(stageNumber, tapCount, parTaps, timeMarginSec) {
  const baseScore = SCORE.stageBase * stageNumber;
  const tapsUnderPar = Math.max(0, parTaps - tapCount);
  const efficiencyBonus = tapsUnderPar * SCORE.efficiencyBonus;
  const speedBonus = Math.max(0, Math.floor(timeMarginSec)) * SCORE.speedBonus;
  return baseScore + efficiencyBonus + speedBonus;
}

function getBgColor(stageNumber) {
  if (!isMilestoneStage(stageNumber)) return COLORS.bg;
  const idx = Math.floor(stageNumber / 5) % BG_PALETTES.length;
  return BG_PALETTES[idx];
}
