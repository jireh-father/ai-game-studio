// stages.js - Law generation, difficulty scaling, shape spawning
function getDifficulty(stage) {
  if (stage <= 3) return { shapesPerLaw: 8, spawnInterval: 1500, zoneCount: 3, compoundChance: 0 };
  if (stage <= 6) return { shapesPerLaw: 7, spawnInterval: 1200, zoneCount: 3, compoundChance: 0 };
  if (stage <= 10) return { shapesPerLaw: 6, spawnInterval: 1000, zoneCount: 4, compoundChance: 0 };
  if (stage <= 15) return { shapesPerLaw: 5, spawnInterval: 800, zoneCount: 4, compoundChance: 0.25 };
  return { shapesPerLaw: 4, spawnInterval: 600, zoneCount: 5, compoundChance: 0.6 };
}

function getMaxStaging(stage) { return stage >= 11 ? 3 : MAX_STAGING_DEFAULT; }

function isRestStage(stage) { return stage > 1 && stage % 5 === 0; }

function getAvailColors(stage) { return SHAPE_COLORS.filter(c => c.unlock <= stage); }
function getAvailTypes(stage) { return SHAPE_TYPES.filter(t => t.unlock <= stage); }
function getAvailSizes(stage) { return stage >= 11 ? SIZES : [{ name: 'Normal', scale: 1.0, unlock: 1 }]; }
function getAvailPatterns(stage) { return PATTERNS.filter(p => p.unlock <= stage); }

function getLawPool(stage) {
  const pool = [LAW_TYPES.COLOR];
  if (stage >= 4) pool.push(LAW_TYPES.SHAPE);
  if (stage >= 11) { pool.push(LAW_TYPES.SIZE); pool.push(LAW_TYPES.COMPOUND); }
  if (stage >= 16) pool.push(LAW_TYPES.PATTERN);
  return pool;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function generateLaw(stage, zoneCount, prevLaw) {
  if (isRestStage(stage)) return generateColorLaw(stage, zoneCount);
  const diff = getDifficulty(stage);
  const pool = getLawPool(stage);
  if (diff.compoundChance > 0 && Math.random() < diff.compoundChance) {
    return generateCompoundLaw(stage, zoneCount);
  }
  let lawType = pickRandom(pool.filter(t => t !== LAW_TYPES.COMPOUND));
  if (lawType === undefined) lawType = LAW_TYPES.COLOR;
  switch (lawType) {
    case LAW_TYPES.COLOR: return generateColorLaw(stage, zoneCount);
    case LAW_TYPES.SHAPE: return generateShapeLaw(stage, zoneCount);
    case LAW_TYPES.SIZE: return generateSizeLaw(stage, zoneCount);
    case LAW_TYPES.PATTERN: return generatePatternLaw(stage, zoneCount);
    default: return generateColorLaw(stage, zoneCount);
  }
}

function generateColorLaw(stage, zoneCount) {
  const colors = shuffle(getAvailColors(stage)).slice(0, zoneCount);
  const rules = colors.map((c, i) => ({ match: { color: c.name }, zone: i }));
  return { type: 'COLOR', rules, fallback: 0, text: rules.map((r, i) => `${r.match.color}->${getZoneName(i, zoneCount)}`).join('  ') };
}

function generateShapeLaw(stage, zoneCount) {
  const types = shuffle(getAvailTypes(stage)).slice(0, Math.min(getAvailTypes(stage).length, zoneCount));
  const rules = types.map((t, i) => ({ match: { type: t.name }, zone: i }));
  const fallback = rules.length < zoneCount ? rules.length - 1 : 0;
  return { type: 'SHAPE', rules, fallback, text: rules.map(r => `${r.match.type}->${getZoneName(r.zone, zoneCount)}`).join('  ') };
}

function generateSizeLaw(stage, zoneCount) {
  const sizes = getAvailSizes(stage);
  const rules = sizes.map((s, i) => ({ match: { size: s.name }, zone: i % zoneCount }));
  return { type: 'SIZE', rules, fallback: 0, text: rules.map(r => `${r.match.size}->${getZoneName(r.zone, zoneCount)}`).join('  ') };
}

function generatePatternLaw(stage, zoneCount) {
  const pats = getAvailPatterns(stage);
  const rules = pats.map((p, i) => ({ match: { pattern: p.name }, zone: i % zoneCount }));
  return { type: 'PATTERN', rules, fallback: 0, text: rules.map(r => `${r.match.pattern}->${getZoneName(r.zone, zoneCount)}`).join('  ') };
}

function generateCompoundLaw(stage, zoneCount) {
  const colors = shuffle(getAvailColors(stage)).slice(0, 2);
  const types = shuffle(getAvailTypes(stage)).slice(0, 2);
  const rules = [];
  rules.push({ match: { color: colors[0].name, type: types[0].name }, zone: 0 });
  if (zoneCount > 1) rules.push({ match: { color: colors[1 % colors.length].name, type: types[1 % types.length].name }, zone: 1 });
  const fallback = Math.min(2, zoneCount - 1);
  const text = rules.map(r => `${r.match.color} ${r.match.type}->${getZoneName(r.zone, zoneCount)}`).join('  ') + `  else->${getZoneName(fallback, zoneCount)}`;
  return { type: 'COMPOUND', rules, fallback, text };
}

function getZoneName(idx, count) {
  if (count <= 3) return (ZONE_NAMES_3[idx] || ZONE_NAMES_3[0]);
  if (count <= 4) return (ZONE_NAMES_4[idx] || ZONE_NAMES_4[0]);
  return (ZONE_NAMES_5[idx] || ZONE_NAMES_5[0]);
}

function evaluateShape(shape, law) {
  for (const rule of law.rules) {
    let match = true;
    for (const [key, val] of Object.entries(rule.match)) {
      if (shape[key] !== val) { match = false; break; }
    }
    if (match) return rule.zone;
  }
  return law.fallback;
}

function generateShapeProps(stage) {
  const color = pickRandom(getAvailColors(stage));
  const type = pickRandom(getAvailTypes(stage));
  const size = pickRandom(getAvailSizes(stage));
  const pattern = pickRandom(getAvailPatterns(stage));
  return { color: color.name, colorHex: color.hex, type: type.name, size: size.name, sizeScale: size.scale, pattern: pattern.name };
}

function getZoneLayout(zoneCount, gameW, zoneTop, zoneH) {
  const zones = [];
  if (zoneCount <= 3) {
    const w = Math.floor(gameW / 3);
    for (let i = 0; i < 3; i++) zones.push({ x: i * w, y: zoneTop, w, h: zoneH, idx: i });
  } else if (zoneCount === 4) {
    const w = Math.floor(gameW / 4);
    for (let i = 0; i < 4; i++) zones.push({ x: i * w, y: zoneTop, w, h: zoneH, idx: i });
  } else {
    const w3 = Math.floor(gameW / 3); const w2 = Math.floor(gameW / 2); const h2 = Math.floor(zoneH / 2);
    for (let i = 0; i < 3; i++) zones.push({ x: i * w3, y: zoneTop, w: w3, h: h2, idx: i });
    for (let i = 0; i < 2; i++) zones.push({ x: i * w2, y: zoneTop + h2, w: w2, h: h2, idx: 3 + i });
  }
  return zones;
}

function validateLawFairness(law, shapesInZones, zoneCount) {
  if (shapesInZones.length === 0) return true;
  let violations = 0;
  for (const s of shapesInZones) {
    if (evaluateShape(s.props, law) !== s.zoneIdx) violations++;
  }
  return violations <= Math.floor(shapesInZones.length * 0.5);
}
