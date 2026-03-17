// Flatline - Stage Generation (pure functions, no Phaser dependency)
function generateStage(stageNumber) {
  const isRestStage = stageNumber > 1 && stageNumber % 5 === 0;
  if (isRestStage) {
    return {
      bpm: 65, windowMs: 280, falseBeatRate: 0, arrhythmiaChance: 0,
      isRestStage: true, beatCount: 8, stageNumber
    };
  }
  const baseBpm = Math.min(140, 60 + stageNumber * 2.5);
  const bpmVariation = Math.min(0.25, stageNumber * 0.008);
  const windowMs = Math.max(80, 300 - stageNumber * 5.5);
  const falseBeatRate = Math.min(0.35, Math.max(0, (stageNumber - 6) * 0.025));
  const arrhythmiaChance = Math.min(0.5, Math.max(0, (stageNumber - 9) * 0.04));
  const beatCount = 8 + Math.min(4, Math.floor(stageNumber / 5));

  return {
    bpm: baseBpm, windowMs, falseBeatRate, arrhythmiaChance,
    bpmVariation, isRestStage: false, beatCount, stageNumber
  };
}

function generateBeatSequence(config) {
  const seed = config.stageNumber * 7919 + Date.now() % 100000;
  let rng = seed;
  function random() {
    rng = (rng * 16807 + 0) % 2147483647;
    return (rng & 0x7fffffff) / 0x7fffffff;
  }

  const baseInterval = 60000 / config.bpm;
  const beats = [];
  let timeMs = INTRO_DELAY_MS;
  const variation = config.bpmVariation || 0;

  // Generate real beats
  for (let i = 0; i < config.beatCount; i++) {
    const varFactor = 1 + (random() * 2 - 1) * variation;
    const interval = baseInterval * varFactor;
    const halfWindow = config.windowMs / 2;

    beats.push({
      type: 'real',
      timeMs: timeMs,
      windowStartMs: timeMs - halfWindow,
      windowEndMs: timeMs + halfWindow,
      resolved: false,
      index: beats.length
    });
    timeMs += interval;
  }

  // Apply arrhythmia bursts
  if (config.arrhythmiaChance > 0 && random() < config.arrhythmiaChance) {
    const burstStart = Math.floor(random() * Math.max(1, beats.length - 3)) + 1;
    const burstLen = 2 + Math.floor(random() * 2);
    for (let i = burstStart; i < Math.min(burstStart + burstLen, beats.length); i++) {
      const prev = beats[i - 1];
      const gap = beats[i].timeMs - prev.timeMs;
      const newGap = gap * 0.55;
      const shift = gap - newGap;
      for (let j = i; j < beats.length; j++) {
        beats[j].timeMs -= shift;
        beats[j].windowStartMs -= shift;
        beats[j].windowEndMs -= shift;
      }
      beats[i].isTachy = true;
    }
  }

  // Insert false beats between real beats
  if (config.falseBeatRate > 0) {
    const falseBeats = [];
    for (let i = 0; i < beats.length - 1; i++) {
      if (random() < config.falseBeatRate) {
        const gap = beats[i + 1].timeMs - beats[i].timeMs;
        const pos = 0.4 + random() * 0.3;
        const fTime = beats[i].timeMs + gap * pos;
        const halfW = config.windowMs / 2;
        // Check no overlap with real beats
        const tooClose = beats.some(b =>
          Math.abs(b.timeMs - fTime) < 150
        );
        if (!tooClose) {
          falseBeats.push({
            type: 'false',
            timeMs: fTime,
            windowStartMs: fTime - halfW,
            windowEndMs: fTime + halfW,
            resolved: false,
            index: 0
          });
        }
      }
    }
    beats.push(...falseBeats);
  }

  // Sort all beats by time
  beats.sort((a, b) => a.timeMs - b.timeMs);
  beats.forEach((b, i) => b.index = i);

  // Calculate total stage duration
  const lastBeat = beats[beats.length - 1];
  const stageDurationMs = lastBeat.windowEndMs + 500;

  return { beats, stageDurationMs, config };
}

function calculateWindowPx(windowMs, scrollSpeedPxPerSec) {
  return (windowMs / 1000) * scrollSpeedPxPerSec;
}

function getScrollSpeed(bpm) {
  return SCROLL_SPEED * (bpm / 60);
}
