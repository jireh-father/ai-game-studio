// =============================================================================
// AdsManager - AdMob Native Integration via @capacitor-community/admob
// For SMOOSH! (Capacitor 6). Ported from the battle-tested ZAP TAP/Peel It!
// ads.js.
//
// Placement policy:
//   - Interstitial: after every Nth STAGE CLEAR (CONFIG.ADS), with a
//     cooldown. Called via onStageClear() on every clear; this file owns
//     the counting (SaveManager.state.adStageCounter).
//   - Rewarded: 'double_gold' on the settlement panel, 'fever_refill' on
//     the fever gauge chip.
//   - Banner: MenuScene and SubMainScene call showBanner() (the player's two
//     non-gameplay "home" screens post-T14). GameScene never.
// =============================================================================

const AdsManager = {

    // --- State ---
    initialized: false,
    bannerVisible: false,
    _bannerCreated: false,   // native view created at least once (resume vs create)
    interstitialReady: false,
    rewardedReady: false,
    lastInterstitialTime: 0,

    // v3.0 Task 12: $0.99 remove-ads IAP. Gates banner + interstitial ONLY —
    // rewarded ads (double_gold, fever_refill) are opt-in and stay available.
    get adsRemoved() {
        return !!(typeof SaveManager !== 'undefined' && SaveManager.state && SaveManager.state.adsRemoved);
    },

    // Real "SMOOSH!" ad units (AdMob app ~5373653709, publisher
    // pub-7114194646987493, created 2026-07-02). While USE_TEST_ADS is true
    // the plugin requests Google TEST CREATIVES on these real units — safe to
    // click. >>> Flip to false for the public production release. <<<
    USE_TEST_ADS: true,

    // --- AdMob Plugin Reference (set during init) ---
    _admob: null,
    _isNative: false,

    AD_IDS: {
        android: {
            banner: 'ca-app-pub-7114194646987493/7680252849',       // Smoosh Banner
            interstitial: 'ca-app-pub-7114194646987493/6367171179', // Smoosh Interstitial
            rewarded: 'ca-app-pub-7114194646987493/6803084204'      // Smoosh Rewarded
        },
        ios: {
            banner: 'ca-app-pub-3940256099942544/2934735716',       // TEST
            interstitial: 'ca-app-pub-3940256099942544/4411468910', // TEST
            rewarded: 'ca-app-pub-3940256099942544/1712485313'      // TEST
        }
    },

    // =========================================================================
    // Initialize AdMob
    // =========================================================================
    async init() {
        if (this.initialized) return;

        this._isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform());

        if (!this._isNative) {
            console.log('[AdsManager] Browser mode - using placeholder ads');
            this.initialized = true;
            this._preloadInterstitial();
            this._preloadRewarded();
            return;
        }

        try {
            this._admob = window.Capacitor.Plugins.AdMob;

            if (!this._admob) {
                console.warn('[AdsManager] AdMob plugin not available');
                this.initialized = true;
                return;
            }

            await this._admob.initialize({
                initializeForTesting: this.USE_TEST_ADS,
            });

            // Request tracking authorization (iOS ATT)
            try {
                const trackingInfo = await this._admob.trackingAuthorizationStatus();
                if (trackingInfo.status === 'notDetermined') {
                    await this._admob.requestTrackingAuthorization();
                }
            } catch (e) {
                // trackingAuthorization not available on Android, ignore
            }

            // Request consent info (GDPR / UMP)
            try {
                const consentInfo = await this._admob.requestConsentInfo();
                if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
                    await this._admob.showConsentForm();
                }
            } catch (e) {
                console.warn('[AdsManager] Consent request failed:', e.message);
            }

            this._setupListeners();

            this.initialized = true;
            console.log('[AdsManager] Initialized successfully (native)');

            this._preloadInterstitial();
            this._preloadRewarded();

        } catch (err) {
            console.error('[AdsManager] Init failed:', err);
            this.initialized = true; // Prevent retry loops
        }
    },

    // =========================================================================
    // Event Listeners
    // =========================================================================
    _setupListeners() {
        if (!this._admob) return;

        this._admob.addListener('interstitialAdLoaded', () => {
            this.interstitialReady = true;
            console.log('[AdsManager] Interstitial loaded');
        });
        this._admob.addListener('interstitialAdFailedToLoad', (err) => {
            this.interstitialReady = false;
            console.warn('[AdsManager] Interstitial load failed:', err);
            setTimeout(() => this._preloadInterstitial(), 60000);
        });
        this._admob.addListener('interstitialAdDismissed', () => {
            this.interstitialReady = false;
            this.logAdEvent('interstitial_closed', {});
            setTimeout(() => this._preloadInterstitial(), 5000);
        });

        // Rewarded events — plugin uses on* prefixed names (NOT rewardAd*)
        this._admob.addListener('onRewardedVideoAdLoaded', () => {
            this.rewardedReady = true;
            console.log('[AdsManager] Rewarded ad loaded');
        });
        this._admob.addListener('onRewardedVideoAdFailedToLoad', (err) => {
            this.rewardedReady = false;
            console.warn('[AdsManager] Rewarded load failed:', err);
            setTimeout(() => this._preloadRewarded(), 60000);
        });
    },

    // =========================================================================
    // Banner Ad (MenuScene + SubMainScene ONLY - never during gameplay)
    // =========================================================================
    async showBanner() {
        if (this.adsRemoved) return;
        if (this.bannerVisible) return;

        if (!this._isNative || !this._admob) {
            console.log('[AdsManager] [DEV] Banner shown (placeholder)');
            this.bannerVisible = true;
            this._showDevBanner(true);
            return;
        }

        try {
            // First show CREATES the native view; later shows must RESUME it —
            // calling showBanner() with options again throws/no-ops on v6.
            if (this._bannerCreated && typeof this._admob.resumeBanner === 'function') {
                await this._admob.resumeBanner();
            } else {
                await this._admob.showBanner({
                    adId: this._getAdId('banner'),
                    adSize: 'BANNER', // 320x50
                    position: 'BOTTOM_CENTER',
                    margin: 0,
                    isTesting: this.USE_TEST_ADS,
                });
                this._bannerCreated = true;
            }
            this.bannerVisible = true;
            console.log('[AdsManager] Banner displayed');
        } catch (err) {
            console.warn('[AdsManager] Banner show failed:', err);
        }
    },

    async hideBanner() {
        if (!this.bannerVisible) return;

        if (!this._isNative || !this._admob) {
            console.log('[AdsManager] [DEV] Banner hidden (placeholder)');
            this.bannerVisible = false;
            this._showDevBanner(false);
            return;
        }

        try {
            await this._admob.hideBanner();
            this.bannerVisible = false;
            console.log('[AdsManager] Banner hidden');
        } catch (err) {
            console.warn('[AdsManager] Banner hide failed:', err);
        }
    },

    // =========================================================================
    // Interstitial Ad — object-completion policy
    // =========================================================================
    async _preloadInterstitial() {
        if (!this._isNative || !this._admob) {
            this.interstitialReady = true; // Always "ready" in dev mode
            return;
        }

        try {
            await this._admob.prepareInterstitial({
                adId: this._getAdId('interstitial'),
                isTesting: this.USE_TEST_ADS,
            });
        } catch (err) {
            console.warn('[AdsManager] Interstitial preload failed:', err);
        }
    },

    // Called by GameScene after EVERY stage clear. This file owns the count.
    onStageClear() {
        if (this.adsRemoved) return;
        SaveManager.state.adStageCounter++;
        SaveManager.persist();

        const every = CONFIG.ADS.interstitialEveryStages;
        const count = SaveManager.state.adStageCounter;
        if (count === 0 || count % every !== 0) return;

        const now = Date.now();
        if (now - this.lastInterstitialTime < CONFIG.ADS.interstitialCooldownMs) return;

        this.showInterstitial();
    },

    async showInterstitial() {
        if (this.adsRemoved) return;
        if (!this._isNative || !this._admob) {
            console.log('[AdsManager] [DEV] Interstitial shown (placeholder)');
            this.logAdEvent('interstitial_shown', { dev: true });
            return new Promise((resolve) => {
                this._showDevOverlay('INTERSTITIAL AD', 1500, () => {
                    this.lastInterstitialTime = Date.now();
                    this.logAdEvent('interstitial_closed', { dev: true });
                    resolve();
                });
            });
        }

        if (!this.interstitialReady) {
            console.log('[AdsManager] Interstitial not ready, skipping');
            return;
        }

        try {
            this.logAdEvent('interstitial_shown', {});
            await this._admob.showInterstitial();
            this.lastInterstitialTime = Date.now();
            this.interstitialReady = false;
        } catch (err) {
            console.warn('[AdsManager] Interstitial show failed:', err);
        }
    },

    // =========================================================================
    // Rewarded Ad
    // =========================================================================
    async _preloadRewarded() {
        if (!this._isNative || !this._admob) {
            this.rewardedReady = true; // Always "ready" in dev mode
            return;
        }

        try {
            await this._admob.prepareRewardVideoAd({
                adId: this._getAdId('rewarded'),
                isTesting: this.USE_TEST_ADS,
            });
        } catch (err) {
            console.warn('[AdsManager] Rewarded preload failed:', err);
        }
    },

    /**
     * Show a rewarded video ad.
     * @param {string} type - 'double_gold' | 'fever_refill'
     * @returns {Promise<boolean>} true if user earned the reward
     */
    async showRewarded(type) {
        type = type || 'double_gold';

        if (!this._isNative || !this._admob) {
            console.log('[AdsManager] [DEV] Rewarded ad (' + type + ') shown');
            return new Promise((resolve) => {
                this._showDevOverlay('REWARDED AD\n(Tap to simulate watch)', 2000, () => {
                    this.logAdEvent('rewarded_ad_watched', { type: type, dev: true });
                    resolve(true);
                });
            });
        }

        if (!this.rewardedReady) {
            console.log('[AdsManager] Rewarded not ready — preloading and waiting up to 20s');
            try {
                await this._preloadRewarded();
                await this._waitForRewardedReady(20000);
            } catch (e) {
                console.warn('[AdsManager] Rewarded wait timeout:', e && e.message);
                return false;
            }
            if (!this.rewardedReady) return false;
        }

        return new Promise((resolve) => {
            let settled = false;
            let rewarded = false;
            const handles = [];

            // Resolve the moment the reward fires so the UI updates behind the
            // still-visible ad; listener cleanup runs in the background.
            const cleanupAsync = () => {
                (async () => {
                    for (const h of handles) {
                        try {
                            const handle = await h;
                            if (handle && typeof handle.remove === 'function') {
                                await handle.remove();
                            }
                        } catch (_) {}
                    }
                })();
            };
            const safeResolve = (val) => {
                if (settled) return;
                settled = true;
                this.rewardedReady = false;
                cleanupAsync();
                setTimeout(() => this._preloadRewarded(), 3000);
                resolve(val);
            };

            handles.push(this._admob.addListener('onRewardedVideoAdReward', (rewardItem) => {
                rewarded = true;
                console.log('[AdsManager] Reward earned:', rewardItem);
                this.logAdEvent('rewarded_ad_watched', {
                    type: type,
                    amount: rewardItem && rewardItem.amount,
                    rewardType: rewardItem && rewardItem.type
                });
                safeResolve(true);
            }));

            handles.push(this._admob.addListener('onRewardedVideoAdDismissed', () => {
                if (!rewarded) this.logAdEvent('rewarded_ad_declined', { type: type });
                safeResolve(rewarded);
            }));

            handles.push(this._admob.addListener('onRewardedVideoAdFailedToShow', (err) => {
                console.warn('[AdsManager] Rewarded show failed:', err);
                safeResolve(false);
            }));

            this._admob.showRewardVideoAd().catch((err) => {
                console.warn('[AdsManager] showRewardVideoAd error:', err);
                safeResolve(false);
            });
        });
    },

    _waitForRewardedReady(timeoutMs) {
        return new Promise((resolve, reject) => {
            if (this.rewardedReady) { resolve(); return; }
            const start = Date.now();
            const check = setInterval(() => {
                if (this.rewardedReady) {
                    clearInterval(check);
                    resolve();
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(check);
                    reject(new Error('Rewarded ad load timeout'));
                }
            }, 200);
        });
    },

    // =========================================================================
    // Analytics
    // =========================================================================
    logAdEvent(eventName, data) {
        console.log('[AdsManager] Event:', eventName, data || {});
    },

    // =========================================================================
    // Platform Helpers
    // =========================================================================
    _getPlatform() {
        if (window.Capacitor && window.Capacitor.getPlatform) {
            const p = window.Capacitor.getPlatform();
            if (p === 'ios') return 'ios';
            if (p === 'android') return 'android';
        }
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
        return 'android';
    },

    _getAdId(type) {
        const platform = this._getPlatform();
        const ids = this.AD_IDS[platform];
        if (ids && ids[type]) return ids[type];
        return this.AD_IDS.android[type];
    },

    // =========================================================================
    // Dev Mode Placeholder UI
    // =========================================================================
    _devBannerEl: null,
    _devOverlayEl: null,

    _showDevBanner(show) {
        if (show) {
            if (!this._devBannerEl) {
                const el = document.createElement('div');
                el.id = 'dev-ad-banner';
                el.style.cssText = [
                    'position:fixed', 'bottom:0', 'left:0', 'right:0',
                    'height:50px', 'background:#222', 'color:#0f0',
                    'display:flex', 'align-items:center', 'justify-content:center',
                    'font-family:monospace', 'font-size:12px', 'z-index:99999',
                    'border-top:2px dashed #0f0', 'opacity:0.85'
                ].join(';');
                el.textContent = '[DEV] AdMob Banner 320x50';
                document.body.appendChild(el);
                this._devBannerEl = el;
            }
            this._devBannerEl.style.display = 'flex';
        } else {
            if (this._devBannerEl) {
                this._devBannerEl.style.display = 'none';
            }
        }
    },

    _showDevOverlay(text, durationMs, onComplete) {
        if (this._devOverlayEl) {
            this._devOverlayEl.remove();
            this._devOverlayEl = null;
        }

        const overlay = document.createElement('div');
        overlay.id = 'dev-ad-overlay';
        overlay.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
            'background:rgba(0,0,0,0.85)', 'color:#0f0',
            'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center',
            'font-family:monospace', 'font-size:16px', 'z-index:999999',
            'cursor:pointer', 'white-space:pre-line', 'text-align:center'
        ].join(';');
        overlay.textContent = text;

        const countdown = document.createElement('div');
        countdown.style.cssText = 'margin-top:20px;font-size:24px;color:#ff0';
        overlay.appendChild(countdown);

        document.body.appendChild(overlay);
        this._devOverlayEl = overlay;

        const startTime = Date.now();
        const updateCountdown = () => {
            const remaining = Math.max(0, durationMs - (Date.now() - startTime));
            countdown.textContent = (remaining / 1000).toFixed(1) + 's';
            if (remaining > 0) requestAnimationFrame(updateCountdown);
        };
        updateCountdown();

        const dismiss = () => {
            if (overlay.parentNode) {
                overlay.remove();
                this._devOverlayEl = null;
                if (onComplete) onComplete();
            }
        };

        const timer = setTimeout(dismiss, durationMs);
        overlay.addEventListener('pointerdown', () => {
            clearTimeout(timer);
            dismiss();
        }, { once: true });
    }
};

// Export globally
window.AdsManager = AdsManager;
