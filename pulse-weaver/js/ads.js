// Ad placeholders and Audio Engine

// ---- Audio Engine ----
const AudioEngine = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  musicOscillators: [],
  musicLFO: null,
  musicLFOGain: null,
  musicFilter: null,
  enabled: true,
  musicEnabled: true,
  currentMusicState: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 800;
      this.musicGain.connect(this.musicFilter);
      this.musicFilter.connect(this.masterGain);
    } catch (e) {
      console.warn('AudioContext not available:', e);
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playTone(freq, duration, type = 'sine', vol = 0.3, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration + 0.05);
    } catch (e) {}
  },

  playNoise(duration, vol = 0.2) {
    if (!this.enabled || !this.ctx) return;
    try {
      const bufSize = this.ctx.sampleRate * duration;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start();
    } catch (e) {}
  },

  playTransform(elementType) {
    if (!this.enabled) return;
    switch (elementType) {
      case 'fire':      this.playTone(150, 0.3, 'sawtooth', 0.25); break;
      case 'water':
        this.playTone(400, 0.35, 'sine', 0.3);
        this.playTone(200, 0.35, 'sine', 0.15, 0.1);
        break;
      case 'ice':       this.playTone(1200, 0.15, 'sine', 0.25); break;
      case 'lightning': this.playNoise(0.2, 0.2); this.playTone(800, 0.2, 'square', 0.15); break;
      case 'void':      this.playTone(80, 0.4, 'sine', 0.3); break;
      case 'earth':     this.playTone(80, 0.25, 'triangle', 0.3); this.playTone(160, 0.25, 'sine', 0.1); break;
      case 'wind':      this.playTone(600, 0.15, 'sine', 0.2); this.playTone(1400, 0.15, 'sine', 0.1, 0.1); break;
      case 'crystal':   this.playTone(1600, 0.2, 'sine', 0.25); break;
    }
  },

  playCombo(chordNotes) {
    if (!this.enabled || !chordNotes || chordNotes.length === 0) return;
    chordNotes.forEach((freq, i) => {
      this.playTone(freq, 0.5, 'sine', 0.2, i * 0.03);
    });
  },

  playStageComplete() {
    if (!this.enabled) return;
    [400, 500, 600, 800].forEach((f, i) => this.playTone(f, 0.3, 'sine', 0.25, i * 0.15));
  },

  playStageFail() {
    if (!this.enabled) return;
    this.playTone(400, 0.3, 'sawtooth', 0.2);
    this.playTone(200, 0.3, 'sine', 0.2, 0.2);
  },

  playButton() {
    if (!this.enabled) return;
    this.playTone(1000, 0.05, 'sine', 0.15);
  },

  playDrawStart() {
    if (!this.enabled) return;
    this.playTone(300, 0.1, 'sine', 0.1);
  },

  startMusic(gameState) {
    if (!this.musicEnabled || !this.ctx) return;
    this.stopMusic();
    this.currentMusicState = gameState;

    const stateConfig = {
      menu:    { freq: 261, filterHz: 800,  vol: 0.15 },
      stage1:  { freq: 392, filterHz: 1200, vol: 0.12 },
      stage11: { freq: 220, filterHz: 1600, vol: 0.13 },
      stage26: { freq: 330, filterHz: 2400, vol: 0.14 },
      stage51: { freq: 293, filterHz: 3200, vol: 0.15 },
    };

    const cfg = stateConfig[gameState] || stateConfig.menu;
    if (this.musicFilter) this.musicFilter.frequency.value = cfg.filterHz;
    if (this.musicGain) this.musicGain.gain.value = cfg.vol;

    // Create 3 detuned oscillators for pad sound
    [0, 4, 7].forEach((semitones, i) => {
      try {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = cfg.freq * Math.pow(2, semitones / 12) * (1 + (i - 1) * 0.005);
        osc.connect(this.musicGain);
        osc.start();
        this.musicOscillators.push(osc);
      } catch (e) {}
    });
  },

  stopMusic() {
    this.musicOscillators.forEach(osc => { try { osc.stop(); } catch (e) {} });
    this.musicOscillators = [];
  },

  setMusicVolume(vol, rampTime = 0.5) {
    if (!this.musicGain || !this.ctx) return;
    this.musicGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + rampTime);
  },

  setMusicFilter(hz, rampTime = 0.5) {
    if (!this.musicFilter || !this.ctx) return;
    this.musicFilter.frequency.linearRampToValueAtTime(hz, this.ctx.currentTime + rampTime);
  },
};

// ---- Ad Placeholders ----
const AdManager = {
  interstitialCount: 0,
  interstitialShownThisSession: 0,
  rewardedCooldowns: {},

  init() {
    const stored = localStorage.getItem('pulse-weaver-ads');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.interstitialCount = data.count || 0;
      } catch (e) {}
    }
  },

  save() {
    localStorage.setItem('pulse-weaver-ads', JSON.stringify({ count: this.interstitialCount }));
  },

  // Called after quit to menu or milestone stage
  maybeShowInterstitial(context, onClosed) {
    this.interstitialCount++;
    this.save();
    // Show every 3rd quit or at milestone
    const shouldShow = (context === 'milestone') || (this.interstitialCount % 3 === 0);
    if (shouldShow) {
      this._showInterstitialPlaceholder(onClosed);
    } else {
      if (onClosed) onClosed();
    }
  },

  _showInterstitialPlaceholder(onClosed) {
    // Placeholder — replace with real SDK call
    console.log('[Ad] Interstitial would show here');
    setTimeout(() => { if (onClosed) onClosed(); }, 500);
  },

  showRewardedForHint(callback) {
    console.log('[Ad] Rewarded ad for hint');
    setTimeout(() => { if (callback) callback(true); }, 500);
  },

  showRewardedForScore(callback) {
    console.log('[Ad] Rewarded ad for score');
    setTimeout(() => { if (callback) callback(true); }, 500);
  },
};
