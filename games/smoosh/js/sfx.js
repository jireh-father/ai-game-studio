// =============================================================================
// SMOOSH! - sfx.js
// Fully synthesized Web Audio: no audio assets shipped. Squish/pop family
// with combo pitch climbing. AudioContext created ONLY in unlockAudio()
// (first user gesture). Architecture ported from Peel It! sfx.js.
// =============================================================================

const Sfx = {

    _ctx: null,
    _master: null,
    _muted: false,

    // v6 Task 7 - fever BGM scheduler state (see feverMusicStart/Stop below).
    _feverMusicPlaying: false,
    _feverTimer: null,
    _feverActiveNodes: [],

    setMuted(b) {
        this._muted = b;
        if (this._master) {
            this._master.gain.setTargetAtTime(b ? 0 : 1, this._now(), 0.02);
        }
    },

    unlockAudio() {
        if (!this._ctx) {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                this._ctx = new AC();
                this._master = this._ctx.createGain();
                this._master.gain.value = this._muted ? 0 : 1;
                this._master.connect(this._ctx.destination);
            } catch (e) {
                return; // no audio - game still plays
            }
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
    },

    _now() { return this._ctx ? this._ctx.currentTime : 0; },

    _noiseBuffer() {
        if (this._nb) return this._nb;
        const len = this._ctx.sampleRate * 1;
        const buf = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this._nb = buf;
        return buf;
    },

    _tone(freq, t0, dur, type, gain, freqEnd) {
        const osc = this._ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
        const g = this._ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(g); g.connect(this._master);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
    },

    _click(t0, gain) {
        const src = this._ctx.createBufferSource();
        src.buffer = this._noiseBuffer();
        const hp = this._ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 2200;
        const g = this._ctx.createGain();
        g.gain.setValueAtTime(gain, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.02);
        src.connect(hp); hp.connect(g); g.connect(this._master);
        src.start(t0, Math.random() * 0.5, 0.03);
    },

    // The squish: pitch climbs with combo (caps at +40 kills).
    pop(combo) {
        if (!this._ctx) return;
        const t = this._now();
        const f = 300 + Math.min(combo || 0, 40) * 18;
        this._tone(f, t, 0.10, 'sine', 0.16, f * 0.55); // downward blip = "squish"
        this._click(t, 0.08);
    },

    // Soft squelch for a NON-fatal hit - every tap that lands gives feedback.
    hit() {
        if (!this._ctx) return;
        const t = this._now();
        const f = 220 + Math.random() * 60;
        this._tone(f, t, 0.06, 'sine', 0.09, f * 0.7);
        this._click(t, 0.05);
    },

    crit() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(880, t, 0.12, 'sawtooth', 0.10, 1760);
        this._tone(1320, t + 0.02, 0.10, 'square', 0.06);
    },

    clank() { // shield block
        if (!this._ctx) return;
        const t = this._now();
        this._tone(520, t, 0.06, 'square', 0.10, 480);
        this._click(t, 0.10);
    },

    // v6 Task 5: a monster's melee bite landing - a low punchy thud
    // (distinct from hit()'s soft mid-pitch squelch and clank()'s bright
    // shield-block square wave) plus a gritty noise snap for the "crunch"
    // texture, timed a beat after the thud so it reads as one impact.
    crunch() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(160, t, 0.09, 'square', 0.13, 70);
        this._click(t + 0.015, 0.11);
    },

    splitPop() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(500, t, 0.08, 'sine', 0.14, 300);
        this._tone(500, t + 0.07, 0.08, 'sine', 0.12, 700);
    },

    coin() {
        if (!this._ctx) return;
        const t = this._now();
        const osc = this._ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1320, t);
        osc.frequency.setValueAtTime(1760, t + 0.04);
        const g = this._ctx.createGain();
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(g); g.connect(this._master);
        osc.start(t); osc.stop(t + 0.09);
    },

    jackpot() {
        if (!this._ctx) return;
        const t = this._now();
        [1046.5, 1318.5, 1568, 2093].forEach((f, i) =>
            this._tone(f, t + i * 0.06, 0.25, 'triangle', 0.16));
    },

    // v6 Task 11 - the gacha reveal's pre-pop "charging" sweep: two layered
    // upward-ramping tones under the intensifying egg-shake (shop.js
    // playReveal). Distinct from feverStart's riser below (that one fires
    // once, instantly, at the fever trigger) - this climbs for ~1s to match
    // the egg's own build-up duration, so sound and shake peak together.
    gachaCharge() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(130, t, 0.95, 'sawtooth', 0.09, 620);
        this._tone(200, t + 0.18, 0.75, 'triangle', 0.07, 900);
    },

    // Extra fanfare layered ON TOP of jackpot() specifically for a
    // legendary pull - a longer 5-note ascending run plus a sub-bass boom,
    // so the rarest pull is audibly, not just visually, the biggest moment.
    legendaryFanfare() {
        if (!this._ctx) return;
        const t = this._now();
        [523.25, 659.25, 784, 1046.5, 1318.5].forEach((f, i) =>
            this._tone(f, t + i * 0.055, 0.5, 'triangle', 0.14));
        this._tone(85, t, 0.45, 'sine', 0.22, 40);
    },

    feverStart() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(200, t, 0.45, 'sawtooth', 0.14, 1200); // riser
        this._tone(400, t + 0.3, 0.3, 'triangle', 0.12, 1600);
    },

    feverEnd() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(900, t, 0.3, 'triangle', 0.10, 300);
    },

    // =========================================================================
    // v6 Task 7 - FEVER BGM: an upbeat looped chiptune (8-step arpeggio over
    // a driving bass) that runs for the whole fever window, started by
    // Feel.feverStart() and stopped by Feel.feverEnd() (game.js).
    //
    // Scheduling: a classic "lookahead" sequencer (see Chris Wilson's "A Tale
    // of Two Clocks") - a setInterval "ticker" wakes up often (50ms) and, each
    // time, schedules every step whose start time falls within the next
    // `LOOKAHEAD` seconds using the AudioContext's OWN sample-accurate clock
    // (`t0` passed to osc.start/stop) - so playback timing rides the audio
    // clock, not the sloppy JS timer. This is independent of Phaser's update
    // loop by design: fever's on-screen countdown can freeze (e.g. the player
    // opens the in-game shop, which calls scene.pause()) without the music
    // stuttering out of rhythm - it simply keeps looping until
    // feverMusicStop() is called, exactly mirroring "fever is still active,
    // just paused" rather than drifting from the visual state.
    // =========================================================================

    // Pure pattern data (no AudioContext touched) - semitone offsets, kept as
    // plain arrays so the note-frequency math below is unit-testable without
    // any Web Audio object at all.
    FEVER_ARP_STEPS: [0, 3, 7, 10, 12, 10, 7, 3],   // 8-step up/down arpeggio
    FEVER_BASS_STEPS: [0, 0, 7, 7],                  // driving root/fifth bass

    // Pure helper (no AudioContext): semitone offset -> absolute Hz. Kept
    // free of `this._ctx` so it's directly unit-testable.
    feverNoteFreq(rootHz, semitones) {
        return rootHz * Math.pow(2, semitones / 12);
    },

    // Internal: schedule one arpeggio note (+ a bass note every other step)
    // at exact time t0. Tracks the oscillator in _feverActiveNodes so
    // feverMusicStop() can hard-stop anything still ringing/queued, and
    // self-removes on natural completion so the array never grows unbounded
    // across a long fever window.
    _feverTone(freq, t0, dur, type, gain) {
        const osc = this._ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        const g = this._ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(g); g.connect(this._master);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
        this._feverActiveNodes.push(osc);
        osc.onended = () => {
            try { osc.disconnect(); } catch (e) {}
            try { g.disconnect(); } catch (e) {}
            const i = this._feverActiveNodes.indexOf(osc);
            if (i !== -1) this._feverActiveNodes.splice(i, 1);
        };
    },

    _feverScheduleStep(step, t0) {
        const ROOT = 220; // A3
        const arpF = this.feverNoteFreq(ROOT * 2, this.FEVER_ARP_STEPS[step]);
        this._feverTone(arpF, t0, this._feverStepDur * 0.9, 'square', 0.045);
        if (step % 2 === 0) { // bass on the "beat" (every other 8th-note step)
            const bassIdx = (step / 2) % this.FEVER_BASS_STEPS.length;
            const bassF = this.feverNoteFreq(ROOT / 2, this.FEVER_BASS_STEPS[bassIdx]);
            this._feverTone(bassF, t0, this._feverStepDur * 1.7, 'sawtooth', 0.07);
        }
    },

    _feverSchedulerTick() {
        if (!this._ctx || !this._feverMusicPlaying) return;
        const LOOKAHEAD = 0.15;
        while (this._feverNextNoteTime < this._ctx.currentTime + LOOKAHEAD) {
            this._feverScheduleStep(this._feverStep, this._feverNextNoteTime);
            this._feverStep = (this._feverStep + 1) % this.FEVER_ARP_STEPS.length;
            this._feverNextNoteTime += this._feverStepDur;
        }
    },

    // Starts the loop. Guards (in order): muted -> silent by design, no
    // point scheduling oscillators nobody will hear; no unlocked
    // AudioContext yet -> safe no-op, never throws; already playing ->
    // idempotent (a second feverStart before the first feverEnd, e.g. from
    // an upgrade instantly refilling the gauge, must not stack two
    // schedulers/timers).
    feverMusicStart() {
        if (this._muted || !this._ctx) return;
        if (this._feverMusicPlaying) return;
        this._feverMusicPlaying = true;
        this._feverStep = 0;
        this._feverStepDur = 60 / 172 / 2; // 172bpm, 8th-note steps (~0.174s)
        this._feverNextNoteTime = this._ctx.currentTime + 0.05;
        this._feverSchedulerTick(); // schedule the first batch immediately
        this._feverTimer = setInterval(() => this._feverSchedulerTick(), 50);
    },

    // Stops cleanly: cancels the ticker AND hard-stops/disconnects every
    // still-live oscillator (including ones already scheduled a few dozen ms
    // into the future by the lookahead above) so nothing rings past the
    // fever window. Safe to call any time, including when nothing is
    // playing (SHUTDOWN cleanup calls this unconditionally - see game.js).
    feverMusicStop() {
        if (this._feverTimer) { clearInterval(this._feverTimer); this._feverTimer = null; }
        this._feverMusicPlaying = false;
        const now = this._ctx ? this._now() : 0;
        for (const osc of this._feverActiveNodes.slice()) {
            try { osc.stop(now); } catch (e) {}
            try { osc.disconnect(); } catch (e) {}
        }
        this._feverActiveNodes.length = 0;
    },

    bossBoom() {
        if (!this._ctx) return;
        const t = this._now();
        this._tone(70, t, 0.5, 'sine', 0.4, 40);
        const src = this._ctx.createBufferSource();
        src.buffer = this._noiseBuffer();
        const lp = this._ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 900;
        const g = this._ctx.createGain();
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        src.connect(lp); lp.connect(g); g.connect(this._master);
        src.start(t, 0, 0.4);
    },

    stageClear() {
        if (!this._ctx) return;
        const t = this._now();
        [523.25, 659.25, 784].forEach((f, i) =>
            this._tone(f, t + i * 0.07, 0.28, 'triangle', 0.14));
    },

    // =========================================================================
    // v2.2.1 - VOICES. Cute-but-dark bear-ish monster grunts and adorable
    // attack yelps, fully synthesized: sawtooth "throat" + lowpass "mouth"
    // + vibrato. Every call randomizes pitch a little so events never sound
    // the same twice. Bigger monsters = deeper voices.
    // =========================================================================
    _voice(f0, f1, dur, gain, lpFreq, vibHz, type) {
        const t = this._now();
        const osc = this._ctx.createOscillator();
        osc.type = type || 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);

        // vibrato = the "throat wobble" that makes it feel alive
        const lfo = this._ctx.createOscillator();
        lfo.frequency.value = vibHz || 9;
        const lfoGain = this._ctx.createGain();
        lfoGain.gain.value = f0 * 0.06;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);

        const lp = this._ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = lpFreq || 600;
        lp.Q.value = 2.5; // slight formant resonance = "mouth"

        const g = this._ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(lp); lp.connect(g); g.connect(this._master);
        osc.start(t); osc.stop(t + dur + 0.02);
        lfo.start(t); lfo.stop(t + dur + 0.02);
    },

    _sizePitch(r) {
        // radius 26 (mini) ~ 240 (boss): high squeak -> deep bear
        const base = Math.max(60, 240 - r * 1.5);
        return base * (0.88 + Math.random() * 0.27); // never the same twice
    },

    // "Ow!" - a short dark grunt when a monster takes a hit (3 variants).
    monsterHurt(r) {
        if (!this._ctx) return;
        const f = this._sizePitch(r);
        const v = Math.floor(Math.random() * 3);
        if (v === 0) this._voice(f * 1.3, f * 0.8, 0.12, 0.09, 550, 11);
        else if (v === 1) this._voice(f * 1.1, f * 1.25, 0.09, 0.08, 620, 14);
        else this._voice(f * 1.4, f * 0.7, 0.15, 0.09, 480, 8);
    },

    // A cute-dark dying groan, longer and droopier (3 variants).
    monsterDeath(r) {
        if (!this._ctx) return;
        const f = this._sizePitch(r);
        const v = Math.floor(Math.random() * 3);
        if (v === 0) this._voice(f * 1.2, f * 0.45, 0.32, 0.12, 500, 7);
        else if (v === 1) {
            this._voice(f * 1.35, f * 0.9, 0.14, 0.11, 550, 10);
            const t = this._now();
            setTimeout(() => this._ctx && this._voice(f * 0.9, f * 0.4, 0.2, 0.09, 450, 6), 120);
        } else this._voice(f * 1.05, f * 0.5, 0.28, 0.12, 520, 12);
    },

    // The boss bear ROAR: two layered throats + growl tremor.
    bossRoar() {
        if (!this._ctx) return;
        const f = 65 + Math.random() * 25;
        this._voice(f * 1.4, f, 0.65, 0.28, 420, 22);
        this._voice(f * 2.1, f * 1.3, 0.5, 0.14, 700, 25, 'square');
    },

    // A short aggressive bark when a monster ATTACKS (2 variants).
    monsterAttack(r) {
        if (!this._ctx) return;
        const f = this._sizePitch(r);
        if (Math.random() < 0.5) this._voice(f * 0.9, f * 1.5, 0.1, 0.1, 700, 16);
        else this._voice(f * 1.5, f * 1.0, 0.13, 0.1, 600, 12, 'square');
    },

    // "Yap!" - the adorable attack cry (pets & pvp). Element tints the pitch.
    petYelp(element) {
        if (!this._ctx) return;
        const base = { fire: 520, electric: 700, water: 440, leaf: 600 }[element] || 550;
        const f = base * (0.9 + Math.random() * 0.25);
        const v = Math.floor(Math.random() * 3);
        if (v === 0) this._voice(f, f * 1.6, 0.09, 0.10, 2200, 18, 'triangle');
        else if (v === 1) this._voice(f * 0.8, f * 1.4, 0.11, 0.09, 1800, 15, 'triangle');
        else {
            this._voice(f, f * 1.5, 0.07, 0.09, 2400, 20, 'triangle');
            setTimeout(() => this._ctx && this._voice(f * 1.2, f * 1.7, 0.06, 0.07, 2400, 20, 'triangle'), 70);
        }
    }
};

if (typeof module !== 'undefined') module.exports = { Sfx };
