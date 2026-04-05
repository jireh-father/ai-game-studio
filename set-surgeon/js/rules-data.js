// Set Surgeon - Rule Library (30+ rules across 5 tiers)
// Each rule: { id, tier, label, test(element) => boolean, category }
// Element shape: { type:'number'|'shape', value:number, shape:SHAPES.X, colorName:string }

const PRIMES = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]);
const PERFECT_SQ = new Set([1,4,9,16,25,36,49,64,81]);
const FIBONACCI = new Set([1,2,3,5,8,13,21,34,55,89]);

function digitSum(n) { return String(n).split('').reduce((s, d) => s + parseInt(d), 0); }
function isPalindrome(n) { const s = String(n); return s.length > 1 && s === s.split('').reverse().join(''); }

const RULE_LIBRARY = [
  // TIER 1 - Single property (10 rules)
  { id: 'R01', tier: 1, label: 'Even numbers', category: 'parity',
    test: (e) => e.type === 'number' && e.value % 2 === 0 },
  { id: 'R02', tier: 1, label: 'Odd numbers', category: 'parity',
    test: (e) => e.type === 'number' && e.value % 2 !== 0 },
  { id: 'R03', tier: 1, label: 'Multiples of 3', category: 'divisibility',
    test: (e) => e.type === 'number' && e.value % 3 === 0 },
  { id: 'R04', tier: 1, label: 'Numbers > 50', category: 'range',
    test: (e) => e.type === 'number' && e.value > 50 },
  { id: 'R05', tier: 1, label: 'Numbers < 30', category: 'range',
    test: (e) => e.type === 'number' && e.value < 30 },
  { id: 'R06', tier: 1, label: 'Red elements', category: 'color',
    test: (e) => e.colorName === 'red' },
  { id: 'R07', tier: 1, label: 'Blue elements', category: 'color',
    test: (e) => e.colorName === 'blue' },
  { id: 'R08', tier: 1, label: 'Round shapes', category: 'shape_type',
    test: (e) => e.type === 'shape' && e.shape.round },
  { id: 'R09', tier: 1, label: 'Pointy shapes', category: 'shape_type',
    test: (e) => e.type === 'shape' && e.shape.pointy },
  { id: 'R10', tier: 1, label: '4-sided shapes', category: 'shape_type',
    test: (e) => e.type === 'shape' && e.shape.sides === 4 },

  // TIER 2 - Two-property AND (8 rules)
  { id: 'R11', tier: 2, label: 'Even AND > 30', category: 'compound_num',
    test: (e) => e.type === 'number' && e.value % 2 === 0 && e.value > 30 },
  { id: 'R12', tier: 2, label: 'Multiple of 5 AND < 50', category: 'compound_num',
    test: (e) => e.type === 'number' && e.value % 5 === 0 && e.value < 50 },
  { id: 'R13', tier: 2, label: 'Red AND round', category: 'compound_shape',
    test: (e) => e.colorName === 'red' && e.type === 'shape' && e.shape.round },
  { id: 'R14', tier: 2, label: 'Blue AND pointy', category: 'compound_shape',
    test: (e) => e.colorName === 'blue' && e.type === 'shape' && e.shape.pointy },
  { id: 'R15', tier: 2, label: 'Prime AND odd', category: 'compound_num',
    test: (e) => e.type === 'number' && PRIMES.has(e.value) && e.value % 2 !== 0 },
  { id: 'R16', tier: 2, label: 'Green AND 4-sided', category: 'compound_shape',
    test: (e) => e.colorName === 'green' && e.type === 'shape' && e.shape.sides === 4 },
  { id: 'R17', tier: 2, label: 'Contains digit 7', category: 'digit',
    test: (e) => e.type === 'number' && String(e.value).includes('7') },
  { id: 'R18', tier: 2, label: 'Perfect squares', category: 'special_num',
    test: (e) => e.type === 'number' && PERFECT_SQ.has(e.value) },

  // TIER 3 - OR and NOT (8 rules)
  { id: 'R19', tier: 3, label: 'Even OR multiple of 3', category: 'or_num',
    test: (e) => e.type === 'number' && (e.value % 2 === 0 || e.value % 3 === 0) },
  { id: 'R20', tier: 3, label: 'Red OR blue', category: 'or_color',
    test: (e) => e.colorName === 'red' || e.colorName === 'blue' },
  { id: 'R21', tier: 3, label: 'NOT multiple of 5', category: 'not_num',
    test: (e) => e.type === 'number' && e.value % 5 !== 0 },
  { id: 'R22', tier: 3, label: 'NOT round shapes', category: 'not_shape',
    test: (e) => !(e.type === 'shape' && e.shape.round) },
  { id: 'R23', tier: 3, label: 'Prime OR perfect square', category: 'or_num',
    test: (e) => e.type === 'number' && (PRIMES.has(e.value) || PERFECT_SQ.has(e.value)) },
  { id: 'R24', tier: 3, label: 'NOT red AND NOT blue', category: 'not_color',
    test: (e) => e.colorName !== 'red' && e.colorName !== 'blue' },
  { id: 'R25', tier: 3, label: 'Digit sum > 9', category: 'digit',
    test: (e) => e.type === 'number' && digitSum(e.value) > 9 },
  { id: 'R26', tier: 3, label: 'Palindrome numbers', category: 'special_num',
    test: (e) => e.type === 'number' && isPalindrome(e.value) },

  // TIER 4 - Complex (6 rules)
  { id: 'R28', tier: 4, label: 'Tens > units digit', category: 'digit',
    test: (e) => e.type === 'number' && e.value >= 10 && Math.floor(e.value / 10) > (e.value % 10) },
  { id: 'R29', tier: 4, label: 'Divisible by 6', category: 'divisibility',
    test: (e) => e.type === 'number' && e.value % 6 === 0 },
  { id: 'R30', tier: 4, label: 'Value > 70', category: 'range',
    test: (e) => e.type === 'number' && e.value > 70 },
  { id: 'R31', tier: 4, label: 'Multiples of 7', category: 'divisibility',
    test: (e) => e.type === 'number' && e.value % 7 === 0 },
  { id: 'R32', tier: 4, label: 'Fibonacci numbers', category: 'special_num',
    test: (e) => e.type === 'number' && FIBONACCI.has(e.value) },
  { id: 'R33', tier: 4, label: 'Digit sum is even', category: 'digit',
    test: (e) => e.type === 'number' && digitSum(e.value) % 2 === 0 }
];

