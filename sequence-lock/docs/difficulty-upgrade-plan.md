# Sequence Lock - Infinite Stage Difficulty Upgrade Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Reverse stages, Odd/Even-only stages, Missing Number (gap) stages, and reorganize the entire difficulty system into a clean infinite-stage progression.

**Architecture:** Stage types are defined as a `stageRule` property in `getStageParams()`. The rule determines which numbers appear and in what order the player must tap them. `generateGrid()` builds the grid based on the rule, and `game.js` checks tap correctness against a `expectedSequence` array (instead of simple `nextExpected++`). Visual indicators (banners, tile colors, background tint) clearly communicate the current rule.

**Tech Stack:** Phaser 3, vanilla JS, existing 7-file structure (config.js, stages.js, game.js, ui.js, help.js, ads.js, main.js)

---

## Current State Analysis

- **Grid sizes**: 3x3 (stages 1-4), 4x4 (5-12), 5x5 (13+)
- **Existing modifiers**: MIRROR, ROTATION, GHOST, DECOY, DRIFT (stage 13+)
- **Rest stages**: every 5th (not 10th), easy 3x3
- **Challenge stages**: every 10th, 5x5 with bonus time
- **game.js**: 702 lines (already large), tracks `nextExpected` incrementally

## New Stage Rules

| Rule | Description | Visual | First Appears |
|------|-------------|--------|---------------|
| `NORMAL` | Tap 1→2→3→...→N (current) | Default cyan theme | Stage 1 |
| `REVERSE` | Tap N→N-1→...→1 | Red/orange border, "REVERSE" banner, arrows ↓ on tiles | Stage 8 |
| `ODD_ONLY` | Tap odd numbers only: 1→3→5→... | Green highlight, "ODD" badge | Stage 15 |
| `EVEN_ONLY` | Tap even numbers only: 2→4→6→... | Purple highlight, "EVEN" badge | Stage 18 |
| `GAPS` | Some numbers missing from grid, tap remaining in order | Missing slots shown as dark holes | Stage 12 |
| `REVERSE_GAPS` | Reverse + gaps combined | Red + holes | Stage 25 |
| `ODD_REVERSE` | Odd numbers in reverse order | Green + red | Stage 30 |
| `EVEN_GAPS` | Even numbers with gaps | Purple + holes | Stage 35 |

## Stage Progression (Infinite Loop)

```
Stages 1-4:   NORMAL (3x3, tutorial)
Stage 5:      REST
Stages 6-7:   NORMAL (3x3→4x4 transition)
Stage 8-9:    REVERSE (first appearance, 4x4)
Stage 10:     CHALLENGE (NORMAL, 5x5, bonus time)
Stage 11:     NORMAL (4x4)
Stage 12-13:  GAPS (first appearance)
Stage 14:     NORMAL
Stage 15:     REST
Stage 16-17:  ODD_ONLY (first appearance)
Stage 18-19:  EVEN_ONLY (first appearance)
Stage 20:     CHALLENGE (REVERSE, 5x5)
Stages 21-24: Mixed rules cycling
Stage 25:     REST + REVERSE_GAPS intro
Stage 26-29:  Cycling all rules with modifiers
Stage 30:     CHALLENGE (ODD_REVERSE)
Stages 31+:   Weighted random from all rules, difficulty escalates infinitely
              Every 5th = REST, every 10th = CHALLENGE
              Rule complexity increases: more gaps, combined rules
```

---

### Task 1: Add Stage Rule System to config.js and stages.js

**Files:**
- Modify: `games/sequence-lock/js/config.js`
- Modify: `games/sequence-lock/js/stages.js`

- [ ] **Step 1: Add rule constants and colors to config.js**

Add after `MODIFIER_TYPES` line (line 59):

