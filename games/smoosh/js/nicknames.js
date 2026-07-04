// =============================================================================
// SMOOSH! - nicknames.js
// Nickname generation (adjective + noun + 4-digit number) for social gifting.
// Pure seeded RNG: rng() returns [0,1).
// =============================================================================

const Nicknames = {
    // Cute, family-safe English adjectives (at least 12)
    ADJECTIVES: [
        'Bouncy', 'Fluffy', 'Sparkly', 'Silly', 'Squishy', 'Tiny',
        'Happy', 'Wiggly', 'Snappy', 'Zappy', 'Cuddly', 'Peppy',
        'Bubbly', 'Jumpy', 'Perky', 'Jiggly'
    ],

    // Cute, family-safe English nouns (at least 12)
    NOUNS: [
        'Mochi', 'Pudding', 'Sprout', 'Pebble', 'Bumblebee', 'Noodle',
        'Jelly', 'Nugget', 'Whisker', 'Wobble', 'Giggle', 'Blop',
        'Blob', 'Bouncer', 'Mallow', 'Puffball'
    ],

    /**
     * Generate a nickname from a seeded RNG.
     * Format: "Adjective Noun #NNNN" (e.g., "Bouncy Mochi #4821")
     * @param {Function} rng - seeded RNG, returns [0,1)
     * @returns {string} formatted nickname
     */
    generate(rng) {
        const adj = this.ADJECTIVES[Math.floor(rng() * this.ADJECTIVES.length)];
        const noun = this.NOUNS[Math.floor(rng() * this.NOUNS.length)];
        const num = 1000 + Math.floor(rng() * 9000);
        return `${adj} ${noun} #${num}`;
    },

    /**
     * Validate a nickname format.
     * - 3-24 chars total
     * - No angle brackets or control chars
     * @param {string} name - nickname to validate
     * @returns {boolean}
     */
    valid(name) {
        if (typeof name !== 'string') return false;
        if (name.length < 3 || name.length > 24) return false;
        if (/<|>/.test(name) || /[\x00-\x1F]/.test(name)) return false;
        return true;
    }
};

if (typeof module !== 'undefined') {
    module.exports = { Nicknames };
}
