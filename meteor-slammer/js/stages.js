const StageManager = {
  currentWave: [],
  meteorsInWave: 0,
  meteorsResolved: 0,
  meteorsLanded: 0,
  stageTransitioning: false,

  getDifficultyTier(n) {
    return Math.min(Math.floor((n - 1) / 5), DIFFICULTY.length - 1);
  },

  generateWave(stageNumber) {
    const tier = this.getDifficultyTier(stageNumber);
    const d = DIFFICULTY[tier];
    const isRestStage = stageNumber % 10 === 0;
    const seed = stageNumber * 7919 + Date.now() % 100000;
    const rng = this._seededRng(seed);

    let waveSize = d.waveMin + Math.floor(rng() * (d.waveMax - d.waveMin + 1));
    let speed = d.meteorSpeed * (1 + (stageNumber - 1) * 0.04);
    speed = Math.min(speed, 560);
    let interval = d.spawnInterval;

    if (isRestStage) {
      speed *= 0.8;
      waveSize = Math.max(waveSize - 2, 4);
    }

    const lanes = [0.16, 0.28, 0.50, 0.72, 0.84];
    const wave = [];
    let delay = 500;

    const fireChance = stageNumber >= 7 ? Math.min(0.1 + (stageNumber - 7) * 0.02, 0.35) : 0;
    const iceChance = stageNumber >= 11 ? Math.min(0.08 + (stageNumber - 11) * 0.015, 0.25) : 0;
    const goldChance = stageNumber >= 16 ? Math.min(0.05 + (stageNumber - 16) * 0.01, 0.15) : 0;
    const hasBoss = stageNumber % 10 === 0 && stageNumber >= 10;

    if (hasBoss) {
      wave.push({ delay_ms: delay, laneRatio: 0.5, type: 'boss', speed: speed * 0.7, hp: 3 });
      delay += interval * 1.5;
    }

    for (let i = 0; i < waveSize; i++) {
      const laneIdx = Math.floor(rng() * lanes.length);
      const laneRatio = lanes[laneIdx];
      let type = 'normal';
      const roll = rng();
      if (roll < fireChance) type = 'fire';
      else if (roll < fireChance + iceChance) type = 'ice';
      else if (roll < fireChance + iceChance + goldChance) type = 'gold';
      if (isRestStage && i === 0 && type === 'normal') type = 'gold';

      wave.push({ delay_ms: delay, laneRatio, type, speed, hp: 1 });

      const simultaneous = Math.min(1 + Math.floor(stageNumber / 4), d.maxSimul);
      if (simultaneous > 1 && rng() < 0.4 && i < waveSize - 1) {
        i++;
        const lane2 = lanes[(laneIdx + 2) % lanes.length];
        wave.push({ delay_ms: delay + 50, laneRatio: lane2, type: 'normal', speed, hp: 1 });
      }
      delay += interval + Math.floor(rng() * 300);
    }

    this.currentWave = wave;
    this.meteorsInWave = wave.length;
    this.meteorsResolved = 0;
    this.meteorsLanded = 0;
    this.stageTransitioning = false;
    return wave;
  },

  meteorResolved(landed) {
    this.meteorsResolved++;
    if (landed) this.meteorsLanded++;
  },

  isWaveComplete() {
    return this.meteorsResolved >= this.meteorsInWave;
  },

  isCleanSweep() {
    return this.meteorsLanded === 0;
  },

  splitFireMeteor(meteor, gameWidth) {
    const baseSpeed = meteor.speed || 200;
    const cx = meteor.x;
    const cy = meteor.y;
    const children = [];
    for (let i = 0; i < 2; i++) {
      const offsetX = i === 0 ? -40 : 40;
      children.push({
        x: Phaser.Math.Clamp(cx + offsetX, 20, gameWidth - 20),
        y: cy,
        type: 'fire_child',
        speed: baseSpeed * 1.3,
        hp: 1
      });
    }
    this.meteorsInWave += 2;
    return children;
  },

  _seededRng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
};
