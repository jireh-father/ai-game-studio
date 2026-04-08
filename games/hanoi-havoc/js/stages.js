// Generate a disc sequence for a stage.
// Returns array of sizes. We produce a solvable sequence: always include
// exactly `discCount` unique sizes starting from 1..discCount, shuffled but
// ensuring the player can always place each (all sizes 1..N always legal if stacked small-on-big).
function generateDiscSequence(stage) {
  const p = getStageParams(stage);
  const n = p.discCount;
  const sizes = [];
  for (let i = 1; i <= n; i++) sizes.push(i);
  // Seed with session entropy
  const seed = stage * 7919 + (Date.now() % 100000);
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  // Early stages: easier order (largest first). Later: shuffle.
  if (stage <= 3) {
    sizes.sort((a, b) => b - a);
  } else {
    for (let i = sizes.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
    }
  }
  // Rest stage: insert a golden size-1 if stage % 5 === 0
  if (stage % 5 === 0) sizes.unshift(1);
  return sizes;
}

function isLegalPlacement(incomingSize, pegStack) {
  if (!pegStack || pegStack.length === 0) return true;
  const top = pegStack[pegStack.length - 1];
  return incomingSize < top;
}

function getPegTopSize(pegStack) {
  if (!pegStack || pegStack.length === 0) return Infinity;
  return pegStack[pegStack.length - 1];
}
