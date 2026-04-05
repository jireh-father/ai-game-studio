// Birthday Bomb - Stage Generation

function seededRandom(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateBirthdayPool(stageNumber, count) {
  var seed = stageNumber * 7919 + (typeof window._sessionEntropy !== 'undefined' ? window._sessionEntropy : 0);
  var pool = BIRTHDAY_POOL.slice();
  // Fisher-Yates shuffle with seeded RNG
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(seededRandom(seed + i) * (i + 1));
    var tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

function StageConfig(stageNumber) {
  var isRest = stageNumber > 1 && stageNumber % 5 === 0;
  var roomTarget = Math.min(10 + Math.floor(stageNumber / 3), 23);
  var baseTimer = Math.max(30 - stageNumber * 0.5, 20);
  var correctBonus = Math.max(4 - Math.floor(stageNumber / 5) * 0.5, 2);
  var wrongPenalty = Math.min(2 + Math.floor(stageNumber / 5) * 0.5, 6);
  var twinCount = stageNumber < 7 ? 0 : Math.min(Math.floor((stageNumber - 7) / 5) + 1, 2);
  var crasherCount = stageNumber < 11 ? 0 : Math.min(Math.floor((stageNumber - 11) / 4) + 1, 3);
  var doubleOrNothing = stageNumber >= 16;

  if (isRest) {
    baseTimer += 10;
    twinCount = 0;
    crasherCount = 0;
  }

  return {
    stageNumber: stageNumber,
    roomTarget: roomTarget,
    baseTimer: baseTimer,
    correctBonus: correctBonus,
    wrongPenalty: wrongPenalty,
    twinCount: twinCount,
    crasherCount: crasherCount,
    doubleOrNothing: doubleOrNothing,
    isRestStage: isRest
  };
}

function generateCardData(config) {
  var birthdays = generateBirthdayPool(config.stageNumber, config.roomTarget + 5);
  var cards = [];
  var twinAssigned = 0;
  var crasherAssigned = 0;

  for (var i = 0; i < config.roomTarget; i++) {
    var isTwin = false;
    var isCrasher = false;

    // Place twin pairs in second half of cards
    if (twinAssigned < config.twinCount && i >= Math.floor(config.roomTarget * 0.5) && i % 3 === 0) {
      isTwin = true;
      twinAssigned++;
    }
    // Place crashers after twins
    if (!isTwin && crasherAssigned < config.crasherCount && i >= Math.floor(config.roomTarget * 0.6) && i % 4 === 0) {
      isCrasher = true;
      crasherAssigned++;
    }

    cards.push({
      index: i,
      birthday: isCrasher ? null : birthdays[i],
      shirtColor: SHIRT_COLORS[i % SHIRT_COLORS.length],
      isTwin: isTwin,
      isCrasher: isCrasher,
      twinBirthday: null // set below for twin targets
    });
  }

  // For twin cards, duplicate a birthday from an earlier card
  for (var c = 0; c < cards.length; c++) {
    if (cards[c].isTwin && c > 0) {
      var sourceIdx = Math.floor(seededRandom(config.stageNumber * 31 + c) * Math.min(c, 5));
      if (cards[sourceIdx] && cards[sourceIdx].birthday) {
        cards[c].birthday = cards[sourceIdx].birthday;
        cards[c].twinBirthday = cards[sourceIdx].birthday;
      }
    }
  }

  return cards;
}
