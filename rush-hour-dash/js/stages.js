// Rush Hour Dash - Stage Generation
function getDifficulty(hopCount) {
  var stageNum = Math.floor(hopCount / 10);
  return Math.min(1.0, stageNum * 0.018 + 0.05);
}

function getScrollSpeed(hopCount) {
  return Math.min(SCROLL_MAX, SCROLL_BASE + hopCount * SCROLL_PER_HOP);
}

function isRestLane(laneIndex) {
  return laneIndex > 0 && laneIndex % 15 === 0;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function weightedPick(weights) {
  var total = 0;
  for (var k in weights) total += weights[k];
  var r = Math.random() * total;
  var cum = 0;
  for (var k in weights) {
    cum += weights[k];
    if (r <= cum) return k;
  }
  return Object.keys(weights)[0];
}

function generateLane(hopCount, laneIndex) {
  var diff = getDifficulty(hopCount);
  var seed = laneIndex * 7919 + Date.now() % 100000;

  if (isRestLane(laneIndex)) {
    return makeRestLane(laneIndex);
  }

  var typeWeights = {
    traffic_slow: lerp(0.45, 0.10, diff),
    traffic_fast: lerp(0.20, 0.40, diff),
    traffic_mixed: lerp(0.10, 0.30, diff),
    open: lerp(0.15, 0.08, diff),
    coin: lerp(0.10, 0.12, diff)
  };

  var laneType = weightedPick(typeWeights);
  var direction = Math.random() < 0.5 ? -1 : 1;
  var vehicleCount = Math.round(2 + diff * 5);
  var baseSpeed = 100 + diff * 300;
  var hasCoin = laneType === 'coin';

  if (laneType === 'open') {
    vehicleCount = 1;
    baseSpeed = 100;
  }
  if (hasCoin) {
    vehicleCount = Math.max(4, vehicleCount);
  }

  var vehicles = [];
  var vehicleTypes = getAvailableVehicleTypes(hopCount);
  var totalVehicleWidth = 0;

  for (var i = 0; i < vehicleCount; i++) {
    var vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    var size = VEHICLE_SIZES[vType];
    var speedVar = baseSpeed * 0.15;
    var speed = baseSpeed + (Math.random() * speedVar * 2 - speedVar);

    var mixedDir = direction;
    if (laneType === 'traffic_mixed' && hopCount > 20 && Math.random() < 0.3) {
      mixedDir = -direction;
    }

    vehicles.push({
      type: vType, width: size.w, height: size.h,
      speed: speed * mixedDir, x: 0,
      direction: mixedDir
    });
    totalVehicleWidth += size.w;
  }

  distributeVehicles(vehicles, GAME_WIDTH);
  validateGaps(vehicles, GAME_WIDTH);

  var coinX = null;
  if (hasCoin) {
    coinX = findWidestGapCenter(vehicles, GAME_WIDTH);
  }

  return {
    type: laneType, vehicles: vehicles, coinX: coinX,
    direction: direction, laneIndex: laneIndex
  };
}

function makeRestLane(laneIndex) {
  var vType = 'car_b';
  var size = VEHICLE_SIZES[vType];
  var dir = Math.random() < 0.5 ? -1 : 1;
  return {
    type: 'open', laneIndex: laneIndex, direction: dir, coinX: null,
    vehicles: [{
      type: vType, width: size.w, height: size.h,
      speed: 100 * dir, x: Math.random() * (GAME_WIDTH - size.w),
      direction: dir
    }]
  };
}

function getAvailableVehicleTypes(hopCount) {
  var types = ['car_a', 'car_b'];
  if (hopCount >= 11) types.push('bus');
  if (hopCount >= 61) types.push('taxi', 'motorbike');
  return types;
}

function distributeVehicles(vehicles, laneWidth) {
  var count = vehicles.length;
  var spacing = laneWidth / count;
  for (var i = 0; i < count; i++) {
    vehicles[i].x = i * spacing + Math.random() * (spacing - vehicles[i].width);
    if (vehicles[i].x < 0) vehicles[i].x = 0;
    if (vehicles[i].x + vehicles[i].width > laneWidth) {
      vehicles[i].x = laneWidth - vehicles[i].width;
    }
  }
  vehicles.sort(function(a, b) { return a.x - b.x; });
}

function validateGaps(vehicles, laneWidth) {
  var minGap = 64;
  var attempts = 0;
  while (attempts < 5 && vehicles.length > 1) {
    var gaps = getGaps(vehicles, laneWidth);
    var maxGap = Math.max.apply(null, gaps);
    if (maxGap >= minGap) break;
    // Remove fastest vehicle
    var fastestIdx = 0;
    var maxSpeed = 0;
    for (var i = 0; i < vehicles.length; i++) {
      if (Math.abs(vehicles[i].speed) > maxSpeed) {
        maxSpeed = Math.abs(vehicles[i].speed);
        fastestIdx = i;
      }
    }
    vehicles.splice(fastestIdx, 1);
    distributeVehicles(vehicles, laneWidth);
    attempts++;
  }
}

function getGaps(vehicles, laneWidth) {
  var gaps = [];
  if (vehicles.length === 0) return [laneWidth];
  gaps.push(vehicles[0].x);
  for (var i = 0; i < vehicles.length - 1; i++) {
    gaps.push(vehicles[i + 1].x - (vehicles[i].x + vehicles[i].width));
  }
  gaps.push(laneWidth - (vehicles[vehicles.length - 1].x + vehicles[vehicles.length - 1].width));
  return gaps;
}

function findWidestGapCenter(vehicles, laneWidth) {
  var gaps = getGaps(vehicles, laneWidth);
  var maxIdx = 0;
  for (var i = 1; i < gaps.length; i++) {
    if (gaps[i] > gaps[maxIdx]) maxIdx = i;
  }
  if (maxIdx === 0) return gaps[0] / 2;
  if (maxIdx >= vehicles.length) {
    var lastV = vehicles[vehicles.length - 1];
    return lastV.x + lastV.width + gaps[maxIdx] / 2;
  }
  return vehicles[maxIdx].x - gaps[maxIdx] / 2;
}
