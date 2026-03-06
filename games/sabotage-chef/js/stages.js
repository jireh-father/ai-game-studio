// stages.js - Stage generation + GameScene update methods (judge AI, belt, effects)

function generateStageParams(stageNumber) {
    var s = stageNumber;
    return {
        stageNumber: s,
        judgeSpeed: Math.min(DIFFICULTY.BASE_JUDGE_SPEED + s * DIFFICULTY.JUDGE_SPEED_PER_STAGE, DIFFICULTY.MAX_JUDGE_SPEED),
        coneWidth: Math.min(DIFFICULTY.BASE_CONE_W + s * DIFFICULTY.CONE_W_PER_STAGE, DIFFICULTY.MAX_CONE_W),
        coneLength: Math.min(DIFFICULTY.BASE_CONE_L + s * DIFFICULTY.CONE_L_PER_STAGE, DIFFICULTY.MAX_CONE_L),
        beltSpeed: Math.min(DIFFICULTY.BASE_BELT_SPEED + s * DIFFICULTY.BELT_SPEED_PER_STAGE, DIFFICULTY.MAX_BELT_SPEED),
        sabotageRatio: Math.max(DIFFICULTY.MIN_SAB_RATIO, DIFFICULTY.BASE_SAB_RATIO - s * DIFFICULTY.SAB_RATIO_PER_STAGE),
        ingredientSpacing: Math.max(DIFFICULTY.MIN_SPACING, DIFFICULTY.BASE_SPACING - s * DIFFICULTY.SPACING_PER_STAGE),
        recipeTimer: Math.max(DIFFICULTY.MIN_TIMER, DIFFICULTY.BASE_TIMER - s * DIFFICULTY.TIMER_PER_STAGE),
        irregularity: Math.min(s * DIFFICULTY.IRREGULARITY_PER_STAGE, DIFFICULTY.MAX_IRREGULARITY),
        glanceBackChance: s >= DIFFICULTY.GLANCE_START_STAGE ? Math.min((s - 12) * DIFFICULTY.GLANCE_PER_STAGE, DIFFICULTY.MAX_GLANCE) : 0,
        isRest: isRestStage(s),
        isBoss: isBossStage(s)
    };
}

function isRestStage(n) { return n > 1 && n % 5 === 0 && n % 10 !== 0; }
function isBossStage(n) { return n > 1 && n % 10 === 0; }

function getBossModifiers(p) {
    return {
        judgeSpeed: Math.min(p.judgeSpeed * 1.5, DIFFICULTY.MAX_JUDGE_SPEED * 1.2),
        coneWidth: p.coneWidth, secondConeWidth: p.coneWidth * 0.6,
        coneLength: p.coneLength, beltSpeed: p.beltSpeed, sabotageRatio: p.sabotageRatio,
        ingredientSpacing: p.ingredientSpacing, recipeTimer: p.recipeTimer,
        irregularity: p.irregularity, glanceBackChance: p.glanceBackChance,
        isRest: false, isBoss: true, stageNumber: p.stageNumber
    };
}

function generateBeltIngredient(sabotageRatio, recentNormalCount) {
    var normals = INGREDIENT_TYPES.filter(function(t) { return !t.isSabotage; });
    var sabotages = INGREDIENT_TYPES.filter(function(t) { return t.isSabotage; });
    if (recentNormalCount >= 4) return normals[Math.floor(Math.random() * normals.length)];
    if (Math.random() < sabotageRatio) return sabotages[Math.floor(Math.random() * sabotages.length)];
    return normals[Math.floor(Math.random() * normals.length)];
}

function getSlotPositions() {
    var cx = DIMENSIONS.WIDTH / 2;
    var cy = DIMENSIONS.SLOT_GRID_Y + DIMENSIONS.STATION_Y;
    var half = DIMENSIONS.SLOT_SIZE / 2 + DIMENSIONS.SLOT_GAP / 2;
    return [
        { x: cx - half, y: cy - half }, { x: cx + half, y: cy - half },
        { x: cx - half, y: cy + half }, { x: cx + half, y: cy + half }
    ];
}

// -- GameScene update methods (added after class definition in game.js) --

