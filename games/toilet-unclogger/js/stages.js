// Toilet Unclogger - Stage Generation & Clog Management
class StageManager {
  constructor(scene) {
    this.scene = scene;
    this.stage = 0;
    this.toilets = [];
    this.sessionSalt = Math.floor(Math.random() * 10000);
  }

  generateStage(stageNum) {
    this.stage = stageNum;
    const rest = isRestStage(stageNum);
    const boss = isBossStage(stageNum);
    const numToilets = rest ? 1 : getActiveToilets(stageNum);
    const bpm = rest ? 70 : getStageBPM(stageNum);
    const waterRise = rest ? 2 : getWaterRiseRate(stageNum);
    const perfectW = rest ? 150 : getPerfectWindow(stageNum);
    const goodW = rest ? 250 : getGoodWindow(stageNum);
    const clogsPerToilet = boss ? 1 : getClogsPerToilet(stageNum);
    const tiers = getTierForStage(stageNum);
    const available = CLOGS.filter(c => tiers.includes(c.tier));
    const toilets = [];
    for (let t = 0; t < numToilets; t++) {
      const clogs = [];
      let lastClogId = null;
      for (let c = 0; c < clogsPerToilet; c++) {
        let clog;
        if (boss) {
          const bossClogs = CLOGS.filter(c => c.tier === CLOG_TIERS.URGENT);
          clog = bossClogs[this._seededRand(stageNum * 31 + t * 7 + c) % bossClogs.length];
        } else {
          let tries = 0;
          do {
            clog = available[this._seededRand(stageNum * 13 + t * 5 + c + tries * 3) % available.length];
            tries++;
          } while (clog.id === lastClogId && tries < 10);
        }
        lastClogId = clog.id;
        clogs.push({ ...clog });
      }
      toilets.push({ clogs, waterLevel: null, currentClogIndex: 0 });
    }
    return {
      stageNum, toilets, bpm, waterRise, perfectW, goodW,
      isBoss: boss, isRest: rest, numToilets,
    };
  }

  _seededRand(seed) {
    const s = (seed + this.sessionSalt) * 7919;
    return Math.abs(((s * 9301 + 49297) % 233280) | 0);
  }
}

// Draw clog objects using Phaser Graphics
function drawClogObject(graphics, clogId, x, y, scale) {
  const s = scale || 1;
  graphics.clear();
  const draw = CLOG_DRAW[clogId];
  if (draw) draw(graphics, x, y, s);
  else drawDefaultClog(graphics, x, y, s);
}

function drawDefaultClog(g, x, y, s) {
  g.fillStyle(0x9E9E9E);
  g.fillCircle(x, y, 18 * s);
  g.fillStyle(0x757575);
  g.fillText && g.fillCircle(x, y, 8 * s);
}

