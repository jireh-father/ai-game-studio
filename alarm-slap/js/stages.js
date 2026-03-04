// stages.js — Stage generation, difficulty scaling, alarm spawn patterns

const StageManager = {
  getDifficultyScalar(s) {
    return Math.min(1.0, s / 50);
  },

  getStageConfig(stageNum) {
    const s = stageNum;
    const d = this.getDifficultyScalar(s);
    const isRestStage = s > 1 && s % 8 === 0;
    const isStormStage = s > 1 && s % 15 === 0;

    if (isRestStage) {
      return {
        stageNum: s, alarmCount: 1, ringTimeSec: 7, speedPx: 0,
        moverRatio: 0, mufflerChance: 0, splitterChance: 0,
        durationSec: 10, isRestStage: true, isStormStage: false,
        spawnInterval: 3000,
      };
    }

    let alarmCount = Math.floor(1 + d * 4);
    let ringTimeSec = Math.max(1.5, 7.0 - d * 5.5);
    let speedPx = s <= 3 ? 0 : 40 + d * 160;
    let moverRatio = s <= 3 ? 0 : Math.min(0.8, (s - 3) * 0.05);
    let mufflerChance = s <= 6 ? 0 : Math.min(0.25, (s - 6) * 0.025);
    let splitterChance = s <= 40 ? 0 : Math.min(0.30, (s - 40) * 0.02);
    let durationSec = Math.max(10, 25 - d * 15);

    if (isStormStage) {
      alarmCount = Math.min(8, alarmCount * 2);
      durationSec = 8;
    }

    // Spawn interval: how often new alarms appear (ms)
    const spawnInterval = Math.max(600, 2500 - d * 1800);

    return {
      stageNum: s, alarmCount, ringTimeSec, speedPx,
      moverRatio, mufflerChance, splitterChance,
      durationSec, isRestStage, isStormStage, spawnInterval,
    };
  },

  pickAlarmType(stageConfig) {
    const r = Math.random();
    const { moverRatio, mufflerChance, splitterChance, stageNum } = stageConfig;

    if (r < splitterChance) return CONFIG.ALARM_TYPES.SPLITTER;
    if (r < splitterChance + mufflerChance) return CONFIG.ALARM_TYPES.MUFFLER;
    if (r < splitterChance + mufflerChance + moverRatio) {
      if (stageNum >= 11 && Math.random() < 0.3) return CONFIG.ALARM_TYPES.BOUNCER;
      if (stageConfig.speedPx > 100) return CONFIG.ALARM_TYPES.FAST_MOVER;
      return CONFIG.ALARM_TYPES.SLOW_MOVER;
    }
    return CONFIG.ALARM_TYPES.STATIONARY;
  },

  getSpawnPosition(type) {
    const pad = 40;
    const topY = CONFIG.HUD_TOP_HEIGHT + pad;
    const botY = CONFIG.GAME_HEIGHT - CONFIG.HUD_BOTTOM_HEIGHT - pad;
    const leftX = pad;
    const rightX = CONFIG.GAME_WIDTH - pad;

    if (type === CONFIG.ALARM_TYPES.STATIONARY || type === CONFIG.ALARM_TYPES.MUFFLER) {
      // Spawn anywhere in the play field
      return {
        x: leftX + Math.random() * (rightX - leftX),
        y: topY + Math.random() * (botY - topY),
      };
    }

    // Moving alarms spawn from edges
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: leftX + Math.random() * (rightX - leftX), y: topY }; // top
      case 1: return { x: leftX + Math.random() * (rightX - leftX), y: botY }; // bottom
      case 2: return { x: leftX, y: topY + Math.random() * (botY - topY) }; // left
      case 3: return { x: rightX, y: topY + Math.random() * (botY - topY) }; // right
      default: return { x: CONFIG.GAME_WIDTH / 2, y: CONFIG.GAME_HEIGHT / 2 };
    }
  },

  getAlarmVelocity(type, speedPx, spawnX, spawnY) {
    if (type === CONFIG.ALARM_TYPES.STATIONARY || type === CONFIG.ALARM_TYPES.MUFFLER) {
      return { vx: 0, vy: 0 };
    }

    // Aim toward center area with some randomness
    const cx = CONFIG.GAME_WIDTH / 2 + (Math.random() - 0.5) * 100;
    const cy = CONFIG.GAME_HEIGHT / 2 + (Math.random() - 0.5) * 80;
    const angle = Math.atan2(cy - spawnY, cx - spawnX);
    const spread = (Math.random() - 0.5) * 0.6; // slight angle variation
    const speed = type === CONFIG.ALARM_TYPES.FAST_MOVER ? speedPx : speedPx * 0.6;

    return {
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed,
    };
  },

  generateAlarmPattern(stageConfig) {
    const { alarmCount, durationSec, spawnInterval } = stageConfig;
    const totalSpawns = Math.floor((durationSec * 1000) / spawnInterval);
    const pattern = [];

    for (let i = 0; i < totalSpawns; i++) {
      const delay = i * spawnInterval + Math.random() * (spawnInterval * 0.3);
      const batchSize = Math.min(alarmCount, 1 + Math.floor(Math.random() * alarmCount));
      for (let j = 0; j < batchSize; j++) {
        const type = this.pickAlarmType(stageConfig);
        const pos = this.getSpawnPosition(type);
        const vel = this.getAlarmVelocity(type, stageConfig.speedPx, pos.x, pos.y);
        pattern.push({
          delay: delay + j * 200,
          type, x: pos.x, y: pos.y,
          vx: vel.vx, vy: vel.vy,
          ringTimeSec: stageConfig.ringTimeSec,
        });
      }
    }

    return pattern.sort((a, b) => a.delay - b.delay);
  },
};
