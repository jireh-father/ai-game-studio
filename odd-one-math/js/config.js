const COLOR = {
  bg: 0xF5F5F5, cardDefault: 0xFFFFFF, cardBorder: 0x334155,
  numberText: '#1E293B', correctFlash: 0x22C55E, wrongFlash: 0xEF4444,
  impostorReveal: 0xF97316, timerSafe: 0x22C55E, timerWarn: 0xEAB308,
  timerDanger: 0xEF4444, streakAccent: '#A855F7', scoreText: '#1E293B',
  revealBg: 0x0F172A, revealText: '#FFFFFF', strikeActive: 0xEF4444,
  strikeLost: 0xCBD5E1, accent: 0x6366F1, accentHex: '#6366F1',
  bgFlash: 0xE0E7FF, deathOverlay: 0x000000
};

const GAME_W = 360, GAME_H = 640;
const CARD_SIZE = 140, CARD_GAP = 16;
const HUD_H = 56;

const SCORE = { base: 100, timeBonus: 10, timeBonusInterval: 0.5, streakBonus: 50,
  milestones: { 5: 500, 10: 1500, 20: 5000 } };

const DIFFICULTY = [
  { minStage: 1,  maxStage: 5,  timer: 5.0, numRange: 50,  catIds: [0,1,2,3] },
  { minStage: 6,  maxStage: 10, timer: 5.0, numRange: 50,  catIds: [0,1,2,3,4,5] },
  { minStage: 11, maxStage: 15, timer: 4.5, numRange: 100, catIds: [0,1,2,3,4,5,6,7,8] },
  { minStage: 16, maxStage: 20, timer: 4.5, numRange: 100, catIds: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { minStage: 21, maxStage: 30, timer: 4.0, numRange: 200, catIds: [0,1,2,3,4,5,6,7,8,9,10,11,12,13] },
  { minStage: 31, maxStage: 40, timer: 4.0, numRange: 200, catIds: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { minStage: 41, maxStage: 50, timer: 3.5, numRange: 500, catIds: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
  { minStage: 51, maxStage: 9999, timer: 3.5, numRange: 500, catIds: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] }
];

function isPrime(n) { if (n < 2) return false; if (n < 4) return true; if (n%2===0||n%3===0) return false; for(let i=5;i*i<=n;i+=6) if(n%i===0||(n%(i+2))===0) return false; return true; }
function sumDivisors(n) { let s=0; for(let i=1;i<n;i++) if(n%i===0) s+=i; return s; }
function digitSum(n) { let s=0,v=n; while(v>0){s+=v%10;v=Math.floor(v/10);} return s; }
function isHappy(n) { const seen=new Set(); while(n!==1&&!seen.has(n)){seen.add(n);let s=0,v=n;while(v>0){const d=v%10;s+=d*d;v=Math.floor(v/10);}n=s;} return n===1; }

const FIB_SET = new Set(); { let a=1,b=1; while(a<=500){FIB_SET.add(a);const t=a+b;a=b;b=t;} }
const TRI_SET = new Set(); { for(let k=1;k*(k+1)/2<=500;k++) TRI_SET.add(k*(k+1)/2); }
const CATALAN = [1,1,2,5,14,42,132,429]; const CATALAN_SET = new Set(CATALAN);

function countDistinctPrimeFactors(n) { let c=0,v=n; for(let p=2;p*p<=v;p++){if(v%p===0){c++;while(v%p===0)v/=p;}} if(v>1)c++; return c; }

const CATEGORIES = [
  { name:'Even Numbers', desc:'Divisible by 2', fn:n=>n%2===0 },
  { name:'Odd Numbers', desc:'Not divisible by 2', fn:n=>n%2!==0 },
  { name:'Multiples of 3', desc:'Divisible by 3', fn:n=>n%3===0 },
  { name:'Multiples of 5', desc:'Divisible by 5', fn:n=>n%5===0 },
  { name:'Prime Numbers', desc:'Only divisible by 1 and itself', fn:isPrime },
  { name:'Perfect Squares', desc:'N = k\u00B2', fn:n=>{const s=Math.round(Math.sqrt(n));return s*s===n;} },
  { name:'Fibonacci Numbers', desc:'Part of the Fibonacci sequence', fn:n=>FIB_SET.has(n) },
  { name:'Triangular Numbers', desc:'N = k(k+1)/2', fn:n=>TRI_SET.has(n) },
  { name:'Powers of 2', desc:'N = 2^k', fn:n=>(n&(n-1))===0&&n>0 },
  { name:'Perfect Cubes', desc:'N = k\u00B3', fn:n=>{const c=Math.round(Math.cbrt(n));return c*c*c===n;} },
  { name:'Abundant Numbers', desc:'Sum of proper divisors > N', fn:n=>n>1&&sumDivisors(n)>n },
  { name:'Deficient Numbers', desc:'Sum of proper divisors < N', fn:n=>n>1&&sumDivisors(n)<n },
  { name:'Palindrome Numbers', desc:'Reads same forward and backward', fn:n=>{const s=''+n;return s===s.split('').reverse().join('');} },
  { name:'Happy Numbers', desc:'Digit-square iteration reaches 1', fn:isHappy },
  { name:'Harshad Numbers', desc:'Divisible by sum of own digits', fn:n=>n>0&&n%digitSum(n)===0 },
  { name:'Digit Sum = 9', desc:'Sum of digits equals 9', fn:n=>digitSum(n)===9 },
  { name:'3+ Prime Factors', desc:'Has 3 or more distinct prime factors', fn:n=>countDistinctPrimeFactors(n)>=3 },
  { name:'Catalan Numbers', desc:'Part of the Catalan sequence', fn:n=>CATALAN_SET.has(n) }
];

const SVG_CARD = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect x="3" y="3" width="134" height="134" rx="14" ry="14" fill="#FFFFFF" stroke="#334155" stroke-width="3"/></svg>`;
const SVG_CARD_CORRECT = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect x="3" y="3" width="134" height="134" rx="14" ry="14" fill="#22C55E" stroke="#16A34A" stroke-width="3"/><polyline points="35,74 58,97 105,46" stroke="#FFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const SVG_CARD_WRONG = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect x="3" y="3" width="134" height="134" rx="14" ry="14" fill="#EF4444" stroke="#B91C1C" stroke-width="3"/><line x1="40" y1="40" x2="100" y2="100" stroke="#FFF" stroke-width="7" stroke-linecap="round"/><line x1="100" y1="40" x2="40" y2="100" stroke="#FFF" stroke-width="7" stroke-linecap="round"/></svg>`;
const SVG_CARD_IMPOSTOR = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140"><rect x="3" y="3" width="134" height="134" rx="14" ry="14" fill="#FFF7ED" stroke="#F97316" stroke-width="4"/></svg>`;
const SVG_STRIKE_ON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/></svg>`;
const SVG_STRIKE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#CBD5E1" stroke="#94A3B8" stroke-width="2"/></svg>`;
const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#22C55E"/></svg>`;