const CLOG_DRAW = {
  rubber_duck: (g, x, y, s) => {
    g.fillStyle(0xFDD835); g.fillEllipse(x, y, 32 * s, 26 * s);
    g.fillStyle(0xFF8F00); g.fillTriangle(x + 14 * s, y - 2 * s, x + 22 * s, y, x + 14 * s, y + 4 * s);
    g.fillStyle(0x263238); g.fillCircle(x + 6 * s, y - 5 * s, 2 * s);
  },
  sock: (g, x, y, s) => {
    g.fillStyle(0xF5F5F5); g.fillRoundedRect(x - 8 * s, y - 18 * s, 16 * s, 28 * s, 4 * s);
    g.fillRoundedRect(x - 8 * s, y + 6 * s, 22 * s, 12 * s, 4 * s);
    g.lineStyle(2, 0xE53935); g.strokeRect(x - 8 * s, y - 18 * s, 16 * s, 6 * s);
  },
  tennis_ball: (g, x, y, s) => {
    g.fillStyle(0xC6FF00); g.fillCircle(x, y, 14 * s);
    g.lineStyle(2, 0xFFFFFF); g.beginPath();
    g.arc(x - 6 * s, y, 10 * s, -0.8, 0.8); g.strokePath();
    g.beginPath(); g.arc(x + 6 * s, y, 10 * s, 2.3, 4.0); g.strokePath();
  },
  banana: (g, x, y, s) => {
    g.lineStyle(8 * s, 0xFDD835);
    g.beginPath(); g.arc(x, y + 20 * s, 22 * s, -2.2, -0.9); g.strokePath();
    g.fillStyle(0x795548); g.fillCircle(x - 10 * s, y - 10 * s, 2 * s);
  },
  soap: (g, x, y, s) => {
    g.fillStyle(0x81D4FA); g.fillRoundedRect(x - 14 * s, y - 9 * s, 28 * s, 18 * s, 6 * s);
    g.fillStyle(0xE1F5FE); g.fillEllipse(x - 4 * s, y - 2 * s, 10 * s, 6 * s);
  },
  pizza: (g, x, y, s) => {
    g.fillStyle(0xFDD835); g.fillTriangle(x, y - 16 * s, x - 14 * s, y + 12 * s, x + 14 * s, y + 12 * s);
    g.fillStyle(0xE53935);
    g.fillCircle(x - 3 * s, y, 3 * s); g.fillCircle(x + 4 * s, y + 4 * s, 3 * s);
  },
  fish: (g, x, y, s) => {
    g.fillStyle(0x42A5F5); g.fillEllipse(x, y, 30 * s, 16 * s);
    g.fillTriangle(x + 14 * s, y, x + 22 * s, y - 8 * s, x + 22 * s, y + 8 * s);
    g.fillStyle(0x263238); g.fillCircle(x - 8 * s, y - 2 * s, 2 * s);
  },
  phone: (g, x, y, s) => {
    g.fillStyle(0x263238); g.fillRoundedRect(x - 10 * s, y - 16 * s, 20 * s, 32 * s, 3 * s);
    g.fillStyle(0x42A5F5); g.fillRect(x - 8 * s, y - 12 * s, 16 * s, 22 * s);
  },
  book: (g, x, y, s) => {
    g.fillStyle(0x1565C0); g.fillRect(x - 12 * s, y - 16 * s, 24 * s, 32 * s);
    g.lineStyle(2, 0x0D47A1); g.strokeRect(x - 10 * s, y - 14 * s, 20 * s, 28 * s);
    g.fillStyle(0xFFFFFF); g.fillRect(x - 1 * s, y - 16 * s, 2 * s, 32 * s);
  },
  teddy: (g, x, y, s) => {
    g.fillStyle(0x8D6E63); g.fillCircle(x, y + 6 * s, 14 * s);
    g.fillCircle(x, y - 10 * s, 10 * s);
    g.fillCircle(x - 8 * s, y - 16 * s, 4 * s); g.fillCircle(x + 8 * s, y - 16 * s, 4 * s);
    g.fillStyle(0x263238); g.fillCircle(x - 3 * s, y - 12 * s, 2 * s); g.fillCircle(x + 3 * s, y - 12 * s, 2 * s);
  },
  brick: (g, x, y, s) => {
    g.fillStyle(0xB71C1C); g.fillRect(x - 16 * s, y - 10 * s, 32 * s, 20 * s);
    g.lineStyle(1, 0x7F0000);
    g.strokeRect(x - 16 * s, y - 10 * s, 16 * s, 10 * s);
    g.strokeRect(x, y - 10 * s, 16 * s, 10 * s);
    g.strokeRect(x - 8 * s, y, 16 * s, 10 * s);
  },
  watermelon: (g, x, y, s) => {
    g.fillStyle(0x2E7D32); g.fillEllipse(x, y, 30 * s, 22 * s);
    g.lineStyle(2, 0x1B5E20);
    g.beginPath(); g.moveTo(x - 10 * s, y - 11 * s); g.lineTo(x - 8 * s, y + 11 * s); g.strokePath();
    g.beginPath(); g.moveTo(x + 10 * s, y - 11 * s); g.lineTo(x + 8 * s, y + 11 * s); g.strokePath();
  },
  alarm_clock: (g, x, y, s) => {
    g.fillStyle(0xF5F5F5); g.fillCircle(x, y, 14 * s);
    g.lineStyle(2, 0x263238); g.strokeCircle(x, y, 14 * s);
    g.fillStyle(0x263238); g.fillCircle(x - 6 * s, y - 16 * s, 4 * s); g.fillCircle(x + 6 * s, y - 16 * s, 4 * s);
    g.lineStyle(2, 0xE53935); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 * s, y - 4 * s); g.strokePath();
  },
  spaghetti: (g, x, y, s) => {
    g.lineStyle(2, 0xFFD54F);
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      const ox = (i - 3) * 4 * s;
      g.moveTo(x + ox, y - 14 * s);
      g.lineTo(x + ox + 3 * s, y); g.lineTo(x + ox - 2 * s, y + 14 * s);
      g.strokePath();
    }
  },
  shoe: (g, x, y, s) => {
    g.fillStyle(0x5D4037); g.fillRoundedRect(x - 14 * s, y - 6 * s, 28 * s, 14 * s, 4 * s);
    g.fillRect(x - 14 * s, y - 14 * s, 12 * s, 10 * s);
  },
  cactus: (g, x, y, s) => {
    g.fillStyle(0x4CAF50); g.fillRoundedRect(x - 6 * s, y - 16 * s, 12 * s, 32 * s, 4 * s);
    g.fillRoundedRect(x - 16 * s, y - 6 * s, 12 * s, 8 * s, 3 * s);
    g.fillRoundedRect(x + 6 * s, y + 2 * s, 12 * s, 8 * s, 3 * s);
  },
  bowling_ball: (g, x, y, s) => {
    g.fillStyle(0x1A237E); g.fillCircle(x, y, 16 * s);
    g.fillStyle(0x283593);
    g.fillCircle(x - 3 * s, y - 5 * s, 3 * s); g.fillCircle(x + 3 * s, y - 5 * s, 3 * s);
    g.fillCircle(x, y - 1 * s, 3 * s);
  },
  dumbbell: (g, x, y, s) => {
    g.fillStyle(0x424242); g.fillRect(x - 18 * s, y - 8 * s, 8 * s, 16 * s);
    g.fillRect(x + 10 * s, y - 8 * s, 8 * s, 16 * s);
    g.fillStyle(0x757575); g.fillRect(x - 10 * s, y - 3 * s, 20 * s, 6 * s);
  },
  rock: (g, x, y, s) => {
    g.fillStyle(0x757575); g.fillCircle(x, y, 14 * s);
    g.fillStyle(0x616161); g.fillCircle(x + 4 * s, y - 2 * s, 10 * s);
  },
  couch: (g, x, y, s) => {
    g.fillStyle(0x5D4037); g.fillRoundedRect(x - 20 * s, y - 10 * s, 40 * s, 18 * s, 4 * s);
    g.fillRect(x - 22 * s, y - 16 * s, 6 * s, 24 * s);
    g.fillRect(x + 16 * s, y - 16 * s, 6 * s, 24 * s);
    g.fillStyle(0x8D6E63);
    g.fillRoundedRect(x - 16 * s, y - 6 * s, 14 * s, 10 * s, 2 * s);
    g.fillRoundedRect(x + 2 * s, y - 6 * s, 14 * s, 10 * s, 2 * s);
  },
  toilet_in_toilet: (g, x, y, s) => {
    g.fillStyle(0xF5F0E8); g.fillRoundedRect(x - 12 * s, y - 14 * s, 24 * s, 28 * s, 6 * s);
    g.lineStyle(2, 0xBDBDBD); g.strokeRoundedRect(x - 12 * s, y - 14 * s, 24 * s, 28 * s, 6 * s);
    g.fillStyle(0x4FC3F7); g.fillEllipse(x, y + 2 * s, 16 * s, 10 * s);
  },
  kitchen_sink: (g, x, y, s) => {
    g.fillStyle(0xBDBDBD); g.fillRoundedRect(x - 18 * s, y - 12 * s, 36 * s, 24 * s, 4 * s);
    g.fillStyle(0x90A4AE); g.fillEllipse(x, y, 24 * s, 16 * s);
    g.fillStyle(0x78909C); g.fillRect(x - 2 * s, y - 20 * s, 4 * s, 10 * s);
    g.fillCircle(x, y - 20 * s, 4 * s);
  },
};

// Fill missing draws with default
['sponge','toy_car','apple','flip_flop','hair_ball','pineapple','baseball',
 'rope','garden_hose','chain','octopus'].forEach(id => {
  if (!CLOG_DRAW[id]) {
    CLOG_DRAW[id] = (g, x, y, s) => {
      const colors = [0xFF7043, 0x66BB6A, 0xFFA726, 0xAB47BC, 0x29B6F6, 0xEF5350];
      g.fillStyle(colors[id.length % colors.length]);
      g.fillCircle(x, y, 14 * s);
      g.fillStyle(0xFFFFFF); g.fillCircle(x - 3 * s, y - 3 * s, 4 * s);
    };
  }
});