// Incompatible rule pairs - rules that cannot coexist on circles with intersection
const INCOMPATIBLE_PAIRS = [
  ['R01', 'R02'],  // even vs odd
  ['R04', 'R05'],  // >50 vs <30 (no overlap)
  ['R06', 'R07'],  // red vs blue
  ['R06', 'R24'],  // red vs NOT red
  ['R07', 'R24'],  // blue vs NOT blue
  ['R08', 'R09'],  // round vs pointy
  ['R08', 'R22'],  // round vs NOT round
  ['R01', 'R15'],  // even vs (prime AND odd) - only 2 is prime+even
  ['R04', 'R12'],  // >50 vs (mult5 AND <50)
  ['R13', 'R14'],  // red+round vs blue+pointy
  ['R13', 'R09'],  // red+round vs pointy
  ['R14', 'R08'],  // blue+pointy vs round
  ['R20', 'R24'],  // (red OR blue) vs (NOT red AND NOT blue)
  ['R04', 'R30'],  // >50 and >70 - too similar
  ['R26', 'R25'],  // palindromes vs digit sum >9 - tiny overlap
];

// Build lookup set for fast compatibility checks
const INCOMPATIBLE_SET = new Set();
INCOMPATIBLE_PAIRS.forEach(([a, b]) => {
  INCOMPATIBLE_SET.add(a + '|' + b);
  INCOMPATIBLE_SET.add(b + '|' + a);
});

function areRulesCompatible(rA, rB, rC) {
  if (INCOMPATIBLE_SET.has(rA.id + '|' + rB.id)) return false;
  if (INCOMPATIBLE_SET.has(rA.id + '|' + rC.id)) return false;
  if (INCOMPATIBLE_SET.has(rB.id + '|' + rC.id)) return false;
  // Also reject if all three are same category (boring)
  if (rA.category === rB.category && rB.category === rC.category) return false;
  return true;
}
