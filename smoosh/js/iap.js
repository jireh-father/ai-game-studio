// =============================================================================
// SMOOSH! - iap.js
// In-app purchase FACADE, pre-implemented but DORMANT until release:
//   - Product catalog + full purchase flow + gem crediting are live code.
//   - The store backend is a swap-in point: on a real device WITHOUT a
//     billing plugin, purchase() politely reports "store not connected".
//   - In BROWSER dev mode, purchases are SIMULATED (confirm -> grant) so the
//     whole flow is testable end to end today.
//
// v7 T2: there is NO separate remove-ads product anymore. ANY successful gem
// pack purchase sets SaveManager.state.adsRemoved = true (see _grant() below)
// - ads.js's adsRemoved getter already gates every banner/interstitial show
// on that same flag, so buying ANY gem pack removes ads forever as a side
// effect. This replaces the old dedicated $0.99 'smoosh_remove_ads' SKU.
//
// At release (org Play account ready):
//   1. npm i @revenuecat/purchases-capacitor  (or cordova-plugin-purchase)
//   2. create the gem products in Play Console with the ids below
//   3. implement _nativePurchase() with the plugin - nothing else changes.
// =============================================================================

const IapManager = {

    // v7 T2: retuned so the ANCHOR is $0.99 -> 400 gems (404.04 gems/$
    // baseline), and every pricier tier gives progressively MORE gems per
    // dollar - a growing "whale" bonus so bigger packs read as a genuinely
    // better deal, not just "buy more of the same". bonusPct = this tier's
    // gems/$ premium over the $0.99 baseline (e.g. tier2: 2200/4.99 =
    // 440.88/$, which is +9.1% over 404.04/$). `price` is the plain numeric
    // dollar amount (priceLabel is the display string) - tests/iap.test.js
    // owns the monotonic-gems / monotonic-gems-per-dollar invariant.
    PRODUCTS: [
        { id: 'smoosh_gems_small',  gems: 400,   price: 0.99,  priceLabel: '$0.99',  label: '💎 400',    bonusPct: 0 },
        { id: 'smoosh_gems_medium', gems: 2200,  price: 4.99,  priceLabel: '$4.99',  label: '💎 2,200',  bonusPct: 9,  tag: '+9% BONUS' },
        { id: 'smoosh_gems_large',  gems: 4800,  price: 9.99,  priceLabel: '$9.99',  label: '💎 4,800',  bonusPct: 19, tag: '+19% BONUS' },
        { id: 'smoosh_gems_xlarge', gems: 10400, price: 19.99, priceLabel: '$19.99', label: '💎 10,400', bonusPct: 29, tag: '+29% BONUS' },
        { id: 'smoosh_gems_mega',   gems: 28000, price: 49.99, priceLabel: '$49.99', label: '💎 28,000', bonusPct: 39, tag: '★ BEST VALUE +39%' },
        { id: 'smoosh_gems_ultra',  gems: 60000, price: 99.99, priceLabel: '$99.99', label: '💎 60,000', bonusPct: 49, tag: '★ BEST VALUE +49%' }
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

    // v7 T2: EVERY gem pack grants gems AND removes ads forever - there is
    // no separate "noads" product type anymore (see PRODUCTS above).
    _grant(product) {
        SaveManager.state.gems += product.gems;
        SaveManager.state.adsRemoved = true;
        SaveManager.persist();
    }
};

if (typeof module !== 'undefined') module.exports = { IapManager };
