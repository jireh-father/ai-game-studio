// stages.js - Obstacle generation, gap computation, mirror axis logic

function getMirrorAxis(stageNum) {
  if (stageNum <= 7) return 'vertical';
  if (stageNum <= 12) return 'horizontal';
  if (stageNum <= 20) return 'diagonal';
  return 'rotating';
}

function getScrollSpeed(stageNum) {
  const base = Math.min(4.0, 1.5 + stageNum * 0.1);
  if (isRestStage(stageNum)) return Math.max(1.2, base - 0.3);
  return base;
}

function getGapWidth(stageNum) {
  const base = Math.max(50, 100 - stageNum * 2.5);
  if (isRestStage(stageNum)) return base + 15;
  return base;
}

function getObstacleCount(stageNum) {
  const base = 6 + Math.min(Math.floor(stageNum / 3), 6);
  if (isBossStage(stageNum)) return base + 2;
  return base;
}

function getPairSpacing(stageNum) {
  return Math.max(120, 200 - stageNum * 3);
}

function isRestStage(stageNum) {
  return stageNum > 1 && stageNum % 5 === 0 && !isBossStage(stageNum);
}

function isBossStage(stageNum) {
  return stageNum >= 10 && stageNum % 10 === 0;
}

function getRotationFrequency(stageNum) {
  if (stageNum < 21) return 0;
  return Math.max(3, 8 - Math.floor((stageNum - 21) / 3));
}

function computeGapPosition(axis, gapWidth, playAreaWidth, playAreaHeight) {
  const halfGap = gapWidth / 2;
  const margin = 30;
  // For vertical axis: gaps are horizontal positions
  // For horizontal axis: gaps are vertical positions within each half
  const maxPos = playAreaWidth - margin - halfGap;
  const minPos = margin + halfGap;
  const reflGapCenter = minPos + Math.random() * (maxPos - minPos);

  let realGapCenter;
  if (axis === 'vertical') {
    // Vertical mirror: left/right reversed, up/down same
    realGapCenter = playAreaWidth - reflGapCenter;
  } else if (axis === 'horizontal') {
    // Horizontal mirror: left/right same, up/down reversed
    // Gap positions along x-axis are same
    realGapCenter = reflGapCenter;
  } else {
    // Diagonal: swap axes conceptually - use complementary position
    realGapCenter = playAreaWidth - reflGapCenter;
  }

  // Clamp
  realGapCenter = Math.max(minPos, Math.min(maxPos, realGapCenter));

  return {
    reflGapX: reflGapCenter - halfGap,
    realGapX: realGapCenter - halfGap,
    gapWidth: gapWidth
  };
}

function generateStage(stageNum) {
  const axis = getMirrorAxis(stageNum);
  const speed = getScrollSpeed(stageNum);
  const gapWidth = getGapWidth(stageNum);
  const count = getObstacleCount(stageNum);
  const spacing = getPairSpacing(stageNum);
  const rotFreq = getRotationFrequency(stageNum);

  const obstacles = [];
  let prevReflGap = GAME_WIDTH / 2;
  let currentAxis = axis;

  for (let i = 0; i < count; i++) {
    // Rotation during stage for rotating/boss stages
    if (rotFreq > 0 && i > 0 && i % rotFreq === 0) {
      const axes = ['vertical', 'horizontal', 'diagonal'];
      let newAxis;
      do { newAxis = axes[Math.floor(Math.random() * axes.length)]; } while (newAxis === currentAxis);
      currentAxis = newAxis;
    }
    if (isBossStage(stageNum) && i === Math.floor(count / 2)) {
      const axes = ['vertical', 'horizontal', 'diagonal'];
      currentAxis = axes[Math.floor(Math.random() * axes.length)];
    }

    const gap = computeGapPosition(currentAxis, gapWidth, GAME_WIDTH, GAME_HEIGHT);

    // Ensure variety: gap differs from previous by 30px min
    const reflCenter = gap.reflGapX + gapWidth / 2;
    if (Math.abs(reflCenter - prevReflGap) < 30) {
      const shift = (reflCenter > GAME_WIDTH / 2) ? -40 : 40;
      gap.reflGapX += shift;
      if (currentAxis === 'vertical' || currentAxis === 'diagonal') {
        gap.realGapX -= shift;
      } else {
        gap.realGapX += shift;
      }
    }
    // Clamp gaps
    gap.reflGapX = Math.max(10, Math.min(GAME_WIDTH - gapWidth - 10, gap.reflGapX));
    gap.realGapX = Math.max(10, Math.min(GAME_WIDTH - gapWidth - 10, gap.realGapX));
    prevReflGap = gap.reflGapX + gapWidth / 2;

    obstacles.push({
      reflGapX: gap.reflGapX,
      realGapX: gap.realGapX,
      gapWidth: gapWidth,
      offset: i * spacing,
      axis: currentAxis,
      rotateHere: (rotFreq > 0 && i > 0 && i % rotFreq === 0) ||
                  (isBossStage(stageNum) && i === Math.floor(count / 2)),
      passed: false
    });
  }

  return { obstacles, axis, speed, gapWidth, isBoss: isBossStage(stageNum), isRest: isRestStage(stageNum) };
}

function getMirroredDirection(swipeDir, axis) {
  const transforms = {
    vertical:   { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'UP', DOWN: 'DOWN' },
    horizontal: { LEFT: 'LEFT', RIGHT: 'RIGHT', UP: 'DOWN', DOWN: 'UP' },
    diagonal:   { LEFT: 'DOWN', RIGHT: 'UP', UP: 'RIGHT', DOWN: 'LEFT' }
  };
  return transforms[axis][swipeDir];
}

function dirToVec(dir) {
  switch(dir) {
    case 'LEFT':  return { x: -1, y: 0 };
    case 'RIGHT': return { x: 1, y: 0 };
    case 'UP':    return { x: 0, y: -1 };
    case 'DOWN':  return { x: 0, y: 1 };
    default:      return { x: 0, y: 0 };
  }
}
