// Gravity Waiter - Stage Generation & Difficulty

const StageManager = {
    getStageParams(stageNumber) {
        const S = stageNumber;
        const isRest = this.isRestStage(S);

        let rotationInterval = Math.max(
            CONFIG.MIN_ROTATION_INTERVAL,
            CONFIG.BASE_ROTATION_INTERVAL - (S * CONFIG.ROTATION_DECAY)
        );
        if (isRest) rotationInterval += 1000;

        const dishSpawnInterval = Math.max(
            CONFIG.MIN_SPAWN_INTERVAL,
            CONFIG.BASE_SPAWN_INTERVAL - (S * CONFIG.SPAWN_DECAY)
        );

        const maxStackSize = Math.min(10, 3 + Math.floor(S / 2));

        let customerBumpChance = 0;
        if (S >= 16) {
            customerBumpChance = Math.min(0.12, (S - 16) * 0.007);
        }

        const rotationWarningDuration = Math.max(
            CONFIG.MIN_WARNING_DURATION,
            CONFIG.BASE_WARNING_DURATION - S * CONFIG.WARNING_DECAY
        );

        return {
            rotationInterval,
            dishSpawnInterval,
            maxStackSize,
            customerBumpChance,
            dishPool: this.getDishPool(S),
            rotationWarningDuration,
            isRest
        };
    },

    getDishPool(stageNumber) {
        const pool = [];
        const S = stageNumber;

        // Plate always available, weight decreases
        const plateWeight = Math.max(40, 100 - S * 2);
        pool.push({ type: 'plate', weight: plateWeight, dish: CONFIG.DISH.PLATE });

        if (S >= 4) {
            const fishWeight = Math.min(25, 20 + (S - 4));
            pool.push({ type: 'fish', weight: fishWeight, dish: CONFIG.DISH.FISH });
        }

        if (S >= 7) {
            const cakeWeight = 20;
            pool.push({ type: 'cake', weight: cakeWeight, dish: CONFIG.DISH.CAKE });
        }

        if (S >= 11) {
            const bowlWeight = Math.min(20, 15 + (S - 11));
            pool.push({ type: 'bowl', weight: bowlWeight, dish: CONFIG.DISH.BOWL });
        }

        return pool;
    },

    pickDishType(pool) {
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const item of pool) {
            roll -= item.weight;
            if (roll <= 0) return item;
        }
        return pool[0];
    },

    isRestStage(stageNumber) {
        return stageNumber > 1 && stageNumber % 10 === 0;
    },

    getRotationDirection(lastTwo) {
        // If last 2 were the same, force opposite
        if (lastTwo.length >= 2 && lastTwo[0] === lastTwo[1]) {
            return lastTwo[0] === 1 ? -1 : 1;
        }
        // 30% chance same as last, 70% opposite
        if (lastTwo.length > 0 && Math.random() < 0.3) {
            return lastTwo[lastTwo.length - 1];
        }
        return Math.random() < 0.5 ? 1 : -1;
    }
};
