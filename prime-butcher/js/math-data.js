// Prime Butcher — math-data.js
// Pre-computed prime set and factor map for composites up to 500

const PRIME_SET = new Set([
  2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,
  101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,
  193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,
  293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,
  409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499
]);

// FACTOR_MAP[n] = array of factors for one cut
// For composites with non-prime factors, use smallest factor pair
// so one factor can be further split (chained cuts)
const FACTOR_MAP = {};

(function buildFactorMap() {
  for (let n = 4; n <= 500; n++) {
    if (PRIME_SET.has(n)) continue;
    // Find smallest factor >= 2
    for (let f = 2; f <= Math.sqrt(n); f++) {
      if (n % f === 0) {
        FACTOR_MAP[n] = [f, n / f];
        break;
      }
    }
  }
})();

// Pre-computed prime factorization (full breakdown to primes)
function getPrimeFactors(n) {
  const factors = [];
  let val = n;
  for (let p = 2; p * p <= val; p++) {
    while (val % p === 0) {
      factors.push(p);
      val /= p;
    }
  }
  if (val > 1) factors.push(val);
  return factors;
}