function _gsUpdate(time, delta) {
    if (this.state.gameOver || this.state.paused || this.state.stageTransitioning) return;
    var dt = delta / 1000;
    if (this.state.restFreeTime > 0) this.state.restFreeTime -= dt;
    this.state.recipeTimeLeft -= dt;
    _gsUpdateTimerBar.call(this);
    if (this.state.recipeTimeLeft <= 0) {
        this.state.recipeTimeLeft = 0;
        _gsHandleInactivityDeath.call(this);
        return;
    }
    _gsUpdateBelt.call(this, dt);
    _gsUpdateJudge.call(this, dt);
    _gsUpdateGlance.call(this, dt);
}

function _gsUpdateBelt(dt) {
    var speed = this.stageParams.beltSpeed;
    var toRemove = [];
    for (var i = 0; i < this.beltIngredients.length; i++) {
        var ing = this.beltIngredients[i];
        if (!ing.onBelt) continue;
        ing.x -= speed * dt;
        if (ing.x < -30) toRemove.push(i);
    }
    for (var j = toRemove.length - 1; j >= 0; j--) {
        this.beltIngredients[toRemove[j]].destroy();
        this.beltIngredients.splice(toRemove[j], 1);
    }
    this.spawnTimer += dt;
    var interval = this.stageParams.ingredientSpacing / speed;
    if (this.spawnTimer >= interval) {
        this.spawnTimer -= interval;
        this.spawnIngredient(DIMENSIONS.WIDTH + 30);
    }
}

function _gsUpdateJudge(dt) {
    if (this.judgePaused) {
        this.judgePauseTimer -= dt;
        if (this.judgePauseTimer <= 0) this.judgePaused = false;
        return;
    }
    this.judgeX += this.judgeDir * this.stageParams.judgeSpeed * dt;
    var irr = this.stageParams.irregularity;
    if (irr > 0.3 && Math.random() < 0.005 * irr) {
        this.judgePaused = true;
        this.judgePauseTimer = Phaser.Math.Between(JUDGE_PATROL.MID_PAUSE_MIN, JUDGE_PATROL.MID_PAUSE_MAX) / 1000;
    }
    if (irr > 0.6 && Math.random() < 0.003 * irr) this.judgeDir *= -1;
    if (this.judgeX >= JUDGE_PATROL.MAX_X) {
        this.judgeX = JUDGE_PATROL.MAX_X; this.judgeDir = -1; this.judgePaused = true;
        this.judgePauseTimer = Phaser.Math.Between(JUDGE_PATROL.PAUSE_MIN, JUDGE_PATROL.PAUSE_MAX) / 1000;
    } else if (this.judgeX <= JUDGE_PATROL.MIN_X) {
        this.judgeX = JUDGE_PATROL.MIN_X; this.judgeDir = 1; this.judgePaused = true;
        this.judgePauseTimer = Phaser.Math.Between(JUDGE_PATROL.PAUSE_MIN, JUDGE_PATROL.PAUSE_MAX) / 1000;
    }
    this.judge.x = this.judgeX;
    this.judge.setFlipX(this.judgeDir < 0);
    _gsUpdateVisionCone.call(this);
}

function _gsUpdateVisionCone() {
    var hw = this.stageParams.coneWidth / 2;
    var cl = this.stageParams.coneLength;
    var offset = this.judgeDir * 15;
    var jx = this.judgeX + offset;
    var jy = DIMENSIONS.JUDGE_Y + 30;
    // Reuse persistent Graphics object — clear and redraw each frame (no GC pressure)
    this.visionGfx.clear();
    // Main vision cone
    this.visionGfx.fillStyle(0xFF4444, 0.25);
    this.visionGfx.lineStyle(1, 0xFF4444, 0.4);
    this.visionGfx.beginPath();
    this.visionGfx.moveTo(jx, jy);
    this.visionGfx.lineTo(jx - hw, jy + cl);
    this.visionGfx.lineTo(jx + hw, jy + cl);
    this.visionGfx.closePath();
    this.visionGfx.fillPath();
    this.visionGfx.strokePath();
    // Glance-back cone (if active)
    if (this.glanceActive) {
        var ghw = hw * 0.5, gcl = cl * 0.6, gjx = this.judgeX - offset;
        this.visionGfx.fillStyle(0xFF4444, 0.15);
        this.visionGfx.beginPath();
        this.visionGfx.moveTo(gjx, jy);
        this.visionGfx.lineTo(gjx - ghw, jy + gcl);
        this.visionGfx.lineTo(gjx + ghw, jy + gcl);
        this.visionGfx.closePath();
        this.visionGfx.fillPath();
    }
}

