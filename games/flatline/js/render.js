// Flatline - Rendering & Effects (ECG drawing, particles, visual effects)

function getWaveformY(screenX, scrollOffset, scrollSpeed, beatEvents, stageConfig) {
  const msPerPx = 1000 / scrollSpeed;
  const timeAtX = (screenX + scrollOffset) * msPerPx;
  let y = ECG_Y;

  for (const beat of beatEvents) {
    const timeDist = Math.abs(timeAtX - beat.timeMs);
    const segmentMs = 60000 / stageConfig.bpm;

    if (timeDist < segmentMs * 0.6) {
      const height = beat.type === 'real' ? PEAK_HEIGHT : FALSE_PEAK_HEIGHT;
      const t = (timeAtX - beat.timeMs) / (segmentMs * 0.5);

      if (t >= -0.5 && t < -0.2) {
        const p = (t + 0.5) / 0.3;
        y -= Math.sin(p * Math.PI) * (height * 0.15);
      } else if (t >= -0.08 && t < -0.02) {
        y += height * 0.12;
      } else if (t >= -0.02 && t < 0.02) {
        const p = 1 - Math.abs(t) / 0.02;
        y -= height * p;
      } else if (t >= 0.02 && t < 0.08) {
        y += height * 0.15 * (1 - (t - 0.02) / 0.06);
      } else if (t >= 0.2 && t < 0.45) {
        const p = (t - 0.2) / 0.25;
        y -= Math.sin(p * Math.PI) * (height * 0.2);
      }
    }
  }
  return y;
}

function drawECG(gfx, width, scrollOffset, scrollSpeed, beatEvents, stageConfig, color) {
  gfx.clear();
  gfx.lineStyle(WAVEFORM.lineWidth, color, 1);
  gfx.beginPath();
  for (let x = 0; x < width; x += 2) {
    const y = getWaveformY(x, scrollOffset, scrollSpeed, beatEvents, stageConfig);
    if (x === 0) gfx.moveTo(x, y);
    else gfx.lineTo(x, y);
  }
  gfx.strokePath();
}

function drawTimingWindows(gfx, beats, beatIndex, gameTime, scrollSpeed, stageConfig, scrollOffset, gameWidth, introActive, gameOver) {
  gfx.clear();
  if (introActive || gameOver) return;

  for (let i = beatIndex; i < Math.min(beatIndex + 3, beats.length); i++) {
    const beat = beats[i];
    if (beat.resolved) continue;

    const msPerPx = 1000 / scrollSpeed;
    const peakScreenX = beat.timeMs / msPerPx - scrollOffset;
    const windowPx = calculateWindowPx(stageConfig.windowMs, scrollSpeed);

    if (peakScreenX < -windowPx || peakScreenX > gameWidth + windowPx) continue;

    const left = peakScreenX - windowPx / 2;
    const alpha = beat.type === 'real' ? COLORS.windowAlpha : 0.08;
    const borderColor = beat.type === 'real' ? COLORS.windowBorder : COLORS.falseBeat;

    gfx.fillStyle(COLORS.windowFill, alpha);
    gfx.fillRoundedRect(left, ECG_AREA_TOP, windowPx, ECG_AREA_BOTTOM - ECG_AREA_TOP, 4);
    gfx.lineStyle(1.5, borderColor, 0.7);
    gfx.strokeRoundedRect(left, ECG_AREA_TOP, windowPx, ECG_AREA_BOTTOM - ECG_AREA_TOP, 4);

    if (beat.type === 'real' && peakScreenX > 0 && peakScreenX < gameWidth) {
      const inWindow = gameTime >= beat.windowStartMs && gameTime <= beat.windowEndMs;
      if (inWindow) {
        const pulse = 0.15 + Math.sin(gameTime * 0.016) * 0.08;
        gfx.fillStyle(COLORS.windowFill, pulse);
        gfx.fillRoundedRect(left, ECG_AREA_TOP, windowPx, ECG_AREA_BOTTOM - ECG_AREA_TOP, 4);
      }
    }
  }
}

// Particle manager
class ParticleManager {
  constructor() { this.particles = []; }

  spawn(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 80 + Math.random() * 100;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 400, maxLife: 400, size: 2 + Math.random() * 2, color
      });
    }
  }

  update(gfx, delta) {
    gfx.clear();
    const dt = delta / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= delta;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      const alpha = p.life / p.maxLife;
      const s = p.size * alpha;
      gfx.fillStyle(p.color, alpha);
      gfx.fillCircle(p.x, p.y, s);
    }
  }

  clear() { this.particles = []; }
}
