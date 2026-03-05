// Microwave Roulette - Stage Generation
const StageGen = {
  lastCategory: null,

  generate(stageNum) {
    const isBoss = stageNum >= 10 && stageNum % 10 === 0;
    const isRest = stageNum % 8 === 0 && !isBoss;

    let speed = Math.min(CONFIG.TIMER.BASE_SPEED + stageNum * CONFIG.TIMER.SPEED_INC, CONFIG.TIMER.MAX_SPEED);
    let arc = Math.max(CONFIG.TIMER.MIN_ARC, CONFIG.TIMER.BASE_ARC - stageNum * CONFIG.TIMER.ARC_DEC);
    let zoneCount = 1;
    if (stageNum >= 26) zoneCount = 2 + (Math.random() < 0.4 ? 1 : 0);
    else if (stageNum >= 11) zoneCount = 1 + (Math.random() < 0.5 ? 1 : 0);

    let zoneMovement = 0;
    if (stageNum >= 16) {
      zoneMovement = Math.min(stageNum * 0.3, 3);
    }

    let reverseTimer = false;
    if (stageNum >= 36) reverseTimer = Math.random() < 0.5;
    else if (stageNum >= 26) reverseTimer = Math.random() < 0.3;

    let distractionLevel = 0;
    if (stageNum >= 31) distractionLevel = 3;
    else if (stageNum >= 16) distractionLevel = 2;
    else if (stageNum >= 6) distractionLevel = 1;

    // Rest stage easing
    if (isRest) {
      arc = Math.min(arc + 20, 90);
      speed = Math.max(speed - 0.2, 1.0);
      zoneCount = 1;
      zoneMovement = 0;
    }

    // Boss overrides
    let bossType = null;
    let item;
    if (isBoss) {
      const bossItems = ITEM_DB.filter(i => i.cat === 'boss' && stageNum >= i.minStage);
      item = bossItems[Math.floor(Math.random() * bossItems.length)] || ITEM_DB.find(i => i.cat === 'boss');
      bossType = item.bossType;
      zoneCount = bossType === 'triple' ? 3 : 1;
      arc = Math.max(30, arc);
    } else {
      item = this.pickItem(stageNum);
    }

    const greenZones = [];
    for (let i = 0; i < zoneCount; i++) {
      greenZones.push({
        angle: Math.random() * 360,
        arc: arc,
        movementSpeed: zoneMovement,
        movementDir: Math.random() < 0.5 ? 1 : -1,
      });
    }

    return {
      stageNum, item, speed, arc, greenZones, zoneCount,
      zoneMovement, reverseTimer, distractionLevel,
      isBoss, bossType, isRest,
    };
  },

  pickItem(stageNum) {
    const pool = ITEM_DB.filter(i =>
      i.cat !== 'boss' && stageNum >= i.minStage && stageNum <= i.maxStage && i.cat !== this.lastCategory
    );
    if (pool.length === 0) {
      const fallback = ITEM_DB.filter(i => i.cat !== 'boss' && stageNum >= i.minStage);
      const item = fallback[Math.floor(Math.random() * fallback.length)];
      this.lastCategory = item.cat;
      return item;
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.lastCategory = item.cat;
    return item;
  },

  getTimerDuration(speed) {
    return 1000 / speed; // ms per revolution
  },
};