function _gsUpdateGlance(dt) {
    if (this.stageParams.glanceBackChance <= 0) return;
    this.glanceTimer -= dt;
    if (this.glanceTimer <= 0) {
        this.glanceTimer = 5.0;
        if (Math.random() < this.stageParams.glanceBackChance) {
            this.glanceActive = true;
            // Glance cone is now drawn by _gsUpdateVisionCone via shared Graphics — no object creation needed
            var self = this;
            this.time.delayedCall(400, function() {
                self.glanceActive = false;
            });
        }
    }
}

function _gsUpdateTimerBar() {
    var ratio = this.state.recipeTimeLeft / this.state.recipeTimeMax;
    this.timerBar.setDisplaySize((DIMENSIONS.WIDTH - 20) * Math.max(0, ratio), DIMENSIONS.TIMER_H - 4);
    this.timerBar.setFillStyle(ratio > 0.5 ? 0x00E676 : (ratio > 0.25 ? 0xFFD700 : 0xFF2D2D));
}

function _gsCheckJudgeVision(slotX, slotY) {
    var hw = this.stageParams.coneWidth / 2;
    var cl = this.stageParams.coneLength;
    var jy = DIMENSIONS.JUDGE_Y + 30;
    var offset = this.judgeDir * 15;
    var ax = this.judgeX + offset, ay = jy;
    if (_pointInTri(slotX, slotY, ax, ay, ax - hw, jy + cl, ax + hw, jy + cl)) return true;
    if (this.glanceActive) {
        var goff = -offset;
        var gx = this.judgeX + goff;
        if (_pointInTri(slotX, slotY, gx, jy, gx - hw*0.5, jy + cl*0.6, gx + hw*0.5, jy + cl*0.6)) return true;
    }
    return false;
}

function _pointInTri(px, py, ax, ay, bx, by, cx, cy) {
    var d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    var d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    var d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function _gsHandleInactivityDeath() {
    if (this.state.gameOver || this.state.stageTransitioning) return;
    this.showFloatingText(DIMENSIONS.WIDTH / 2, 150, 'DISH BURNED!', COLORS.DANGER, 28, 800);
    this.createBurst(DIMENSIONS.WIDTH / 2, 140, 8, 0xFF4500);
    this.cameras.main.shake(400, 0.03);
    this.loseLife();
    if (!this.state.gameOver) {
        this.state.stageTransitioning = true;
        var self = this;
        this.time.delayedCall(500, function() { _gsTransitionToNextStage.call(self); });
    }
}

function _gsTransitionToNextStage() {
    for (var i = 0; i < 4; i++) {
        if (this.slotContents[i]) { this.slotContents[i].destroy(); this.slotContents[i] = null; }
        this.slots[i].filled = false;
    }
    this.beltIngredients.forEach(function(ing) { ing.destroy(); });
    this.beltIngredients = [];
    this.state.stage++; this.state.slotsFilled = 0; this.state.sabotageCount = 0;
    this.stageParams = generateStageParams(this.state.stage);
    if (this.stageParams.isBoss) this.stageParams = getBossModifiers(this.stageParams);
    this.state.recipeTimeMax = this.stageParams.recipeTimer;
    this.state.recipeTimeLeft = this.stageParams.recipeTimer;
    this.recentNormalCount = 0;
    if (this.stageParams.isRest) this.state.restFreeTime = 3.0;
    this.showFloatingText(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2 - 60, 'Dish #' + this.state.stage, COLORS.HUD_TEXT, 28, 800);
    if (this.stageParams.isRest) this.showFloatingText(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2, 'COMMERCIAL BREAK!', COLORS.COMBO_GOLD, 22, 1000);
    if (this.stageParams.isBoss) this.showFloatingText(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2, 'HEAD CHEF!', COLORS.DANGER, 30, 1000);
    var self = this;
    this.time.delayedCall(400, function() {
        self.spawnInitialIngredients();
        self.state.stageTransitioning = false;
        self.events.emit('stageUpdate');
    });
}

function _gsShowFloatingText(x, y, text, color, size, duration) {
    var t = this.add.text(x, y, text, {
        fontSize: size + 'px', fontFamily: 'Arial', fontStyle: 'bold',
        color: color, stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: duration,
        onComplete: function() { t.destroy(); } });
}

function _gsCreateBurst(x, y, count, color) {
    for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 / count) * i;
        var speed = 80 + Math.random() * 80;
        var p = this.add.circle(x, y, 4, color).setDepth(25);
        this.tweens.add({
            targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
            alpha: 0, duration: 400, onComplete: function() { p.destroy(); }
        });
    }
}
