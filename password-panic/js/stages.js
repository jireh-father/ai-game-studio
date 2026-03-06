// stages.js - Rule generation, tile selection, solvability validation

function getTimerForStage(stage) {
  const idx = Math.min(stage - 1, TIMER_CONFIG.startByStage.length - 1);
  return TIMER_CONFIG.startByStage[idx];
}

function getWebsiteName(stage) {
  const tier = stage <= 2 ? 0 : stage <= 5 ? 1 : stage <= 8 ? 2 : stage <= 12 ? 3 : 4;
  const list = WEBSITES[tier];
  return list[Math.floor(Math.random() * list.length)];
}

function getAllowedCats(stage) {
  if (stage <= 2) return ['A'];
  if (stage <= 5) return ['A','B'];
  if (stage <= 8) return ['A','B','C','D'];
  if (stage <= 12) return ['A','B','C','D','E'];
  return ['A','B','C','D','E','F'];
}

function getRuleCount(stage) {
  if (stage <= 2) return 2;
  if (stage <= 5) return Math.min(3 + Math.floor((stage-3)/2), 4);
  if (stage <= 8) return Math.min(5 + Math.floor((stage-6)/2), 6);
  if (stage <= 12) return Math.min(6 + Math.floor((stage-9)/2), 8);
  return Math.min(7 + Math.floor((stage-13)/3), 10);
}

function pickNewRule(existingIds, allowedCats) {
  const available = RULE_DEFS.filter(r =>
    !existingIds.includes(r.id) && allowedCats.includes(r.cat)
  );
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  const rule = { id: pick.id, cat: pick.cat };
  rule.text = pick.text;
  if (pick.gen) {
    rule.value = pick.gen(GameState.stage);
    rule.text = rule.text.replace('{v}', rule.value);
  }
  return rule;
}

function generateRulesForStage(stageNum, existingRules) {
  let rules = [...existingRules];
  // PASSWORD RESET at stages 5, 10, 15...
  const isReset = stageNum > 1 && stageNum % 5 === 0;
  if (isReset && rules.length >= 2) {
    rules.splice(0, 2); // remove 2 oldest
  }
  const targetCount = getRuleCount(stageNum);
  const allowed = getAllowedCats(stageNum);
  const newRulesNeeded = isReset ? 3 : Math.max(1, targetCount - rules.length);
  const ids = rules.map(r => r.id);
  for (let i = 0; i < newRulesNeeded && rules.length < 10; i++) {
    const nr = pickNewRule(ids, allowed);
    if (nr) { rules.push(nr); ids.push(nr.id); }
  }
  // Check for contradictions
  rules = resolveContradictions(rules);
  return rules;
}

function resolveContradictions(rules) {
  const has = id => rules.find(r => r.id === id);
  const noNum = has('NO_NUMBERS');
  const needNum = has('CONTAINS_NUMBER');
  if (noNum && needNum) rules = rules.filter(r => r.id !== 'NO_NUMBERS');
  const minR = has('LENGTH_MIN');
  const maxR = has('LENGTH_MAX');
  if (minR && maxR && minR.value > maxR.value) rules = rules.filter(r => r.id !== 'LENGTH_MAX');
  const exactR = has('EXACT_LENGTH');
  if (exactR && minR && exactR.value < minR.value) rules = rules.filter(r => r.id !== 'EXACT_LENGTH');
  return rules;
}

function sumDigits(str) {
  return (str.match(/\d/g) || []).reduce((s, d) => s + parseInt(d), 0);
}

function countDigits(str) {
  return (str.match(/\d/g) || []).length;
}

function countVowels(str) {
  return (str.match(/[AEIOU]/gi) || []).length;
}

function isPrime(n) { return PRIMES.includes(n); }

function extractNumbers(str) {
  const nums = [];
  const m = str.match(/\d+/g);
  if (m) m.forEach(n => nums.push(parseInt(n)));
  return nums;
}

function hasPalindromeSub(str) {
  for (let i = 0; i <= str.length - 3; i++) {
    for (let len = 3; len <= str.length - i; len++) {
      const sub = str.substring(i, i + len);
      if (sub === sub.split('').reverse().join('')) return true;
    }
  }
  return false;
}

function hasDouble(str) {
  for (let i = 0; i < str.length - 1; i++) {
    if (/[A-Z]/i.test(str[i]) && str[i] === str[i+1]) return true;
  }
  return false;
}

