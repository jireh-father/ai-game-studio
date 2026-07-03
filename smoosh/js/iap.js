// =============================================================================
// SMOOSH! - iap.js
// In-app purchase FACADE, pre-implemented but DORMANT until release:
//   - Product catalog + full purchase flow + gem crediting are live code.
//   - The store backend is a swap-in point: on a real device WITHOUT a
//     billing plugin, purchase() politely reports "store not connected".
//   - In BROWSER dev mode, purchases are SIMULATED (confirm -> grant) so the
//     whole flow is testable end to end today.
//
// At release (org Play account ready):
//   1. npm i @revenuecat/purchases-capacitor  (or cordova-plugin-purchase)
//   2. create the gem products in Play Console with the ids below
//   3. implement _nativePurchase() with the plugin - nothing else changes.
// =============================================================================

const IapManager = {

    PRODUCTS: [
        { id: 'smoosh_gems_small',  gems: 120,  label: '💎 120',  priceLabel: '$0.99' },
        { id: 'smoosh_gems_medium', gems: 700,  label: '💎 700',  priceLabel: '$4.99' },
        { id: 'smoosh_gems_large',  gems: 2000, label: '💎 2000', priceLabel: '$9.99' },
        { id: 'smoosh_remove_ads',  type: 'noads', label: '🚫 Ads', priceLabel: '$0.99' }
    ],

    get storeConnected() { return false; }, // flips true once a billing plugin is wired

    _isNative() {
        return !!(window.Capacitor && window.Capacitor.isNativePlatform &&
            window.Capacitor.isNativePlatform());
    },

    // Returns Promise<{ok, gems?, reason?}>
    async purchase(productId) {
        const product = this.PRODUCTS.find(p => p.id === productId);
        if (!product) return { ok: false, reason: 'unknown_product' };

        if (this._isNative()) {
            if (!this.storeConnected) {
                // Dormant mode on device: store not wired yet.
                return { ok: false, reason: 'store_not_connected' };
            }
            return this._nativePurchase(product);
        }

        // Browser dev mode: simulate the store dialog.
        return new Promise((resolve) => {
            const yes = window.confirm(
                '[DEV STORE] Buy ' + product.label + ' for ' + product.priceLabel + '?');
            if (yes) {
                this._grant(product);
                resolve({ ok: true, gems: product.gems, simulated: true });
            } else {
                resolve({ ok: false, reason: 'cancelled' });
            }
        });
    },

    // Swap-in point for the real billing plugin at release.
    async _nativePurchase(product) {
        return { ok: false, reason: 'store_not_connected' };
    },

    _grant(product) {
        if (product.type === 'noads') {
            SaveManager.state.adsRemoved = true;
        } else {
            SaveManager.state.gems += product.gems;
        }
        SaveManager.persist();
    }
};

if (typeof module !== 'undefined') module.exports = { IapManager };