```javascript
const STAGE_RULES = ['NORMAL', 'REVERSE', 'ODD_ONLY', 'EVEN_ONLY', 'GAPS', 'REVERSE_GAPS', 'ODD_REVERSE', 'EVEN_GAPS'];

const RULE_COLORS = {
    NORMAL: { border: '#00E5FF', bg: '#050A0F', label: '' },
    REVERSE: { border: '#FF6B00', bg: '#1A0800', label: 'REVERSE' },
    ODD_ONLY: { border: '#39FF14', bg: '#001A00', label: 'ODD ONLY' },
    EVEN_ONLY: { border: '#B24BF3', bg: '#0D001A', label: 'EVEN ONLY' },
    GAPS: { border: '#FF1744', bg: '#1A0005', label: 'GAPS' },
    REVERSE_GAPS: { border: '#FF6B00', bg: '#1A0005', label: 'REVERSE + GAPS' },
    ODD_REVERSE: { border: '#39FF14', bg: '#1A0800', label: 'ODD REVERSE' },
    EVEN_GAPS: { border: '#B24BF3', bg: '#1A0005', label: 'EVEN + GAPS' }
};

const RULE_INTRO_STAGES = {
    NORMAL: 1, REVERSE: 8, GAPS: 12, ODD_ONLY: 15, EVEN_ONLY: 18,
    REVERSE_GAPS: 25, ODD_REVERSE: 30, EVEN_GAPS: 35
};
```

- [ ] **Step 2: Add `getStageRule()` function to stages.js**

Add after `getStageParams()` function:

```javascript
function getStageRule(stageNumber) {
    // Rest stages are always NORMAL
    if (stageNumber % 5 === 0 && stageNumber % 10 !== 0) return 'NORMAL';

    // Challenge stages rotate through rules
    if (stageNumber % 10 === 0) {
        const challengeRules = ['NORMAL', 'REVERSE', 'ODD_ONLY', 'GAPS', 'REVERSE_GAPS'];
        return challengeRules[Math.floor(stageNumber / 10) % challengeRules.length];
    }

    // Fixed introduction stages
    if (stageNumber < 8) return 'NORMAL';
    if (stageNumber <= 9) return 'REVERSE';
    if (stageNumber === 11) return 'NORMAL';
    if (stageNumber <= 13) return 'GAPS';
    if (stageNumber === 14) return 'NORMAL';
    if (stageNumber <= 17) return stageNumber <= 16 ? 'ODD_ONLY' : 'NORMAL';
    if (stageNumber <= 19) return 'EVEN_ONLY';

    // After stage 20: weighted random based on unlocked rules
    const rng = seededRandom(stageNumber * 5381);
    const available = STAGE_RULES.filter(r => stageNumber >= RULE_INTRO_STAGES[r]);
    // Weight NORMAL lower as more rules unlock
    const weights = available.map(r => r === 'NORMAL' ? 0.5 : 1.0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;
    for (let i = 0; i < available.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return available[i];
    }
    return available[available.length - 1];
}
```

- [ ] **Step 3: Modify `getStageParams()` to include rule**

In `getStageParams()`, add `rule` to the returned object:

```javascript
// At the end of getStageParams, before return:
const rule = getStageRule(stageNumber);
// Add to return: rule, gapCount
const gapCount = (rule.includes('GAPS')) ? Math.min(Math.floor(stageNumber / 8), Math.floor(tileCount * 0.3)) : 0;
```

- [ ] **Step 4: Modify `generateGrid()` to build sequence based on rule**

Replace the number generation section in `generateGrid()`:

```javascript
function buildExpectedSequence(rule, tileCount, gapCount, rng) {
    let allNumbers = [];
    for (let i = 1; i <= tileCount; i++) allNumbers.push(i);

    // Filter by odd/even
    let activeNumbers = allNumbers;
    if (rule === 'ODD_ONLY' || rule === 'ODD_REVERSE') {
        activeNumbers = allNumbers.filter(n => n % 2 === 1);
    } else if (rule === 'EVEN_ONLY' || rule === 'EVEN_GAPS') {
        activeNumbers = allNumbers.filter(n => n % 2 === 0);
    }

    // Remove gaps
    let displayNumbers = activeNumbers.slice();
    if (rule.includes('GAPS') && gapCount > 0) {
        // Remove random numbers from middle (never first or last)
        const removable = displayNumbers.slice(1, -1);
        const shuffledRemovable = shuffleSeeded(removable, Math.floor(rng() * 99999));
        const toRemove = new Set(shuffledRemovable.slice(0, Math.min(gapCount, removable.length)));
        displayNumbers = displayNumbers.filter(n => !toRemove.has(n));
    }

    // Build expected tap sequence
    let expectedSequence;
    if (rule.includes('REVERSE')) {
        expectedSequence = displayNumbers.slice().reverse();
    } else {
        expectedSequence = displayNumbers.slice();
    }

    return { displayNumbers, expectedSequence, inactiveNumbers: allNumbers.filter(n => !displayNumbers.includes(n)) };
}
```