function checkRule(pw, rule, tiles) {
  const tileCount = tiles ? tiles.length : 0;
  switch (rule.id) {
    case 'LENGTH_MIN': return pw.length >= rule.value;
    case 'LENGTH_MAX': return pw.length <= rule.value;
    case 'EXACT_LENGTH': return pw.length === rule.value;
    case 'CONTAINS_NUMBER': return /\d/.test(pw);
    case 'CONTAINS_UPPERCASE': return /[A-Z]/.test(pw);
    case 'CONTAINS_SYMBOL': return /[!@#$%^&*]/.test(pw);
    case 'CONTAINS_COUNTRY': return CATEGORIES.COUNTRIES.some(c => pw.includes(c));
    case 'CONTAINS_ANIMAL': return CATEGORIES.ANIMALS.some(a => pw.includes(a));
    case 'CONTAINS_COLOR': return CATEGORIES.COLORS_LIST.some(c => pw.includes(c));
    case 'CONTAINS_FOOD': return CATEGORIES.FOODS.some(f => pw.includes(f));
    case 'CONTAINS_ELEMENT': return CATEGORIES.ELEMENTS.some(e => pw.includes(e));
    case 'DIGIT_SUM': return sumDigits(pw) === rule.value;
    case 'CONTAINS_PRIME': return extractNumbers(pw).some(isPrime);
    case 'CONTAINS_EVEN': return extractNumbers(pw).some(n => n % 2 === 0);
    case 'CONTAINS_ODD': return extractNumbers(pw).some(n => n % 2 !== 0);
    case 'DIGIT_COUNT': return countDigits(pw) === rule.value;
    case 'STARTS_WITH': return pw.startsWith(rule.value);
    case 'ENDS_WITH': return pw.endsWith(rule.value);
    case 'NO_REPEAT_CHARS': return new Set(pw.toUpperCase()).size === pw.length;
    case 'CONTAINS_DOUBLE': return hasDouble(pw);
    case 'PALINDROME_SUB': return hasPalindromeSub(pw);
    case 'BORDERS_FRANCE': return CATEGORIES.FRANCE_BORDERS.some(c => pw.includes(c));
    case 'THREE_LETTER_ANIMAL': return CATEGORIES.ANIMALS.filter(a => a.length === 3).some(a => pw.includes(a));
    case 'VOWEL_COUNT': return countVowels(pw) === rule.value;
    case 'NO_LETTER_E': return !pw.toUpperCase().includes('E');
    case 'TILE_COUNT_MIN': return tileCount >= rule.value;
    case 'TILE_COUNT_MAX': return tileCount <= rule.value;
    case 'NO_NUMBERS': return !/\d/.test(pw);
    default: return true;
  }
}

function validatePassword(pw, rules, tileObjs) {
  const results = rules.map(r => ({ ruleId: r.id, ruleText: r.text, satisfied: checkRule(pw, r, tileObjs) }));
  return { valid: results.every(r => r.satisfied), results };
}

function shuffle(arr) { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function generateTilesForStage(rules) {
  const wordTiles = []; const usedWords = new Set();
  // Guarantee tiles for content rules
  const contentMap = {
    'CONTAINS_COUNTRY': CATEGORIES.COUNTRIES, 'CONTAINS_ANIMAL': CATEGORIES.ANIMALS,
    'CONTAINS_COLOR': CATEGORIES.COLORS_LIST, 'CONTAINS_FOOD': CATEGORIES.FOODS,
    'CONTAINS_ELEMENT': CATEGORIES.ELEMENTS, 'BORDERS_FRANCE': CATEGORIES.FRANCE_BORDERS,
    'THREE_LETTER_ANIMAL': CATEGORIES.ANIMALS.filter(a => a.length === 3)
  };
  for (const r of rules) {
    if (contentMap[r.id]) {
      const pool = contentMap[r.id].filter(w => !usedWords.has(w));
      if (pool.length > 0) {
        const w = pool[Math.floor(Math.random() * pool.length)];
        wordTiles.push(w); usedWords.add(w);
      }
    }
  }
  // No letter E rule: filter words
  const noE = rules.find(r => r.id === 'NO_LETTER_E');
  const wordFilter = w => !usedWords.has(w) && (!noE || !w.includes('E'));
  while (wordTiles.length < 6) {
    const pool = WORD_POOL.filter(wordFilter);
    if (pool.length === 0) break;
    const w = pool[Math.floor(Math.random() * pool.length)];
    wordTiles.push(w); usedWords.add(w);
  }
  // Number tiles
  const numberTiles = [];
  const primeRule = rules.find(r => r.id === 'CONTAINS_PRIME');
  if (primeRule) numberTiles.push(PRIMES[Math.floor(Math.random() * PRIMES.length)]);
  const evenRule = rules.find(r => r.id === 'CONTAINS_EVEN');
  if (evenRule && !numberTiles.some(n => n % 2 === 0)) numberTiles.push([2,4,6,8,42,100][Math.floor(Math.random()*6)]);
  const oddRule = rules.find(r => r.id === 'CONTAINS_ODD');
  if (oddRule && !numberTiles.some(n => n % 2 !== 0)) numberTiles.push([3,5,7,11,13,99][Math.floor(Math.random()*6)]);
  const usedNums = new Set(numberTiles);
  while (numberTiles.length < 5) {
    const pool = NUMBER_POOL.filter(n => !usedNums.has(n));
    if (pool.length === 0) break;
    const n = pool[Math.floor(Math.random() * pool.length)];
    numberTiles.push(n); usedNums.add(n);
  }
  // Symbol/letter tiles
  const symbolTiles = ['!', '@', '#'];
  const startRule = rules.find(r => r.id === 'STARTS_WITH');
  const endRule = rules.find(r => r.id === 'ENDS_WITH');
  if (startRule && !symbolTiles.includes(startRule.value)) symbolTiles.push(startRule.value);
  if (endRule && !symbolTiles.includes(endRule.value)) symbolTiles.push(endRule.value);
  while (symbolTiles.length < 5) {
    const l = LETTER_POOL[Math.floor(Math.random() * 26)];
    if (!symbolTiles.includes(l)) symbolTiles.push(l);
  }
  return {
    words: shuffle(wordTiles.slice(0,6)),
    numbers: shuffle(numberTiles.slice(0,5)),
    symbols: shuffle(symbolTiles.slice(0,5))
  };
}
