// Melt Stack - Stage Generation
function getStageParams(stageNumber) {
  const S = stageNumber;
  return {
    blockSpeedPxPerS: Math.min(Math.max(180 + S * 15, 180), 480),
    meltDurationMs: Math.min(Math.max(8000 - S * 180, 2500), 8000),
    startWidthPx: Math.min(Math.max(240 - S * 3, 80), 240),
    isCoolStage: S > 0 && S % 5 === 0
  };
}

function getNextBlockWidth(currentWidth, overhangPx) {
  return Math.max(currentWidth - Math.abs(overhangPx), 0);
}

function isNewStage(blockCount) {
  return blockCount > 0 && blockCount % BLOCKS_PER_STAGE === 0;
}

function getEffectiveMeltMs(meltDurationMs, blockWidth) {
  return meltDurationMs * (blockWidth / INITIAL_WIDTH);
}