- [ ] **Step 5: Update tile creation in generateGrid to handle inactive tiles (gaps)**

Tiles for gap numbers should appear as dark "holes" — visible but not tappable:

```javascript
// In generateGrid, after building tiles array:
// Mark inactive tiles
const { displayNumbers, expectedSequence, inactiveNumbers } = buildExpectedSequence(
    params.rule, tileCount, params.gapCount, rng
);

tiles.forEach(tile => {
    if (inactiveNumbers.includes(tile.number)) {
        tile.isInactive = true; // Dark hole, not tappable
    }
});
```

- [ ] **Step 6: Commit**

```bash
git add games/sequence-lock/js/config.js games/sequence-lock/js/stages.js
git commit -m "feat(sequence-lock): add stage rule system with REVERSE, ODD/EVEN, GAPS"
```

---

### Task 2: Update game.js to Use expectedSequence Instead of nextExpected++

**Files:**
- Modify: `games/sequence-lock/js/game.js`

- [ ] **Step 1: Store expectedSequence and sequenceIndex in loadStage**

In `loadStage()`, after `generateGrid()`:

```javascript
// Replace: this.nextExpected = 1;
// With:
this.expectedSequence = gridData.expectedSequence || [];
this.sequenceIndex = 0;
this.nextExpected = this.expectedSequence.length > 0 ? this.expectedSequence[0] : 1;
this.currentRule = gridData.params.rule || 'NORMAL';
this.inactiveNumbers = gridData.inactiveNumbers || [];
```

- [ ] **Step 2: Update onCorrectTap to advance sequenceIndex**

In `onCorrectTap()`, replace `this.nextExpected++` with:

```javascript
this.sequenceIndex++;
if (this.sequenceIndex < this.expectedSequence.length) {
    this.nextExpected = this.expectedSequence[this.sequenceIndex];
} else {
    this.nextExpected = -1; // All done
}
```

- [ ] **Step 3: Update recalcNextExpected for bomb power-up**

```javascript
recalcNextExpected() {
    const untapped = this.tileSprites
        .filter(t => t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile && !t.tileData.isInactive)
        .map(t => t.tileData.number);

    // Find next in expectedSequence that is still untapped
    for (let i = this.sequenceIndex; i < this.expectedSequence.length; i++) {
        if (untapped.includes(this.expectedSequence[i])) {
            this.sequenceIndex = i;
            this.nextExpected = this.expectedSequence[i];
            return;
        }
    }
    this.nextExpected = -1; // All cleared
}
```

- [ ] **Step 4: Update stage clear check**

Replace the remaining tiles check:

```javascript
// In onCorrectTap, check stage clear:
const remainingActive = this.tileSprites.filter(t =>
    t.tileData && !t.tileData.isTapped && !t.tileData.isPowerTile && !t.tileData.isInactive
);
if (remainingActive.length === 0) {
    this.onStageClear();
}
```

- [ ] **Step 5: Add rule banner display in loadStage**

After the challenge/rest stage indicators:

```javascript
// Show rule banner for non-NORMAL rules
if (params.rule && params.rule !== 'NORMAL') {
    const ruleInfo = RULE_COLORS[params.rule];
    const ruleBanner = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50, ruleInfo.label, {
        fontFamily: FONT_FAMILY, fontSize: '26px', color: ruleInfo.border, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200);

    // Flash effect
    this.tweens.add({
        targets: ruleBanner, scaleX: { from: 2, to: 1 }, scaleY: { from: 2, to: 1 },
        alpha: { from: 1, to: 0 }, duration: 1200, delay: 300,
        onComplete: () => ruleBanner.destroy()
    });
}
```

- [ ] **Step 6: Update hint text for new rules**

```javascript
// In loadStage, update hint section:
if (stageNum <= 4) {
    this.hintText.setText('NEXT: 1').setAlpha(1);
} else if (this.currentRule !== 'NORMAL' && this.expectedSequence.length > 0) {
    const first3 = this.expectedSequence.slice(0, 3).join('→');
    this.hintText.setText(first3 + '→...').setAlpha(1);
    this.tweens.add({ targets: this.hintText, alpha: 0, duration: 800, delay: 2000 });
} else {
    this.hintText.setAlpha(0);
}
```

