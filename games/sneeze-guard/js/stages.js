// Sneeze Guard - Stage Generation
const StageManager = {
    generateStage: function(stageNumber) {
        const params = CONFIG.getDifficultyParams(stageNumber);
        const seed = stageNumber * 7919 + Date.now() % 100000;
        const rng = this._seededRandom(seed);

        const events = this._selectEvents(params, rng);

        return {
            stageNumber: stageNumber,
            events: events,
            isRestStage: params.isRest,
            tapWindow: params.tapWindow,
            approachSpeed: params.approachSpeed,
            windupDuration: params.windupDuration
        };
    },

    _selectEvents: function(params, rng) {
        const events = [];
        const count = params.eventCount;
        let realCount = 0;

        for (let i = 0; i < count; i++) {
            const isFake = rng() < params.fakeChance;
            if (isFake && realCount > 0) {
                events.push(this._createEvent('fake', params, rng));
            } else {
                events.push(this._createEvent('real', params, rng));
                realCount++;
            }
        }

        // Guarantee at least 1 real sneeze
        if (realCount === 0 && events.length > 0) {
            events[0] = this._createEvent('real', params, rng);
        }

        // Cap fake-outs at 60% of total
        const maxFakes = Math.floor(count * 0.6);
        let fakeCount = events.filter(e => e.type === 'fake').length;
        while (fakeCount > maxFakes) {
            const idx = events.findIndex(e => e.type === 'fake');
            if (idx >= 0) {
                events[idx] = this._createEvent('real', params, rng);
                fakeCount--;
            }
        }

        // Multi-sneeze: mark some real events as multi
        if (params.multiChance > 0) {
            for (let i = 0; i < events.length; i++) {
                if (events[i].type === 'real' && rng() < params.multiChance) {
                    events[i].multiCount = rng() < 0.1 && params.multiChance > 0.25 ? 3 : 2;
                }
            }
        }

        return events;
    },

    _createEvent: function(type, params, rng) {
        const speedVariation = 0.85 + rng() * 0.3;
        return {
            type: type,
            multiCount: 1,
            approachSpeed: Math.round(params.approachSpeed * speedVariation),
            windupDuration: Math.round(params.windupDuration * (0.9 + rng() * 0.2)),
            tapWindow: params.tapWindow
        };
    },

    _seededRandom: function(seed) {
        let s = seed;
        return function() {
            s = (s * 16807 + 0) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }
};
