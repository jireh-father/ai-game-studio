// stages.js — Stage generation, form construction, rule selection, evaluation

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getDifficultyParams(stageNumber) {
  for (let i = DIFFICULTY.length - 1; i >= 0; i--) {
    if (stageNumber >= DIFFICULTY[i].stageMin) return DIFFICULTY[i];
  }
  return DIFFICULTY[0];
}

function getDecisionWindow(stageNumber) {
  return getDifficultyParams(stageNumber).decisionWindow;
}

function getFormsPerStage(stageNumber) {
  return Math.min(4 + Math.floor(stageNumber / 2), 12);
}

function getAvailableApplicants(stageNumber) {
  const count = Math.min(4 + stageNumber, ICON_APPLICANTS.length);
  return ICON_APPLICANTS.slice(0, count);
}

function getAvailableRequests(stageNumber) {
  const count = Math.min(3 + Math.floor(stageNumber / 1.5), ICON_REQUESTS.length);
  return ICON_REQUESTS.slice(0, count);
}

function getAvailableRules(stageNumber) {
  let available = RULE_LIBRARY.filter(r => r.tier === 1);
  if (stageNumber >= 5) available = available.concat(RULE_LIBRARY.filter(r => r.tier === 2));
  if (stageNumber >= 10) available = available.concat(RULE_LIBRARY.filter(r => r.tier === 3));
  return available;
}

function selectRules(stageNumber, rng) {
  const params = getDifficultyParams(stageNumber);
  const available = getAvailableRules(stageNumber);
  const count = params.ruleCount;

  // Shuffle and pick
  const shuffled = available.slice().sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // Mark one as flippable if applicable
  if (params.ruleFlipChance > 0 && rng() < params.ruleFlipChance && selected.length > 0) {
    const flipIdx = Math.floor(rng() * selected.length);
    selected[flipIdx] = { ...selected[flipIdx], flippable: true };
  }

  return selected;
}

function rollModifier(stageNumber, rng) {
  const params = getDifficultyParams(stageNumber);
  const roll = rng();
  if (params.overrideChance > 0 && roll < 0.05) return 'override';
  if (roll < 0.15) return 'restricted';
  if (roll < 0.30) return 'urgent';
  return 'none';
}

function evaluateForm(form, rules) {
  // Override badge always approve
  if (form.modifier === 'override') return 'approve';
  // Urgent badge always approve
  if (form.modifier === 'urgent') {
    // Check if urgent rule is active
    const urgentRule = rules.find(r => r.id === 'R07');
    if (urgentRule) return urgentRule.flipped ? 'deny' : 'approve';
  }
  // Restricted badge always deny
  if (form.modifier === 'restricted') {
    const restrictedRule = rules.find(r => r.id === 'R10');
    if (restrictedRule) return restrictedRule.flipped ? 'approve' : 'deny';
  }

  // Check each rule in priority order
  for (const rule of rules) {
    if (rule.check(form)) {
      const verdict = rule.flipped ? (rule.verdict === 'approve' ? 'deny' : 'approve') : rule.verdict;
      return verdict;
    }
  }

  // Default: approve (no rule applies)
  return 'approve';
}

function generateForm(stageNumber, rules, rng, prevForm) {
  const applicants = getAvailableApplicants(stageNumber);
  const requests = getAvailableRequests(stageNumber);

  let applicant, request, attempts = 0;
  do {
    applicant = applicants[Math.floor(rng() * applicants.length)];
    request = requests[Math.floor(rng() * requests.length)];
    attempts++;
  } while (prevForm && prevForm.applicant === applicant && prevForm.request === request && attempts < 10);

  const time = ICON_TIMES[Math.floor(rng() * ICON_TIMES.length)];
  const modifier = rollModifier(stageNumber, rng);

  const form = { applicant, request, time, modifier };
  form.correctVerdict = evaluateForm(form, rules);

  return form;
}

function generateStage(stageNumber) {
  const seed = stageNumber * 7919 + Math.floor(Date.now() / 1000) % 100000;
  const rng = seededRandom(seed);
  const params = getDifficultyParams(stageNumber);
  const formCount = getFormsPerStage(stageNumber);
  const rules = selectRules(stageNumber, rng);

  // Generate forms
  const forms = [];
  for (let i = 0; i < formCount; i++) {
    const prevForm = forms.length > 0 ? forms[forms.length - 1] : null;
    const form = generateForm(stageNumber, rules, rng, prevForm);
    forms.push(form);
  }

  // Rest stage: every 5 stages, first form is trivially obvious
  if (stageNumber % 5 === 0 && forms.length > 0) {
    // Make first form match the most prominent rule obviously
    if (rules.length > 0) {
      forms[0].correctVerdict = evaluateForm(forms[0], rules);
    }
  }

  // Ensure at least one approve and one deny if enough forms
  if (forms.length >= 4) {
    const hasApprove = forms.some(f => f.correctVerdict === 'approve');
    const hasDeny = forms.some(f => f.correctVerdict === 'deny');
    if (!hasApprove) forms[0].correctVerdict = 'approve';
    if (!hasDeny && forms.length > 1) forms[1].correctVerdict = 'deny';
  }

  return {
    forms,
    rules: rules.map(r => ({ ...r, flipped: false })),
    decisionWindow: params.decisionWindow,
    stageNumber,
    ruleFlipChance: params.ruleFlipChance
  };
}

// Get display-friendly name for icons
function getIconLabel(key) {
  const labels = {
    human: 'Human', ghost: 'Ghost', robot: 'Robot', werewolf: 'Werewolf',
    dragon: 'Dragon', wizard: 'Wizard', vampire: 'Vampire', alien: 'Alien',
    skeleton: 'Skeleton', golem: 'Golem', mermaid: 'Mermaid', phoenix: 'Phoenix',
    noise: 'Noise', flame: 'Flame', overtime: 'Overtime', haunting: 'Haunting',
    flight: 'Flight', magic: 'Magic', parking: 'Parking', demolition: 'Demolition',
    loud: 'Loud', transform: 'Transform',
    dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night',
    urgent: 'URGENT', restricted: 'RESTRICTED', override: 'OVERRIDE',
    'no-dragon': 'Not Dragon'
  };
  return labels[key] || key;
}