- [ ] **Step 7: Render inactive (gap) tiles as dark holes**

In the tile creation loop in `loadStage()`:

```javascript
// After creating sprite, check if inactive
if (tile.isInactive) {
    sprite.setAlpha(0.2).setTint(0x222233);
    sprite.disableInteractive(); // Not tappable
    numText.setText('—').setAlpha(0.3); // Show dash for gap
}
```

- [ ] **Step 8: Add REVERSE arrow indicator on active tiles**

For REVERSE rules, add a small "↓" indicator:

```javascript
// After numText creation, if rule is reverse:
if (params.rule && params.rule.includes('REVERSE') && !tile.isInactive) {
    const arrow = this.add.text(tile.x + tile.tileSize - 4, tile.y + 4, '↓', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: RULE_COLORS[params.rule].border
    }).setOrigin(1, 0).setDepth(12).setAlpha(0);
    this.tweens.add({ targets: arrow, alpha: 0.7, duration: 200, delay: index * 40 });
    this.tileSprites[this.tileSprites.length - 1].arrow = arrow;
}
```

- [ ] **Step 9: Add persistent rule indicator in HUD**

```javascript
// In createHUD(), add rule indicator:
this.ruleIndicator = this.add.text(10, CANVAS_HEIGHT - 30, '', {
    fontFamily: FONT_FAMILY, fontSize: '12px', color: '#666'
}).setDepth(101);
```

Update it in `loadStage()`:

```javascript
if (this.currentRule !== 'NORMAL') {
    const rc = RULE_COLORS[this.currentRule];
    this.ruleIndicator.setText(rc.label).setColor(rc.border).setAlpha(1);
} else {
    this.ruleIndicator.setAlpha(0);
}
```

- [ ] **Step 10: Commit**

```bash
git add games/sequence-lock/js/game.js
git commit -m "feat(sequence-lock): implement rule-based tap sequence (REVERSE, ODD/EVEN, GAPS)"
```

---

### Task 3: Update Help Page with New Rules

**Files:**
- Modify: `games/sequence-lock/js/help.js`

- [ ] **Step 1: Add rule descriptions to help page**

Add a "STAGE RULES" section with icons and descriptions for each rule type:

```javascript
// After existing help content, add:
const rules = [
    { label: 'NORMAL', color: '#00E5FF', desc: 'Tap numbers 1→2→3→...→N' },
    { label: 'REVERSE ↓', color: '#FF6B00', desc: 'Tap numbers N→...→2→1 (backwards!)' },
    { label: 'ODD ONLY', color: '#39FF14', desc: 'Only odd numbers appear. Tap in order.' },
    { label: 'EVEN ONLY', color: '#B24BF3', desc: 'Only even numbers appear. Tap in order.' },
    { label: 'GAPS —', color: '#FF1744', desc: 'Some numbers missing. Tap remaining in order.' },
    { label: 'COMBOS', color: '#FFD700', desc: 'Rules combine at higher stages!' }
];
```

- [ ] **Step 2: Commit**

```bash
git add games/sequence-lock/js/help.js
git commit -m "feat(sequence-lock): update help page with new rule descriptions"
```

---

### Task 4: Integration Testing & Polish

**Files:**
- All modified files

- [ ] **Step 1: Start local server and test all rule types**

```bash
npx http-server games/sequence-lock -p 8080 --cors -c-1
```

Test each rule manually:
- Stage 1-7: NORMAL works as before
- Stage 8-9: REVERSE banner appears, numbers go N→1
- Stage 12-13: GAPS with dark hole tiles
- Stage 15-16: ODD_ONLY with green highlight
- Stage 18-19: EVEN_ONLY with purple highlight
- Stage 20: CHALLENGE with non-NORMAL rule
- Stage 25+: Combined rules appear

- [ ] **Step 2: Verify no console errors across 25+ stages**

- [ ] **Step 3: Verify inactive tiles are not tappable**

- [ ] **Step 4: Verify hint text shows correct sequence preview**

- [ ] **Step 5: Final commit and deploy**

```bash
git add games/sequence-lock/
git commit -m "feat(sequence-lock): complete infinite stage difficulty system with 8 rule types"
```
