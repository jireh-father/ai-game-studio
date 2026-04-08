class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gameW = w; this.gameH = h;

    // Background
    this.add.rectangle(w/2, h/2, w, h, 0x0a0e1a);
    this.add.rectangle(w/2, HUD_H/2, w, HUD_H, 0x1a2238);

    // Danger line
    this.dangerLine = this.add.rectangle(w/2, DANGER_LINE, w, 3, 0xff3355, 0.8);
    this.dangerLabel = this.add.text(w - 8, DANGER_LINE - 10, 'DANGER', {
      fontFamily: 'Arial Black', fontSize: '10px', color: '#ff3355'
    }).setOrigin(1, 0.5);

    // State
    this.score = 0;
    this.hp = 3;
    this.stageNumber = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastClearTime = 0;
    this.gameOver = false;
    this.paused = false;
    this.dangerAlarmActive = false;
    this.dangerAlarmTimer = 0;
    this.lastInputTime = Date.now();
    this.stageTransitioning = false;

    // Cards
    this.activeCards = [];
    this.cardPool = [];
    this.toSpawn = [];
    this.spawnTimer = 0;

    // Column allocation (4 columns)
    this.columnX = [];
    const margin = 20;
    const colSpacing = (w - margin * 2) / 4;
    for (let i = 0; i < 4; i++) this.columnX.push(margin + colSpacing * (i + 0.5));

    // Pre-create card pool (16 sprites)
    this.createCardPool();

    // HUD
    this.createHUD();

    // Selection line graphics
    this.selectGfx = this.add.graphics().setDepth(50);
    this.selected = [];
    this.dragging = false;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.pointerMoved = false;

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Load first stage
    this.loadStage(1);

    // Visibility handler for cleanup
    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
  }

  createCardPool() {
    for (let i = 0; i < CARD_POOL_SIZE; i++) {
      const container = this.add.container(0, 0);
      const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0xf4e4bc).setStrokeStyle(2, 0x3a2a1a);
      const text = this.add.text(0, 0, '', {
        fontFamily: 'Arial Black', fontSize: '13px', color: '#1a1208',
        align: 'center', wordWrap: { width: CARD_W - 10 }
      }).setOrigin(0.5);
      container.add([bg, text]);
      container.bg = bg;
      container.txt = text;
      container.setVisible(false);
      container.setSize(CARD_W, CARD_H);
      container.cardData = null;
      container.vy = 0;
      container.active = false;
      this.cardPool.push(container);
    }
  }

  getPoolCard() {
    for (const c of this.cardPool) if (!c.active) return c;
    return null;
  }

  createHUD() {
    this.stageText = this.add.text(10, 12, 'STAGE 1', {
      fontFamily: 'Arial Black', fontSize: '16px', color: '#f4c20d'
    }).setDepth(500);

    this.scoreText = this.add.text(this.gameW - 10, 12, 'SCORE: 0', {
      fontFamily: 'Arial Black', fontSize: '16px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(500);

    this.hpText = this.add.text(10, 40, 'HP: ' + this.hp, {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#ff3355'
    }).setDepth(500);

    this.comboText = this.add.text(this.gameW/2, 40, '', {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(500);

    this.alarmText = this.add.text(this.gameW - 10, 40, '', {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#ff3355'
    }).setOrigin(1, 0).setDepth(500);

    // Pause button
    const pauseBtn = this.add.rectangle(this.gameW/2, 22, 44, 28, 0x1a2238).setStrokeStyle(2, 0xffffff).setInteractive().setDepth(500);
    this.add.text(this.gameW/2, 22, 'II', {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#fff'
    }).setOrigin(0.5).setDepth(501).disableInteractive();
    pauseBtn.on('pointerdown', () => this.togglePause());
  }

  loadStage(n) {
    this.stageNumber = n;
    this.stageText.setText('STAGE ' + n);
    const stage = generateStage(n);
    this.currentStage = stage;
    this.toSpawn = stage.cards.slice();
    this.spawnTimer = 0;
    this.stageTransitioning = false;
  }

  spawnCard(cardData) {
    const card = this.getPoolCard();
    if (!card) return;
    // Find empty column (highest available)
    const col = this.findEmptyColumn();
    card.setPosition(this.columnX[col], PLAY_TOP - CARD_H/2);
    card.bg.setFillStyle(cardData.trap ? 0xff6b4a : 0xf4e4bc);
    card.txt.setText(cardData.word);
    card.txt.setColor(cardData.trap ? '#fff' : '#1a1208');
    card.cardData = cardData;
    card.vy = this.currentStage.fallSpeed;
    card.active = true;
    card.column = col;
    card.setVisible(true);
    card.setScale(0);
    this.tweens.add({ targets: card, scale: 1, duration: 180, ease: 'Back.out' });
    this.activeCards.push(card);
  }

  findEmptyColumn() {
    // Pick column with fewest cards
    const counts = [0,0,0,0];
    this.activeCards.forEach(c => counts[c.column]++);
    let minCol = 0, minCount = counts[0];
    for (let i = 1; i < 4; i++) if (counts[i] < minCount) { minCount = counts[i]; minCol = i; }
    return minCol;
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;

    const dt = delta / 1000;

    // Spawn cards
    if (this.toSpawn.length > 0) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.currentStage.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnCard(this.toSpawn.shift());
      }
    }

    // Update cards - fall with stacking
    // Sort by y descending per column so bottom cards land first
    const byCol = [[],[],[],[]];
    this.activeCards.forEach(c => byCol[c.column].push(c));
    byCol.forEach(col => col.sort((a,b) => b.y - a.y));

    byCol.forEach(col => {
      let floor = PLAY_BOTTOM;
      col.forEach(c => {
        const target = floor - CARD_H/2;
        if (c.y < target) {
          c.y += c.vy * dt;
          if (c.y > target) c.y = target;
        }
        floor = c.y - CARD_H/2;
      });
    });

    // Danger line check
    let anyDanger = false;
    this.activeCards.forEach(c => {
      if (c.y - CARD_H/2 < DANGER_LINE && c.y + CARD_H/2 > DANGER_LINE) anyDanger = true;
      if (c.y - CARD_H/2 < DANGER_LINE) anyDanger = true;
    });

    if (anyDanger && !this.dangerAlarmActive) {
      this.dangerAlarmActive = true;
      this.dangerAlarmTimer = 10000;
    } else if (!anyDanger) {
      this.dangerAlarmActive = false;
      this.alarmText.setText('');
    }

    if (this.dangerAlarmActive) {
      this.dangerAlarmTimer -= delta;
      this.alarmText.setText('!! ' + Math.ceil(this.dangerAlarmTimer/1000) + 's !!');
      if (this.dangerAlarmTimer <= 0) return this.triggerGameOver();
    }

    // Ceiling overflow check
    for (const c of this.activeCards) {
      if (c.y - CARD_H/2 < CEILING) return this.triggerGameOver();
    }

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) { this.combo = 0; this.comboText.setText(''); }
    }

    // Idle death
    if (Date.now() - this.lastInputTime > IDLE_DEATH_MS) return this.triggerGameOver();

    // Stage complete check
    if (!this.stageTransitioning && this.toSpawn.length === 0 && this.activeCards.length === 0) {
      this.stageTransitioning = true;
      this.score += Math.floor(500 * (1 + this.stageNumber * 0.25));
      this.updateHUD();
      Effects.floatText(this, this.gameW/2, this.gameH/2, 'STAGE CLEAR!', '#ffd700', 32);
      this.time.delayedCall(1200, () => this.loadStage(this.stageNumber + 1));
    }
  }

}
