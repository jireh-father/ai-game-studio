// stages.js — Stage data, call generation, difficulty scaling

class StageManager {
  constructor(scene) {
    this.scene = scene;
    this.currentStage = 0;
    this.callsSpawned = 0;
    this.callsResolved = 0;
    this.stageTimer = null;
    this.spawnTimer = null;
    this.stageClearPending = false;
  }

  getStageData(n) {
    if (n <= 0) n = 1;
    const data = [
      null,
      { dur: 30, cpm: 8,  spam: 70, disg: 0,  multi: 0,  simul: 0 },
      { dur: 35, cpm: 10, spam: 65, disg: 0,  multi: 0,  simul: 0 },
      { dur: 40, cpm: 12, spam: 60, disg: 0,  multi: 0,  simul: 0 },
      { dur: 40, cpm: 14, spam: 60, disg: 20, multi: 0,  simul: 0 },
      { dur: 45, cpm: 16, spam: 55, disg: 30, multi: 0,  simul: 0 },
      { dur: 45, cpm: 16, spam: 55, disg: 35, multi: 10, simul: 0 },
      { dur: 50, cpm: 18, spam: 50, disg: 35, multi: 15, simul: 0 },
      { dur: 50, cpm: 18, spam: 50, disg: 30, multi: 20, simul: 1 },
      { dur: 55, cpm: 20, spam: 50, disg: 30, multi: 20, simul: 1 },
      { dur: 55, cpm: 22, spam: 45, disg: 35, multi: 20, simul: 2 },
      { dur: 60, cpm: 24, spam: 45, disg: 35, multi: 20, simul: 2 },
      { dur: 60, cpm: 24, spam: 45, disg: 35, multi: 25, simul: 2 },
    ];
    if (n <= 12) return data[n];
    return { dur: 60, cpm: Math.min(26 + (n - 13) * 2, 40), spam: 40, disg: 40, multi: 25, simul: 3 };
  }

  getTimeWindow(baseMs) {
    const reduction = Math.floor((this.currentStage - 1) / 3) * 100;
    return Math.max(baseMs - reduction, 1200);
  }

  getDrainMult() {
    return 1 + Math.floor((this.currentStage - 1) / 5) * 0.05;
  }

  startStage(stageNum) {
    this.currentStage = stageNum;
    this.callsSpawned = 0;
    this.callsResolved = 0;
    this.stageClearPending = false;
    const sd = this.getStageData(stageNum);
    const intervalMs = (60 / sd.cpm) * 1000;
    this.totalCalls = Math.ceil(sd.cpm * (sd.dur / 60));
    this.spawnTimer = this.scene.time.addEvent({
      delay: intervalMs,
      callback: () => this.spawnCall(),
      loop: true
    });
    this.stageTimer = this.scene.time.delayedCall(sd.dur * 1000, () => {
      this.stageClearPending = true;
      if (this.spawnTimer) this.spawnTimer.remove();
      this.checkStageClear();
    });
    // Spawn first call immediately
    this.scene.time.delayedCall(300, () => this.spawnCall());
  }

  spawnCall() {
    if (this.stageClearPending) return;
    const sd = this.getStageData(this.currentStage);
    const activeCards = this.scene.cards.filter(c => c.active);
    if (activeCards.length >= CONFIG.MAX_CARDS) return;
    const roll = Phaser.Math.Between(1, 100);
    let callType;
    if (roll <= sd.spam - sd.disg - sd.multi) {
      callType = 'SPAM';
    } else if (roll <= sd.spam - sd.multi && sd.disg > 0) {
      callType = Phaser.Math.RND.pick(['DISGUISED', 'FAKE_REAL', 'SPOOFED']);
      if (this.currentStage < 5) callType = 'DISGUISED';
      if (this.currentStage < 7) callType = Phaser.Math.RND.pick(['DISGUISED', 'FAKE_REAL']);
    } else if (roll <= sd.spam && sd.multi > 0) {
      callType = 'MULTI_TAP';
    } else {
      callType = this.currentStage >= 5 ? Phaser.Math.RND.pick(['REAL', 'URGENT']) : 'REAL';
      if (this.currentStage >= 11 && Phaser.Math.Between(1, 5) === 1) callType = 'SILENT';
    }
    if (this.currentStage >= 10 && Phaser.Math.Between(1, 8) === 1) callType = 'EVOLVING';
    this.scene.spawnCard(this.generateCall(callType));
    this.callsSpawned++;
  }

  generateCall(type) {
    const tw = {
      SPAM: 2500, REAL: 3000, DISGUISED: 2000, FAKE_REAL: 2200,
      MULTI_TAP: 2000, URGENT: 2500, SPOOFED: 2000, CONFERENCE: 2000,
      EVOLVING: 1800, SILENT: 2000, BURST: 2500
    };
    const def = CALL_TYPES[type];
    const isSpam = def.isSpam;
    const name = isSpam !== false
      ? Phaser.Math.RND.pick(CONFIG.SPAM_NAMES)
      : Phaser.Math.RND.pick(CONFIG.REAL_NAMES);
    const call = {
      id: 'call-' + Date.now() + '-' + Phaser.Math.Between(0, 999),
      type: type,
      displayName: type === 'SPOOFED' ? Phaser.Math.RND.pick(CONFIG.REAL_NAMES) : name,
      action: def.action,
      isSpam: isSpam,
      taps: type === 'MULTI_TAP' ? 3 : 1,
      tapCount: 0,
      timeWindow: this.getTimeWindow(tw[type] || 2500),
      color: def.color,
      score: isSpam !== false ? CONFIG.SCORE_SPAM : CONFIG.SCORE_REAL,
      patienceDelta: {
        right: isSpam !== false ? CONFIG.PATIENCE_GAIN_SPAM : CONFIG.PATIENCE_GAIN_REAL,
        wrong: isSpam !== false ? CONFIG.PATIENCE_DRAIN_ANSWER_SPAM : CONFIG.PATIENCE_DRAIN_HANGUP_REAL,
        miss: CONFIG.PATIENCE_DRAIN_MISS
      },
      contactColor: Phaser.Math.RND.pick(CONFIG.CONTACT_COLORS),
      evolveTarget: null
    };
    if (type === 'EVOLVING') {
      const startsSpam = Phaser.Math.Between(0, 1) === 0;
      call.isSpam = startsSpam;
      call.evolveTarget = !startsSpam;
      call.action = startsSpam ? 'tap' : 'hold';
      call.color = startsSpam ? CONFIG.COL_SPAM : CONFIG.COL_REAL;
      call.displayName = startsSpam
        ? Phaser.Math.RND.pick(CONFIG.SPAM_NAMES)
        : Phaser.Math.RND.pick(CONFIG.REAL_NAMES);
    }
    if (type === 'SPOOFED') {
      call.spoofed = true;
    }
    return call;
  }

  onCardResolved() {
    this.callsResolved++;
    if (this.stageClearPending) this.checkStageClear();
  }

  checkStageClear() {
    const activeCards = this.scene.cards.filter(c => c.active);
    if (this.stageClearPending && activeCards.length === 0) {
      this.scene.onStageClear();
    }
  }

  cleanup() {
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.stageTimer) this.stageTimer.remove();
  }
}
