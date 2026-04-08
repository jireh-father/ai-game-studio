// Liar's Tower — Statement generator + constraint-propagation solver
// Each character refers to an already-placed character (index < current).
// Statement types:
//   'direct_k' : "X is a Knight"      -> truth: target==K
//   'direct_l' : "X is a Liar"        -> truth: target==L
//   'same'     : "X and I are same"   -> truth: target==self (tier 2+)
//   'diff'     : "X and I differ"     -> truth: target!=self (tier 2+)
//   'group_k'  : "All below me are Knights" -> truth: every prev is K (tier 3+)
//   'group_l'  : "At least one below me is a Liar" -> truth: any prev is L (tier 3+)
//
// Eval(statement, self, chain) returns boolean truth value of statement.
// A knight's stated truth must be TRUE, a liar's must be FALSE.
// So: valid(self, stmt) iff (self==K) == eval(stmt, self, chain)

function evalStmt(stmt, selfType, chain) {
  switch (stmt.type) {
    case 'direct_k': return chain[stmt.target].type === 'K';
    case 'direct_l': return chain[stmt.target].type === 'L';
    case 'same':     return chain[stmt.target].type === selfType;
    case 'diff':     return chain[stmt.target].type !== selfType;
    case 'group_k':  return chain.every(c => c.type === 'K');
    case 'group_l':  return chain.some(c => c.type === 'L');
  }
  return true;
}

function isValid(selfType, stmt, chain) {
  const truth = evalStmt(stmt, selfType, chain);
  return (selfType === 'K') === truth;
}

// Given a fully-typed chain and a new statement for a new character,
// count how many of {K, L} are consistent. Returns { K: bool, L: bool }.
function consistencyCheck(stmt, chain) {
  return {
    K: isValid('K', stmt, chain),
    L: isValid('L', stmt, chain),
  };
}

// Random helpers (with session-entropy seed at call site)
function rnd(max) { return Math.floor(Math.random() * max); }
function coin() { return Math.random() < 0.5 ? 'K' : 'L'; }

// Build a stage: 5 characters, first one has no reference (declared fact bootstrap),
// subsequent characters reference one prior member via a direct statement.
// Guarantees: each new character has exactly ONE consistent type (unique solution).
function generateStage(stageNumber) {
  const tier = getTier(stageNumber);
  const len = STAGE_LEN;
  let iter = 0;

  // Try up to SOLVER_MAX_ITER total attempts across regeneration
  while (iter < SOLVER_MAX_ITER) {
    iter++;
    const chain = [];

    // Character 0: bootstrap. Given directly as "fact" — no statement, shown as a
    // declared anchor. We assign it a random type and show "I am placed as X" info.
    // But to keep pure deduction, we make char 0 carry a forced-true tautology: we
    // reveal its type in the statement text as a GIVEN. The player must still swipe
    // correctly based on the displayed fact.
    const firstType = coin();
    chain.push({
      type: firstType,
      stmt: { type: 'given', declared: firstType },
      answer: firstType,
      text: `The scribe declares: this one is a ${firstType === 'K' ? 'KNIGHT' : 'LIAR'}.`,
      free: false,
    });

    let ok = true;
    for (let i = 1; i < len; i++) {
      // Try to build a statement that yields UNIQUE solution
      let placed = false;
      for (let attempt = 0; attempt < 40 && iter < SOLVER_MAX_ITER; attempt++) {
        iter++;
        const stmt = randomStmt(tier, i, chain);
        const cons = consistencyCheck(stmt, chain);
        if (cons.K && !cons.L) {
          chain.push({ type: 'K', stmt, answer: 'K', text: stmtText(stmt, chain), free: false });
          placed = true; break;
        }
        if (cons.L && !cons.K) {
          chain.push({ type: 'L', stmt, answer: 'L', text: stmtText(stmt, chain), free: false });
          placed = true; break;
        }
        // both valid = free choice; both invalid = unsat — try another statement
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return chain;
  }
  // Fallback: simple chain of direct_k statements referencing char 0
  const chain = [];
  const t0 = coin();
  chain.push({ type: t0, stmt: { type: 'given', declared: t0 }, answer: t0,
    text: `The scribe declares: this one is a ${t0 === 'K' ? 'KNIGHT' : 'LIAR'}.`, free: false });
  for (let i = 1; i < len; i++) {
    const targetIdx = 0;
    const targetType = chain[targetIdx].type;
    const stmt = { type: targetType === 'K' ? 'direct_k' : 'direct_l', target: targetIdx };
    // Truth is TRUE, so speaker must be K
    chain.push({ type: 'K', stmt, answer: 'K', text: stmtText(stmt, chain), free: false });
  }
  return chain;
}

function randomStmt(tier, selfIdx, chain) {
  const target = rnd(selfIdx); // reference a prior character
  if (tier <= 1) {
    // Direct reference only
    return Math.random() < 0.5
      ? { type: 'direct_k', target }
      : { type: 'direct_l', target };
  }
  if (tier === 2) {
    const r = Math.random();
    if (r < 0.4) return { type: 'direct_k', target };
    if (r < 0.7) return { type: 'direct_l', target };
    if (r < 0.85) return { type: 'same', target };
    return { type: 'diff', target };
  }
  // tier 3: add group statements
  const r = Math.random();
  if (r < 0.3) return { type: 'direct_k', target };
  if (r < 0.55) return { type: 'direct_l', target };
  if (r < 0.7) return { type: 'same', target };
  if (r < 0.85) return { type: 'diff', target };
  if (r < 0.93) return { type: 'group_k' };
  return { type: 'group_l' };
}

function stmtText(stmt, chain) {
  const ord = (i) => `#${i + 1}`;
  switch (stmt.type) {
    case 'direct_k': return `"${ord(stmt.target)} below is a KNIGHT."`;
    case 'direct_l': return `"${ord(stmt.target)} below is a LIAR."`;
    case 'same':     return `"${ord(stmt.target)} is the SAME as me."`;
    case 'diff':     return `"${ord(stmt.target)} is DIFFERENT from me."`;
    case 'group_k':  return `"Everyone below me is a KNIGHT."`;
    case 'group_l':  return `"At least one below me is a LIAR."`;
  }
  return '...';
}
