function getDifficulty(stageNum) {
  for (const row of DIFFICULTY) {
    if (stageNum <= row[0]) {
      return { wordLength: row[1], travelTime: row[2], boulderCount: row[3], wrongPenalty: row[4] };
    }
  }
  const last = DIFFICULTY[DIFFICULTY.length - 1];
  return { wordLength: last[1], travelTime: last[2], boulderCount: last[3], wrongPenalty: last[4] };
}

function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scrambleWord(word) {
  const letters = word.split('');
  let scrambled = fisherYatesShuffle(letters);
  let attempts = 0;
  while (scrambled.join('') === word && attempts < 10) {
    scrambled = fisherYatesShuffle(letters);
    attempts++;
  }
  return scrambled;
}

function pickWord(wordLength, usedWords) {
  const pool = WORD_POOL[wordLength] || WORD_POOL[6];
  const available = pool.filter(w => !usedWords.has(w));
  const source = available.length > 0 ? available : pool;
  const word = source[Math.floor(Math.random() * source.length)];
  usedWords.add(word);
  return word;
}

function getLaneY(index, count) {
  const hud = GAME_CONFIG.hudHeight;
  const h = GAME_CONFIG.height - hud;
  if (count === 1) return hud + h * 0.5;
  if (count === 2) return hud + h * (index === 0 ? 0.33 : 0.67);
  return hud + h * (0.25 + index * 0.25);
}

function samplePowerUps(n) {
  const shuffled = fisherYatesShuffle(POWERUPS);
  return shuffled.slice(0, n);
}
