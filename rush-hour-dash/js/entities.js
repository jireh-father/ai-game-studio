// Rush Hour Dash - Lane & Entity Management (mixin for GameScene)
var LaneManager = {
  spawnLane: function() {
    // First lane (index 0): empty safe lane AT the player's position
    var laneData;
    if (this.laneIndex === 0) {
      laneData = { vehicles: [], coinX: null, type: 'start' };
      this.topLaneY = GAME_HEIGHT - HUD_HEIGHT - 96; // matches player.y
    } else {
      laneData = generateLane(GameState.hops, this.laneIndex);
      this.topLaneY -= LANE_HEIGHT;
    }
    var screenY = this.topLaneY;

    for (var i = 0; i < laneData.vehicles.length; i++) {
      var vd = laneData.vehicles[i];
      var sprite = this.add.image(vd.x + vd.width / 2, screenY, vd.type).setDepth(3);
      if (vd.direction < 0) sprite.setFlipX(true);
      sprite.vData = vd;
      sprite.laneIdx = this.laneIndex;
      sprite.screenY = screenY;
      this.vehicleSprites.push(sprite);
    }

    if (laneData.coinX != null) {
      var coin = this.add.image(laneData.coinX, screenY, 'coin').setDepth(4);
      coin.laneIdx = this.laneIndex;
      coin.screenY = screenY;
      this.coinSprites.push(coin);
      this.tweens.add({ targets: coin, y: screenY - 4, duration: 400, yoyo: true, repeat: -1 });
    }

    laneData.screenY = screenY;
    this.lanes.push(laneData);
    this.laneIndex++;
  },

  needsMoreLanes: function() {
    if (this.lanes.length === 0) return true;
    return this.topLaneY > HUD_HEIGHT - LANE_HEIGHT * 2;
  },

  updateLanes: function(scrollDelta, dt) {
    for (var i = 0; i < this.vehicleSprites.length; i++) {
      var v = this.vehicleSprites[i];
      if (!v.active) continue;
      v.screenY -= scrollDelta;
      v.y = v.screenY;
      v.x += v.vData.speed * dt;
      if (v.vData.speed > 0 && v.x > GAME_WIDTH + v.displayWidth) v.x = -v.displayWidth;
      if (v.vData.speed < 0 && v.x < -v.displayWidth) v.x = GAME_WIDTH + v.displayWidth;
    }
    for (var i = 0; i < this.coinSprites.length; i++) {
      var c = this.coinSprites[i];
      if (!c.active) continue;
      c.screenY -= scrollDelta;
      c.y = c.screenY;
    }
    this.checkVehicleCollision();
    this.checkNearMiss();
  },

  cleanupLanes: function() {
    for (var i = this.vehicleSprites.length - 1; i >= 0; i--) {
      if (this.vehicleSprites[i].screenY < -50) {
        this.vehicleSprites[i].destroy();
        this.vehicleSprites.splice(i, 1);
      }
    }
    for (var i = this.coinSprites.length - 1; i >= 0; i--) {
      if (this.coinSprites[i].screenY < -50) {
        this.coinSprites[i].destroy();
        this.coinSprites.splice(i, 1);
      }
    }
    while (this.lanes.length > 0 && this.lanes[0].screenY < -100) this.lanes.shift();
  },

  drawLaneDividers: function() {
    this.laneDividers.clear();
    this.laneDividers.lineStyle(2, 0xFFFFFF, 0.15);
    var usedYs = {};
    for (var i = 0; i < this.vehicleSprites.length; i++) {
      var lineY = Math.round(this.vehicleSprites[i].screenY) + LANE_HEIGHT / 2;
      var key = Math.round(lineY / LANE_HEIGHT);
      if (lineY > HUD_HEIGHT && lineY < GAME_HEIGHT && !usedYs[key]) {
        usedYs[key] = true;
        for (var dx = 0; dx < GAME_WIDTH; dx += 20) {
          this.laneDividers.lineBetween(dx, lineY, dx + 10, lineY);
        }
      }
    }
  },

  checkNearMiss: function() {
    if (this.isDead || !this.player) return;
    var px = this.player.x, py = this.player.y;
    for (var i = 0; i < this.vehicleSprites.length; i++) {
      var v = this.vehicleSprites[i];
      if (!v.active) continue;
      var dx = Math.abs(px - v.x), dy = Math.abs(py - v.y);
      var threshold = v.displayWidth / 2 + PLAYER_HITBOX / 2;
      if (dy < 20 && dx < threshold + 16 && dx > threshold - 4) {
        this.nearMissEffect();
        break;
      }
    }
  }
};
