// Ad Manager - placeholder implementation for ad network integration
const AdManager = {
  gameOverCount: 0,
  continueUsedThisRun: false,
  smellBlockerWave: -999,

  init() {
    // Initialize ad network SDK placeholder
    if (window.adNetwork) window.adNetwork.init();
  },

  showInterstitial(callback) {
    this.gameOverCount++;
    // Show every 3rd game over
    if (this.gameOverCount % 3 === 0) {
      this._showAdPlaceholder('Interstitial Ad\n(5 seconds)', 5000, callback);
    } else {
      if (callback) callback();
    }
  },

  showRewardedContinue(onRewarded, onDeclined) {
    if (this.continueUsedThisRun) {
      if (onDeclined) onDeclined();
      return;
    }
    this._showRewardedPlaceholder('Watch ad to continue?', () => {
      this.continueUsedThisRun = true;
      if (onRewarded) onRewarded();
    }, onDeclined);
  },

  showRewardedDoublePoints(onRewarded, onDeclined) {
    this._showRewardedPlaceholder('Watch ad for 2x Fridge Points?', onRewarded, onDeclined);
  },

  showRewardedSmellBlocker(waveNumber, onRewarded, onDeclined) {
    if (waveNumber - this.smellBlockerWave < 10) {
      if (onDeclined) onDeclined();
      return;
    }
    this._showRewardedPlaceholder('Watch ad for Smell Blocker?', () => {
      this.smellBlockerWave = waveNumber;
      if (onRewarded) onRewarded();
    }, onDeclined);
  },

  showBanner(show) {
    // Banner placeholder - would show/hide actual banner ad
  },

  trackAdEvent(eventName, params) {
    // Analytics placeholder
    console.log('[AdEvent]', eventName, params);
  },

  resetRun() {
    this.continueUsedThisRun = false;
    this.gameOverCount = 0;
  },

  _showAdPlaceholder(message, duration, callback) {
    // Simple overlay placeholder for ad
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);
      z-index:10000;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;text-align:center;`;
    overlay.innerHTML = `<div>${message.replace(/\n/g,'<br>')}<br><br><small>Closes automatically...</small></div>`;
    document.body.appendChild(overlay);
    setTimeout(() => {
      document.body.removeChild(overlay);
      if (callback) callback();
    }, duration);
  },

  _showRewardedPlaceholder(prompt, onRewarded, onDeclined) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);
      z-index:10000;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-size:18px;text-align:center;gap:20px;`;
    overlay.innerHTML = `
      <div>${prompt}</div>
      <button id="ad-watch" style="padding:12px 28px;background:#52B788;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Watch Ad</button>
      <button id="ad-skip" style="padding:12px 28px;background:#888;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">No Thanks</button>
    `;
    document.body.appendChild(overlay);
    document.getElementById('ad-watch').addEventListener('click', () => {
      document.body.removeChild(overlay);
      this._showAdPlaceholder('Rewarded Ad\n(Watching...)', 2000, onRewarded);
    });
    document.getElementById('ad-skip').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (onDeclined) onDeclined();
    });
  },
};
