// stages.js — Stage data table and progression logic
const Stages = {
  getData(stageNum) {
    const s = Math.max(1, stageNum);
    const grills = s <= 2 ? 1 : s <= 4 ? 2 : s <= 6 ? 3 : 4;
    const cookTime = Math.max(3.5, 8 - (s * 0.4));
    const flipZone = Math.max(0.18, 0.42 - (s * 0.028));
    const target = 5 + (s * 2);
    const hasDouble = s >= 2;
    const hasHotGrill = s >= 4;
    const speedRush = s >= 8;
    const spawnInterval = s <= 2 ? 99 : s <= 4 ? 8 : s <= 6 ? 6 : 5;
    return { stageNum: s, grills, cookTime, flipZone, target, hasDouble, hasHotGrill, speedRush, spawnInterval };
  },

  getFlipZoneRange(flipZoneWidth) {
    const start = 0.5 - flipZoneWidth / 2;
    const end = 0.5 + flipZoneWidth / 2;
    return { start, end };
  },

  gradeFlip(progress, flipZone) {
    const range = this.getFlipZoneRange(flipZone);
    if (progress < range.start * 0.75) return 'MISS';
    if (progress < range.start) return 'LATE';
    const perfectCenter = 0.5;
    const perfectHalf = flipZone * 0.25;
    if (progress >= perfectCenter - perfectHalf && progress <= perfectCenter + perfectHalf) return 'PERFECT';
    if (progress <= range.end) return 'GOOD';
    if (progress <= range.end + (1 - range.end) * 0.5) return 'LATE';
    return 'MISS';
  },

  getComboMultiplier(combo) {
    return Math.min(Math.floor(combo / 3) + 1, CONFIG.COMBO_MAX_MULTI);
  }
};
