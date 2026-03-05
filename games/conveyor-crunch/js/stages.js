// Conveyor Crunch - Stage Generation
function getStageParams(stageNum) {
  const s = stageNum;
  const speedMult = Math.min(2.5, 1 + s * 0.08);
  const beltSpeed = GAME.BASE_SPEED * speedMult;
  const spawnInterval = Math.max(400, 1200 - s * 30);
  let colorCount = 2;
  if (s >= 16) colorCount = 4;
  else if (s >= 7) colorCount = 3;
  const shadeConfusion = s >= 11;
  const decoyChance = s >= 21 ? 0.25 : (s >= 16 ? 0.15 : 0);
  const rotationChance = s >= 26 ? 0.5 : (s >= 21 ? 0.3 : 0);
  const binSwap = s >= 7;
  const isRush = s % 5 === 0 && s > 0;
  const isRest = s % 10 === 0 && s > 0;
  const itemCount = isRush ? GAME.RUSH_ITEMS : GAME.ITEMS_PER_STAGE;
  return { beltSpeed, spawnInterval, colorCount, shadeConfusion, decoyChance,
    rotationChance, binSwap, isRush, isRest, itemCount, stage: s };
}

function pickStageColors(params) {
  const count = params.colorCount;
  const chosen = BASE_COLORS.slice(0, count);
  const result = [];
  for (const c of chosen) {
    result.push(c);
    if (params.shadeConfusion && SHADE_VARIANTS[c]) {
      result.push(SHADE_VARIANTS[c]);
    }
  }
  return { baseColors: chosen, allColors: result };
}

function assignBins(baseColors, prevBins, shouldSwap) {
  const shuffled = Phaser.Utils.Array.Shuffle([...baseColors]);
  const bins = { left: shuffled[0], right: shuffled[1] || shuffled[0] };
  if (shouldSwap && prevBins) {
    if (Math.random() < 0.6) {
      bins.left = prevBins.right;
      bins.right = prevBins.left;
    }
  }
  return bins;
}

function generateItemQueue(params, colors, bins) {
  const items = [];
  const { allColors, baseColors } = colors;
  const sortableColors = [];
  for (const c of allColors) {
    const name = COLOR_NAMES[c];
    if (name === COLOR_NAMES[bins.left] || name === COLOR_NAMES[bins.right]) {
      sortableColors.push(c);
    }
  }
  let prevColor = null;
  for (let i = 0; i < params.itemCount; i++) {
    const isDecoy = Math.random() < params.decoyChance;
    let color, shape, rotates;
    if (isDecoy) {
      color = COLORS.DECOY;
      shape = 'circle';
      rotates = false;
    } else {
      let pool = sortableColors.length > 0 ? sortableColors : [bins.left, bins.right];
      do { color = Phaser.Utils.Array.GetRandom(pool); } while (color === prevColor && pool.length > 1);
      prevColor = color;
      shape = params.stage >= 16 ? ['circle','square','triangle'][Math.floor(Math.random()*3)] :
              params.stage >= 7 ? ['circle','square'][Math.floor(Math.random()*2)] : 'circle';
      rotates = Math.random() < params.rotationChance;
    }
    const targetBin = isDecoy ? 'discard' :
      (COLOR_NAMES[color] === COLOR_NAMES[bins.left] ? 'left' :
       COLOR_NAMES[color] === COLOR_NAMES[bins.right] ? 'right' : 'left');
    const isRest = params.isRest && i < 2;
    items.push({ color, shape, isDecoy, rotates, targetBin, isRestItem: isRest });
  }
  return items;
}
