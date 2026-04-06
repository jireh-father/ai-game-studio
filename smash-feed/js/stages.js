function getUnlockedFoodTypes(stageNum) {
  return FOOD_TYPES.filter(function(f) { return f.unlockStage <= stageNum; });
}

function getWave(stageNum) {
  var diff = getDifficulty(stageNum);
  var foods = getUnlockedFoodTypes(stageNum);
  var wave = [];
  var bombsPlaced = 0;
  var lastWasBomb = false;
  var seed = stageNum * 7919 + (Date.now() % 100000);

  function rng() {
    seed = (seed * 16807 + 12345) & 0x7FFFFFFF;
    return seed / 0x7FFFFFFF;
  }

  for (var i = 0; i < diff.itemCount; i++) {
    var isBomb = false;
    if (i > 0 && !lastWasBomb && bombsPlaced < diff.bombFreq && rng() < 0.3) {
      isBomb = true;
    }
    if (isBomb) {
      wave.push({ type: 'bomb', foodKey: 'bomb' });
      bombsPlaced++;
      lastWasBomb = true;
    } else {
      var foodIdx = Math.floor(rng() * foods.length);
      wave.push({ type: 'food', foodKey: foods[foodIdx].key });
      lastWasBomb = false;
    }
  }

  // Ensure remaining bombs are placed if we haven't reached bombFreq
  if (bombsPlaced < diff.bombFreq) {
    for (var b = bombsPlaced; b < diff.bombFreq; b++) {
      // Find a valid slot (not first, not after a bomb)
      for (var j = 2; j < wave.length; j++) {
        if (wave[j].type !== 'bomb' && wave[j - 1].type !== 'bomb') {
          wave[j] = { type: 'bomb', foodKey: 'bomb' };
          break;
        }
      }
    }
  }

  return wave;
}
