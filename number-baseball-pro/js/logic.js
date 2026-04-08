// Number Baseball Pro - Pure puzzle logic
function generateSecret(digits) {
  const pool = [0,1,2,3,4,5,6,7,8,9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const secret = pool.slice(0, digits);
  if (secret[0] === 0) {
    for (let k = 1; k < secret.length; k++) {
      if (secret[k] !== 0) { [secret[0], secret[k]] = [secret[k], secret[0]]; break; }
    }
  }
  return secret;
}

function evaluateGuess(secret, guess) {
  let strikes = 0, balls = 0;
  const perSlot = []; // 'strike' | 'ball' | 'miss'
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) { strikes++; perSlot.push('strike'); }
    else if (secret.indexOf(guess[i]) !== -1) { balls++; perSlot.push('ball'); }
    else perSlot.push('miss');
  }
  const out = (strikes === 0 && balls === 0);
  return { strikes, balls, out, win: strikes === secret.length, perSlot };
}

function digitSum(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s;
}

function getTemperature(secret, guess) {
  const diff = Math.abs(digitSum(secret) - digitSum(guess));
  if (diff === 0) return { label: 'BURNING', color: COLORS_HEX.burning, tier: 4 };
  if (diff <= 2) return { label: 'WARM', color: COLORS_HEX.warm, tier: 3 };
  if (diff <= 5) return { label: 'COOL', color: COLORS_HEX.cool, tier: 2 };
  return { label: 'FREEZING', color: COLORS_HEX.freezing, tier: 1 };
}

// Pick n random forbidden digits NOT in secret
function pickForbidden(secret, n) {
  const avail = [];
  for (let d = 0; d < 10; d++) if (secret.indexOf(d) === -1) avail.push(d);
  for (let i = avail.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [avail[i], avail[j]] = [avail[j], avail[i]];
  }
  return avail.slice(0, n);
}
