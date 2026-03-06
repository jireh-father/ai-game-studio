// stages.js - Stage generation, difficulty, component placement, fix options

class SeededRNG {
    constructor(seed) { this.seed = seed % 2147483647; if (this.seed <= 0) this.seed += 2147483646; }
    next() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; }
    nextInt(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
    pick(arr) { return arr[this.nextInt(0, arr.length - 1)]; }
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) { const j = this.nextInt(0, i); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
}

function getDifficultyParams(stageNumber) {
    for (const d of DIFFICULTY_TABLE) {
        if (stageNumber >= d.minStage && stageNumber <= d.maxStage) return { ...d };
    }
    return { ...DIFFICULTY_TABLE[DIFFICULTY_TABLE.length - 1] };
}

function isRestStage(n) { return n > 1 && n % 5 === 0 && n % 10 !== 0; }
function isBossStage(n) { return n > 1 && n % 10 === 0; }

function getAvailableTypes(stageNumber) {
    return COMPONENT_TYPES.filter(t => t.unlockStage <= stageNumber);
}

function generateFixOptions(rootType, rng) {
    const bank = FIX_BANKS[rootType];
    if (!bank) return [
        { text: 'Fix it', type: 'correct' },
        { text: 'Adjust it', type: 'plausible' },
        { text: 'Kick it', type: 'absurd' }
    ];
    const correct = { text: rng.pick(bank.correct), type: 'correct' };
    const plausible = { text: rng.pick(bank.plausible), type: 'plausible' };
    const absurd = { text: rng.pick(bank.absurd), type: 'absurd' };
    return rng.shuffle([correct, plausible, absurd]);
}

function generateStage(stageNumber, sessionSalt) {
    const seed = stageNumber * 7919 + (sessionSalt || 0);
    const rng = new SeededRNG(seed);
    const diff = getDifficultyParams(stageNumber);
    let rest = isRestStage(stageNumber);
    let boss = isBossStage(stageNumber);

    let compCount = diff.components;
    let parTime = diff.parTime;
    let cascadeSpeed = diff.cascadeSpeed;

    if (rest) {
        compCount = Math.max(5, compCount - 2);
        parTime += 3;
    }

    const availTypes = getAvailableTypes(stageNumber);
    const components = [];
    for (let i = 0; i < compCount; i++) {
        const typeObj = rng.pick(availTypes);
        components.push({
            index: i,
            type: typeObj.name,
            label: typeObj.label,
            failed: false,
            isRootCause: false,
            isDecoy: false,
            x: 0, y: 0
        });
    }

    // Place root cause in left portion
    const maxRootIdx = Math.max(0, Math.floor(compCount * diff.rootDepth) - 1);
    const rootIdx = rng.nextInt(0, maxRootIdx);
    components[rootIdx].isRootCause = true;

    // Place decoys (not on root cause, not adjacent to root)
    let decoyCount = rest ? 0 : diff.decoys;
    let placed = 0;
    for (let i = 0; i < compCount && placed < decoyCount; i++) {
        if (i !== rootIdx && Math.abs(i - rootIdx) > 1 && i > rootIdx) {
            components[i].isDecoy = true;
            placed++;
        }
    }

    // Layout positions
    const spacing = GAME_SETTINGS.COMPONENT_SPACING;
    const startX = GAME_SETTINGS.MACHINE_PAD;
    const baseY = GAME_SETTINGS.COMPONENT_Y;
    for (let i = 0; i < compCount; i++) {
        components[i].x = startX + i * spacing;
        components[i].y = baseY + rng.nextInt(-20, 20);
    }

    const machineWidth = startX + (compCount - 1) * spacing + GAME_SETTINGS.MACHINE_PAD;
    const fixOptions = generateFixOptions(components[rootIdx].type, rng);

    return {
        stageNumber,
        components,
        rootCauseIndex: rootIdx,
        fixOptions,
        machineWidth,
        cascadeSpeed,
        parTime,
        isRest: rest,
        isBoss: boss,
        compCount
    };
}
