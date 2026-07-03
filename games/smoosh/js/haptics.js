// =============================================================================
// SMOOSH! - haptics.js
// Capacitor Haptics wrapper. The on-device "touch feel" of peeling:
// micro impact ticks whose rate follows peel speed. No-ops in browser.
// =============================================================================

const Haptic = {

    _lastTick: 0,

    get isNative() {
        return !!(window.Capacitor &&
            window.Capacitor.isNativePlatform &&
            window.Capacitor.isNativePlatform());
    },

    _plugin() {
        return (window.Capacitor && window.Capacitor.Plugins)
            ? window.Capacitor.Plugins.Haptics : null;
    },

    // v01: 0..1 peel speed. Faster peel = denser ticks.
    tick(v01) {
        if (!this.isNative || v01 <= 0.02) return;
        const now = Date.now();
        const minInterval = Math.max(40, 140 - 120 * v01);
        if (now - this._lastTick < minInterval) return;
        this._lastTick = now;
        try {
            const h = this._plugin();
            if (h) h.impact({ style: 'LIGHT' });
        } catch (e) { /* never break gameplay over a buzz */ }
    },

    heavy() {
        if (!this.isNative) return;
        try {
            const h = this._plugin();
            if (h) h.impact({ style: 'HEAVY' });
        } catch (e) {}
    },

    medium() {
        if (!this.isNative) return;
        try {
            const h = this._plugin();
            if (h) h.impact({ style: 'MEDIUM' });
        } catch (e) {}
    }
};

if (typeof module !== 'undefined') module.exports = { Haptic };
