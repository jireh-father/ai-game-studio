// water.js - Water flow simulation, flood logic, drain connection

const WaterFlow = {
  startWater(scene, fast) {
    scene.waterStarted = true;
    scene.countdownActive = false;
    scene.currentWaterSpeed = fast ? scene.waterSpeed / 2 : scene.waterSpeed;
    const { sources } = scene.stageData;
    for (const src of sources) {
      scene.flowFronts.push({
        r: src.r, c: src.c + 1, entryDir: DIR.LEFT,
        colorIdx: src.colorIdx, coffeeSlowRemaining: 0
      });
      scene.grid[src.r][src.c].hasWater = true;
      scene.grid[src.r][src.c].waterColor = WATER_COLORS[src.colorIdx];
    }
    sfx.play('waterFlow');
    if (scene.timerBar) scene.timerBar.setFillStyle(0xEF5350);
    if (scene.timerText) scene.timerText.setText('FLOWING!');
  },

  advanceWater(scene) {
    const nextFronts = [];
    for (const front of scene.flowFronts) {
      const { r, c, entryDir, colorIdx, coffeeSlowRemaining } = front;
      if (r < 0 || r >= scene.rows || c < 0 || c >= scene.cols) {
        WaterFlow.triggerFlood(scene, r, c); continue;
      }
      const cell = scene.grid[r][c];
      // Check drain
      if (cell.type === 'drain') {
        const drainKey = `${r},${c}`;
        if (!scene.connectedDrains.has(drainKey)) {
          scene.connectedDrains.add(drainKey);
          cell.hasWater = true; cell.waterColor = WATER_COLORS[colorIdx];
          const cx = scene.gridOffX + c * scene.cellSize + scene.cellSize / 2;
          const cy = scene.gridOffY + r * scene.cellSize + scene.cellSize / 2;
          Effects.drainConnect(scene, cx, cy);
          sfx.play('drainConnect');
          scene.score += SCORING.drainConnect * scene.stageNum;
          Effects.scoreFloat(scene, cx, cy - 30, `+${SCORING.drainConnect * scene.stageNum}`, COLORS.success);
          updateHUD(scene.hud, scene);
          WaterFlow.checkStageClear(scene);
        }
        continue;
      }
      if (!cell.pipeType || cell.type === 'obstacle' || cell.type === 'source') {
        WaterFlow.triggerFlood(scene, r, c); continue;
      }
      if (!hasConnection(cell.pipeType, cell.rotation, entryDir)) {
        WaterFlow.triggerFlood(scene, r, c); continue;
      }
      // Fill pipe with water
      cell.hasWater = true; cell.waterColor = WATER_COLORS[colorIdx];
      WaterFlow.drawWaterInCell(scene, r, c, WATER_COLORS[colorIdx]);
      const cx = scene.gridOffX + c * scene.cellSize + scene.cellSize / 2;
      const cy = scene.gridOffY + r * scene.cellSize + scene.cellSize / 2;
      Effects.waterEnterPipe(scene, cx, cy, WATER_COLORS[colorIdx]);
      sfx.play('waterFlow');

      let newCoffeeSlow = coffeeSlowRemaining > 0 ? coffeeSlowRemaining - 1 : 0;
      const special = PIPE_DEFS[cell.pipeType].special;
      if (special === 'coffee') { newCoffeeSlow = 2; scene.score += SCORING.specialActivated; }
      if (special === 'toilet') {
        nextFronts.push({
          r: r + DIR_DR[OPP[entryDir]][0], c: c + DIR_DR[OPP[entryDir]][1],
          entryDir: entryDir, colorIdx, coffeeSlowRemaining: newCoffeeSlow
        });
        scene.score += SCORING.specialActivated;
        continue;
      }
      const exits = getConnections(cell.pipeType, cell.rotation).filter(d => d !== entryDir);
      if (special === 'sprinkler') scene.score += SCORING.specialActivated;
      for (const exitDir of exits) {
        const nr = r + DIR_DR[exitDir][0], nc = c + DIR_DR[exitDir][1];
        nextFronts.push({ r: nr, c: nc, entryDir: OPP[exitDir], colorIdx, coffeeSlowRemaining: newCoffeeSlow });
      }
    }
    scene.flowFronts = nextFronts;
  },

  drawWaterInCell(scene, r, c, color) {
    const cx = scene.gridOffX + c * scene.cellSize + scene.cellSize / 2;
    const cy = scene.gridOffY + r * scene.cellSize + scene.cellSize / 2;
    const s = scene.cellSize * 0.4;
    const colorNum = Phaser.Display.Color.HexStringToColor(color).color;
    const waterRect = scene.add.rectangle(cx, cy, s, s, colorNum, 0.7).setDepth(4);
    scene.tweens.add({ targets: waterRect, scaleX: 1.1, scaleY: 1.1, duration: 200, yoyo: true, ease: 'Sine.easeInOut' });
    scene.gridSprites[r][c].water = waterRect;
  },

  triggerFlood(scene, r, c) {
    if (scene.floodLevel > 0) return;
    scene.floodLevel = 0.1;
    const cr = Phaser.Math.Clamp(r, 0, scene.rows - 1);
    const cc = Phaser.Math.Clamp(c, 0, scene.cols - 1);
    const cx = scene.gridOffX + cc * scene.cellSize + scene.cellSize / 2;
    const cy = scene.gridOffY + cr * scene.cellSize + scene.cellSize / 2;
    Effects.deadEndSplash(scene, cx, cy);
    sfx.play('splash');
  },

  updateFloodVisual(scene) {
    if (!scene.floodOverlay) return;
    const h = scene.scale.height;
    scene.floodOverlay.setSize(scene.scale.width, h * scene.floodLevel);
    scene.floodOverlay.setPosition(scene.scale.width / 2, h);
  },

  checkStageClear(scene) {
    const { drains } = scene.stageData;
    if (scene.connectedDrains.size >= drains.length) {
      scene.flowFronts = [];
      scene.floodLevel = 0;
      const timeBonus = scene.countdownTime > 0 ? Math.ceil(scene.countdownTime / 1000) * SCORING.speedBonus : 0;
      const stageBonus = SCORING.stageClear * scene.stageNum;
      const noFloodBonus = scene.floodLevel === 0 ? SCORING.noFloodClear : 0;
      const bossBonus = isBossStage(scene.stageNum) ? SCORING.bossBonus : 0;
      scene.score += stageBonus + timeBonus + noFloodBonus + bossBonus;

      if (noFloodBonus > 0) { scene.streak++; } else { scene.streak = 0; }
      if (scene.streak >= 2) Effects.streakText(scene, scene.streak);

      Effects.stageClearFlash(scene);
      sfx.play('stageClear');
      Effects.scoreFloat(scene, scene.scale.width / 2, scene.scale.height / 2, `+${stageBonus + timeBonus}`, COLORS.success);
      updateHUD(scene.hud, scene);

      if (scene.score > GameState.highScore) { GameState.highScore = scene.score; saveState(); }
      if (scene.stageNum > GameState.bestStage) { GameState.bestStage = scene.stageNum; saveState(); }

      scene.time.delayedCall(800, () => {
        scene.stageNum++;
        scene.startStage();
      });
    }
  }
};
