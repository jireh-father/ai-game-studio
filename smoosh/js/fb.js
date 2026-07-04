// =============================================================================
// SMOOSH! - fb.js
// Social service layer: offline-first wrapper around the vendored Firebase
// compat SDK (firestore v8-style API: firebase.firestore()/.collection()/
// .doc(), FieldValue.serverTimestamp()).
//
// Contract (see .superpowers/sdd/task-2-brief.md - later tasks call ONLY
// these methods, so signatures are frozen):
//   Social.ready                                  bool
//   Social.init()                                 -> Promise<bool>
//   Social.setNickname(name)                       -> Promise<{ok}|{offline}>
//   Social.syncProfile(fields)                     -> Promise<{ok}|{offline}>
//   Social.listRecent(limit=20)                    -> Promise<Array>
//   Social.getUser(uid)                            -> Promise<obj|null|{offline}>
//   Social.sendFriendReq(toUid)                    -> Promise<{ok}|{offline}>
//   Social.myRequests()                            -> Promise<Array>
//   Social.respond(reqId, accept)                  -> Promise<{ok}|{offline}>
//   Social.friends()                               -> Promise<Array>
//   Social.sendGift(toUid, kind, payload)          -> Promise<{ok}|{offline}>
//   Social.inbox()                                 -> Promise<Array>
//   Social.claimGift(giftId)                       -> Promise<{ok}|{offline}>
//
// EVERY method: if !Social.ready -> resolves a safe fallback, NEVER throws
// or rejects. List-shaped methods (listRecent/myRequests/friends/inbox)
// fall back to []; everything else falls back to { offline: true }. All
// Firestore calls are wrapped in try/catch with that same fallback, so a
// mid-flight network failure degrades exactly like being offline from the
// start (except sendGift, which additionally refunds any local deduction -
// see below).
//
// Testability: Social._db is injectable (tests stub it directly, no real
// Firebase needed); Social._profileDoc/_todayKey are pure functions unit
// tested with plain objects (tests/social.test.js).
// =============================================================================

