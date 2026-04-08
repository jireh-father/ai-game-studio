// Stage generation
function generateStage(stageNumber) {
  const seed = stageNumber * 7919 + Math.floor(Date.now() / 1000) % 100000;
  const rng = mulberry32(seed);

  // Pick 4 distinct categories
  const pool = CARD_CATEGORIES.slice();
  const chosen = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  // Take 4 words from each category
  const cards = [];
  chosen.forEach((cat, gi) => {
    const words = cat.words.slice();
    for (let i = 0; i < 4; i++) {
      const widx = Math.floor(rng() * words.length);
      cards.push({
        word: words.splice(widx, 1)[0],
        group: gi,
        category: cat.name,
        trap: false
      });
    }
  });

  // Trap cards stage 7+
  const trapCount = stageNumber >= 7 ? Math.min(4, Math.floor((stageNumber - 7) / 3) + 1) : 0;
  for (let t = 0; t < trapCount; t++) {
    // Replace a random non-trap card with ambiguous word
    const attempts = [];
    for (let i = 0; i < cards.length; i++) if (!cards[i].trap) attempts.push(i);
    if (!attempts.length) break;
    const idx = attempts[Math.floor(rng() * attempts.length)];
    cards[idx].trap = true;
  }

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Fall speed: cards per minute
  const cpm = Math.min(70, 20 + (stageNumber - 1) * 3);
  const spawnInterval = 60000 / cpm; // ms between card spawns

  return {
    stageNumber,
    cards,
    categories: chosen.map(c => c.name),
    spawnInterval,
    fallSpeed: 20 + stageNumber * 1.5 // px/sec
  };
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
