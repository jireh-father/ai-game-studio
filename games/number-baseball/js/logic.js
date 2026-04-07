// Number Baseball - Pure puzzle logic
function generateSecret(digits) {
  const pool = [0,1,2,3,4,5,6,7,8,9];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const secret = pool.slice(0, digits);
  // Avoid leading zero (optional — keeps display clean for 3+ digit numbers)
  if (secret[0] === 0) {
    // swap first 0 with the next non-zero
    for (let k = 1; k < secret.length; k++) {
      if (secret[k] !== 0) { [secret[0], secret[k]] = [secret[k], secret[0]]; break; }
    }
  }
  return secret;
}

function evaluateGuess(secret, guess) {
  let strikes = 0, balls = 0;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) strikes++;
    else if (secret.indexOf(guess[i]) !== -1) balls++;
  }
  const out = (strikes === 0 && balls === 0);
  return { strikes, balls, out, win: strikes === secret.length };
}

function formatGuess(arr) {
  return arr.join('');
}

function formatResult(r, digits) {
  if (r.win) return 'WIN!';
  if (r.out) return 'OUT';
  const parts = [];
  if (r.strikes > 0) parts.push(r.strikes + 'S');
  if (r.balls > 0) parts.push(r.balls + 'B');
  return parts.join(' ');
}