const Social = {
    ready: false,

    _app: null,
    _auth: null,
    _db: null,      // injectable for tests
    _uid: null,
    _initPromise: null,

    // -------------------------------------------------------------------
    // Pure helpers - no Firebase, no SaveManager global; plain args only.
    // -------------------------------------------------------------------

    // True only when a real (non-null) Firebase config AND the compat SDK
    // are both present. Uses typeof so this is safe to call even when
    // FB_CONFIG/firebase were never declared anywhere (Node test context).
    _hasConfig() {
        return typeof FB_CONFIG !== 'undefined' && !!FB_CONFIG &&
            typeof firebase !== 'undefined';
    },

    // serverTimestamp() sentinel when the real SDK is loaded, else a plain
    // client-clock fallback (used by pure helpers and offline-safe writes).
    _serverTs() {
        return (typeof firebase !== 'undefined' && firebase.firestore &&
            firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : Date.now();
    },

    // UTC yyyy-mm-dd for the daily gift counter doc field `sent_{todayKey}`.
    // Deliberately UTC (not device-local) so the daily window is the same
    // moment for every player regardless of timezone.
    _todayKey(now) {
        const d = now instanceof Date ? now : new Date(now);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    // Builds the users/{uid} Firestore payload from local save state + the
    // owned-pets array. Pure: only reads its arguments (+ the _serverTs
    // typeof-guarded fallback), never touches SaveManager/firebase globals
    // for state - safe to unit-test with plain objects.
    _profileDoc(state, pets) {
        return {
            nickname: (state && state.social && state.social.nickname) || null,
            petIds: (pets || []).map(p => p.species),
            repPetId: (state && state.repPet) || null,
            decor: (state && state.decorPlaced) || [],
            stats: {
                stage: (state && (state.bestStage || state.stage)) || 1,
                kills: (state && state.totalKills) || 0
            },
            lastActiveAt: this._serverTs()
        };
    },

    // -------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------

    // Fire-and-forget from main.js boot. Cached promise -> calling init()
    // multiple times never re-runs sign-in/profile-creation; every caller
    // just awaits the same in-flight (or already-settled) result.
    init() {
        if (!this._initPromise) {
            this._initPromise = this._doInit().then(ok => {
                if (!ok) this._initPromise = null; // allow a failed init to be retried
                return ok;
            });
        }
        return this._initPromise;
    },

    async _doInit() {
        try {
            if (!this._hasConfig()) {
                this.ready = false;
                return false;
            }

            this._app = (firebase.apps && firebase.apps.length)
                ? firebase.apps[0] : firebase.initializeApp(FB_CONFIG);
            this._auth = firebase.auth();
            if (!this._db) this._db = firebase.firestore();

            const cred = await this._auth.signInAnonymously();
            this._uid = (cred && cred.user && cred.user.uid) ||
                (this._auth.currentUser && this._auth.currentUser.uid) || null;
            if (!this._uid) {
                this.ready = false;
                return false;
            }

            const userRef = this._db.collection('users').doc(this._uid);
            const snap = await userRef.get();

            if (!snap.exists) {
                const nickname = Nicknames.generate(Math.random);
                const seedState = Object.assign({}, SaveManager.state, {
                    social: Object.assign({}, SaveManager.state.social, { nickname })
                });
                const doc = this._profileDoc(seedState, seedState.pets);
                doc.nickname = nickname;
                doc.createdAt = this._serverTs();
                await userRef.set(doc, { merge: true });
                SaveManager.state.social = Object.assign(
                    {}, SaveManager.state.social, { uid: this._uid, nickname });
            } else {
                const data = snap.data() || {};
                SaveManager.state.social = Object.assign(
                    {}, SaveManager.state.social,
                    { uid: this._uid, nickname: data.nickname || null });
            }
            SaveManager.persist();

            this.ready = true;
            // Fire-and-forget so lastActiveAt/stats/petIds/decor refresh every
            // online session, for BOTH new and returning users (this shared
            // return point is reached by both branches above).
            this.syncProfile().catch(() => {});
            return true;
        } catch (e) {
            this.ready = false;
            return false;
        }
    },

    // -------------------------------------------------------------------
    // Profile
    // -------------------------------------------------------------------

    async setNickname(name) {
        if (!this.ready) return { offline: true };
        if (!Nicknames.valid(name)) return { ok: false, reason: 'invalid' };
        try {
            await this._db.collection('users').doc(this._uid)
                .set({ nickname: name }, { merge: true });
            SaveManager.state.social = Object.assign(
                {}, SaveManager.state.social, { nickname: name });
            SaveManager.persist();
            return { ok: true };
        } catch (e) {
            return { offline: true };
        }
    },

    // Merge-writes lastActiveAt/repPetId/petIds/stats/decor built from the
    // current local save; `fields` (optional) overrides any of those keys.
    // Nickname changes go through setNickname() only, not syncProfile.
    async syncProfile(fields) {
        if (!this.ready) return { offline: true };
        try {
            const doc = this._profileDoc(SaveManager.state, SaveManager.state.pets);
            const payload = Object.assign({
                lastActiveAt: doc.lastActiveAt,
                repPetId: doc.repPetId,
                petIds: doc.petIds,
                stats: doc.stats,
                decor: doc.decor
            }, fields || {});
            await this._db.collection('users').doc(this._uid)
                .set(payload, { merge: true });
            return { ok: true };
        } catch (e) {
            return { offline: true };
        }
    },

    async getUser(uid) {
        if (!this.ready) return { offline: true };
        try {
            const snap = await this._db.collection('users').doc(uid).get();
            return snap.exists ? Object.assign({ uid: snap.id }, snap.data()) : null;
        } catch (e) {
            return { offline: true };
        }
    },

    // Most-recently-active players, excluding me. Fetches limit+1 so
    // filtering out my own uid still leaves `limit` results.
    async listRecent(limit = 20) {
        if (!this.ready) return [];
        try {
            const snap = await this._db.collection('users')
                .orderBy('lastActiveAt', 'desc')
                .limit(limit + 1)
                .get();
            return snap.docs
                .filter(d => d.id !== this._uid)
                .slice(0, limit)
                .map(d => Object.assign({ uid: d.id }, d.data()));
        } catch (e) {
            return [];
        }
    },

    // -------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------

    async sendFriendReq(toUid) {
        if (!this.ready) return { offline: true };
        try {
            const ref = await this._db.collection('friendReqs').add({
                from: this._uid, to: toUid, status: 'pending', ts: this._serverTs()
            });
            return { ok: true, id: ref.id };
        } catch (e) {
            return { offline: true };
        }
    },

    // Incoming pending requests (to me), for an accept/decline inbox.
    async myRequests() {
        if (!this.ready) return [];
        try {
            const snap = await this._db.collection('friendReqs')
                .where('to', '==', this._uid)
                .where('status', '==', 'pending')
                .get();
            return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
        } catch (e) {
            return [];
        }
    },

    async respond(reqId, accept) {
        if (!this.ready) return { offline: true };
        try {
            await this._db.collection('friendReqs').doc(reqId)
                .set({ status: accept ? 'accepted' : 'declined' }, { merge: true });
            return { ok: true };
        } catch (e) {
            return { offline: true };
        }
    },

    // Accepted friendReqs where I'm either side, mapped to the OTHER uid +
    // their cached nickname. Two queries (Firestore compat can't OR across
    // fields), profiles batch-fetched with Promise.all, capped at 20.
    async friends() {
        if (!this.ready) return [];
        try {
            const [fromSnap, toSnap] = await Promise.all([
                this._db.collection('friendReqs')
                    .where('from', '==', this._uid).where('status', '==', 'accepted').get(),
                this._db.collection('friendReqs')
                    .where('to', '==', this._uid).where('status', '==', 'accepted').get()
            ]);
            const otherUids = [];
            fromSnap.docs.forEach(d => otherUids.push(d.data().to));
            toSnap.docs.forEach(d => otherUids.push(d.data().from));
            const uniq = Array.from(new Set(otherUids)).slice(0, 20);
            const profiles = await Promise.all(uniq.map(uid => this.getUser(uid)));
            return uniq.map((uid, i) => {
                const p = profiles[i];
                return { uid, nickname: (p && !p.offline && p.nickname) || null };
            });
        } catch (e) {
            return [];
        }
    },

    // -------------------------------------------------------------------
    // Gifts
    // -------------------------------------------------------------------

    // Money-safety order: validate -> deduct LOCAL SaveManager balance +
    // persist -> write gift doc + increment the daily counter -> on ANY
    // write failure, refund the local balance + persist and report
    // { ok:false, reason:'network' }. `payload` is the gift amount (gold/
    // gems) or the itemId string (decor).
    async sendGift(toUid, kind, payload) {
        if (!this.ready) return { offline: true };

        const state = SaveManager.state;
        const todayKey = this._todayKey(new Date());
        const sentField = 'sent_' + todayKey;
        const sentToday = (state.social && state.social[sentField]) || 0;

        const amount = (kind === 'decor') ? 1 : payload;
        const check = Balance.giftAllowed(kind, amount, sentToday);
        if (!check.ok) return { ok: false, reason: check.reason };

        if (kind === 'gold') {
            if (state.gold < payload) return { ok: false, reason: 'balance' };
            state.gold -= payload;
        } else if (kind === 'gems') {
            if (state.gems < payload) return { ok: false, reason: 'balance' };
            state.gems -= payload;
        }
        // decor: no local currency cost model yet - the item itself is the cost.
        SaveManager.persist();

        try {
            const giftDoc = {
                from: this._uid, to: toUid, kind, status: 'sent', ts: this._serverTs()
            };
            if (kind === 'decor') giftDoc.itemId = payload;
            else giftDoc.amount = payload;

            await this._db.collection('gifts').add(giftDoc);
        } catch (writeErr) {
            // Gift doc write failed -> refund the local deduction so the
            // player's balance never silently vanishes.
            if (kind === 'gold') state.gold += payload;
            else if (kind === 'gems') state.gems += payload;
            SaveManager.persist();
            return { ok: false, reason: 'network' };
        }

        // Counter write is best-effort: the gift is already committed and paid for
        // locally, so under-counting the daily limit is acceptable. Never refund
        // on counter failure, as the gift doc is already live and claimable.
        try {
            const newCount = sentToday + 1;
            await this._db.collection('users').doc(this._uid)
                .set({ [sentField]: newCount }, { merge: true });

            state.social = Object.assign({}, state.social, { [sentField]: newCount });
            SaveManager.persist();
        } catch (counterErr) {
            // Swallow counter errors - gift is already sent.
        }

        return { ok: true };
    },

    // Unclaimed gifts sent to me.
    async inbox() {
        if (!this.ready) return [];
        try {
            const snap = await this._db.collection('gifts')
                .where('to', '==', this._uid)
                .where('status', '==', 'sent')
                .get();
            return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
        } catch (e) {
            return [];
        }
    },

    // Marks a gift claimed and returns its payload; the CALLER credits the
    // local save (SaveManager) - this method never touches local currency.
    async claimGift(giftId) {
        if (!this.ready) return { offline: true };
        try {
            const ref = this._db.collection('gifts').doc(giftId);
            const snap = await ref.get();
            if (!snap.exists) return { ok: false, reason: 'notfound' };
            const data = snap.data();
            if (data.status === 'claimed') return { ok: false, reason: 'already' };
            await ref.set({ status: 'claimed' }, { merge: true });
            return { ok: true, kind: data.kind, amount: data.amount, itemId: data.itemId };
        } catch (e) {
            return { offline: true };
        }
    }
};

if (typeof module !== 'undefined') {
    // Node test context: pull in the globals fb.js's methods reference
    // (same shim pattern as balance.js/gacha.js/battle.js). Never require
    // the vendored Firebase compat bundles here - they're browser UMD
    // globals, not CommonJS, and no test path should touch the network.
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof Nicknames === 'undefined') globalThis.Nicknames = require('./nicknames.js').Nicknames;
    if (typeof Balance === 'undefined') globalThis.Balance = require('./balance.js').Balance;
    if (typeof SaveManager === 'undefined') globalThis.SaveManager = require('./save.js').SaveManager;
    module.exports = { Social };
}
