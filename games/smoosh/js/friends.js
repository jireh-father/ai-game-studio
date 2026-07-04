// =============================================================================
// SMOOSH! - friends.js
// v3.5 Task 5: FriendsScene - PLAYERS / FRIENDS / INBOX over the offline-first
// Social service layer (fb.js). No new pure gameplay logic - this is UI wiring
// over the already-tested fb.js/balance.js contracts, EXCEPT the tiny gift
// payload/clamp helper below (FriendsGift), which is pure and unit tested
// (tests/friends.test.js) the same way NestAI/StageMap/Dex are in their files.
// =============================================================================

// Pure: how big can the amount stepper go for gold/gems, and what payload
// does Social.sendGift(toUid, kind, payload) expect for a given kind? Kept
// outside the Phaser guard so plain Node tests can require() it directly.
const FriendsGift = {
    // caps[kind] (Balance.giftAllowed) + current balance clamp the stepper's
    // max; probing giftAllowed at amount=1 is enough to catch the 'daily'
    // (or invalid 'kind') gate - the per-gift cap itself can never fail at
    // amount=1, only at the returned max+.
    maxAmount(kind, balance, sentToday) {
        const caps = { gold: CONFIG.GIFT.maxGoldPerGift, gems: CONFIG.GIFT.maxGemsPerGift };
        if (!(kind in caps)) return 0;
        if (!Balance.giftAllowed(kind, 1, sentToday).ok) return 0;
        return Math.max(0, Math.min(caps[kind], Math.floor(balance || 0)));
    },

    // Social.sendGift's payload is a number (gold/gems amount) or the decor
    // itemId string - single place that decides which.
    payload(kind, amount, decorId) {
        return kind === 'decor' ? decorId : amount;
    }
};

if (typeof module !== 'undefined') {
    if (typeof CONFIG === 'undefined') globalThis.CONFIG = require('./config.js').CONFIG;
    if (typeof Balance === 'undefined') globalThis.Balance = require('./balance.js').Balance;
    module.exports = { FriendsGift };
}

// =============================================================================
// FriendsScene - three tabs, offline card, gift modal. Guarded so this file
// stays require()-able (and side-effect-free) from plain Node tests - see the
// CROSS-SCRIPT SCOPING RULE note in stagemap.js/dex.js/nestscene.js: a `class`
// declared directly inside this `if` block would be block-scoped and
// invisible to main.js's `scene: [...]` array, so the class EXPRESSION is
// assigned to the outer `let FriendsScene` binding instead.
// =============================================================================
let FriendsScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    const FR_ROW_SPACING = 210;

    FriendsScene = class FriendsScene extends Phaser.Scene {
        constructor() { super({ key: 'FriendsScene' }); }

        init() {
            this.tab = 'PLAYERS';
            this.page = 0;
            this.busy = false;      // guards double-taps during in-flight Social calls
            this._loadToken = 0;    // stale-async guard when the user flips tabs mid-fetch
            this._cache = {};
            this.giftModal = null;
        }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.bg).setDepth(0);
            this.items = [];
            this._toast = null;

            this.buildHeader();
            this.buildTabs();

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideToast(true));
            this.showTab('PLAYERS');
        }

        // -------------------------------------------------------------------
        // Header + tabs
        // -------------------------------------------------------------------
        buildHeader() {
            const W = CONFIG.WIDTH;
            this.add.rectangle(W / 2, 88, W, 176, CONFIG.COLORS.bg).setDepth(5);
            const back = this.add.text(44, 56, '‹', {
                fontFamily: CONFIG.FONT, fontSize: '48px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);
            // v6 Task 4: the 3-tab bar below (buildTabs) is left un-padded by
            // this task, so a single-sided +14 pad here only needs the
            // existing ~26px gap to exceed 14, not 2x14=28 - safe.
            padTapArea(back);
            back.on('pointerdown', () => SmooshGame.goto('MenuScene'));

            // v5.0 Task 2: 40->34 - header-title trim (pixel-font headroom).
            this.add.text(W / 2, 56, I18n.t('social.title'), {
                fontFamily: CONFIG.FONT, fontSize: '34px', color: Balance.hex(CONFIG.PASTEL.goodText)
            }).setOrigin(0.5).setDepth(10);
        }

        buildTabs() {
            const W = CONFIG.WIDTH;
            this.tabDefs = [
                { key: 'PLAYERS', label: I18n.t('social.players') },
                { key: 'FRIENDS', label: I18n.t('social.friends') },
                { key: 'INBOX', label: I18n.t('social.inbox') }
            ];
            this.tabButtons = [];
            const tw = (W - 40) / this.tabDefs.length;
            this.tabDefs.forEach((t, i) => {
                const x = 20 + i * tw + tw / 2;
                const bg = this.add.nineslice(x, 132, 'pill-tex', 0, tw - 8, 52, 16, 16, 14, 14)
                    .setTint(CONFIG.PASTEL.panel).setDepth(6).setInteractive({ useHandCursor: true });
                const label = this.add.text(x, 132, t.label, {
                    fontFamily: CONFIG.FONT, fontSize: '19px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(7);
                bg.on('pointerdown', () => { if (this.tab !== t.key) this.showTab(t.key); });
                this.tabButtons.push({ key: t.key, bg, label });
            });
        }

        // -------------------------------------------------------------------
        // Tab switching + data loading
        // -------------------------------------------------------------------
        showTab(name) {
            this.tab = name;
            this.page = 0;
            this.tabButtons.forEach(t => {
                t.bg.setTint(t.key === name ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel);
                t.label.setColor(Balance.hex(t.key === name ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
            });
            this.clearTab();
            if (!Social.ready) { this.renderOffline(); return; }
            this.loadTab(name);
        }

        // Fetches this tab's data fresh from Social and renders it. Pagination
        // within a tab does NOT call this again (see paginate()) - it re-renders
        // from this._cache so flipping pages never re-hits the network.
        async loadTab(name) {
            const token = ++this._loadToken;
            let data;
            if (name === 'PLAYERS') {
                data = await Social.listRecent(20);
            } else if (name === 'FRIENDS') {
                const [reqs, friendsList] = await Promise.all([Social.myRequests(), Social.friends()]);
                const named = await Promise.all(reqs.map(async r => {
                    const u = await Social.getUser(r.from);
                    return Object.assign({}, r, { nickname: (u && !u.offline && u.nickname) || null });
                }));
                data = { requests: named, friends: friendsList };
            } else { // INBOX
                const gifts = await Social.inbox();
                data = await Promise.all(gifts.map(async g => {
                    const u = await Social.getUser(g.from);
                    return Object.assign({}, g, { fromNickname: (u && !u.offline && u.nickname) || null });
                }));
            }
            if (token !== this._loadToken || this.tab !== name) return; // stale - user already switched tabs
            this._cache[name] = data;
            this.renderTab(name, data);
        }

        renderTab(name, data) {
            this.clearTab();
            if (name === 'PLAYERS') this.renderPlayers(data);
            else if (name === 'FRIENDS') this.renderFriends(data.requests, data.friends);
            else this.renderInbox(data);
        }

        // -------------------------------------------------------------------
        // Offline card - no spinners, no retry loops; one button re-inits Social.
        // -------------------------------------------------------------------
        renderOffline() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this._card(W / 2, H / 2, 600, 280);
            this.items.push(this.add.text(W / 2, H / 2 - 30, I18n.t('social.offline'), {
                fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                align: 'center', wordWrap: { width: 520 }
            }).setOrigin(0.5));
            this._btn(W / 2, H / 2 + 80, 240, 72, I18n.t('social.retry'), CONFIG.PASTEL.accent, async () => {
                await Social.init();
                this.showTab(this.tab);
            });
        }

        // -------------------------------------------------------------------
        // PLAYERS
        // -------------------------------------------------------------------
        renderPlayers(list) {
            const W = CONFIG.WIDTH;
            if (!list.length) {
                this.items.push(this.add.text(W / 2, 460, I18n.t('social.noPlayers'), {
                    fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                    align: 'center', wordWrap: { width: 560 }
                }).setOrigin(0.5));
                return;
            }
            this.paginate(list, 220, 4, (p, y) => this.renderPlayerRow(p, y));
        }

        renderPlayerRow(p, y) {
            const W = CONFIG.WIDTH;
            this._card(W / 2, y, 660, 170);
            // v5.0 Task 2 review fix: generated nicknames run up to ~23 chars
            // ("Sparkly Bumblebee #9999"); clamp to the space before the VISIT
            // button so they can't collide with it at 1.0em/char.
            fitToWidth(this._text(70, y - 34, p.nickname || '???', 24, Balance.hex(CONFIG.PASTEL.ink), 0), 350);
            const stage = (p.stats && p.stats.stage) || 1;
            this._text(70, y + 12, I18n.t('map.stageN', { n: stage }), 18, Balance.hex(CONFIG.PASTEL.inkSoft), 0);
            this._btn(500, y, 140, 64, I18n.t('social.visit'), CONFIG.PASTEL.accent, () => this.doVisit(p.uid));
            this._btn(635, y, 100, 64, I18n.t('social.add'), CONFIG.PASTEL.accent, () => this.doAdd(p.uid));
        }

        // -------------------------------------------------------------------
        // FRIENDS (accepted friends + incoming pending requests)
        // -------------------------------------------------------------------
        renderFriends(requests, friendsList) {
            const W = CONFIG.WIDTH;
            let y = 210;
            if (requests.length) {
                this._text(W / 2, y, I18n.t('social.requests') + ' (' + requests.length + ')', 19, Balance.hex(CONFIG.PASTEL.goldText));
                y += 42;
                // Cap rendered requests so a burst of pending requests can't
                // push the friends list (and its pagination) off-screen.
                const REQ_CAP = 3;
                const shown = requests.slice(0, REQ_CAP);
                shown.forEach(r => {
                    this._card(W / 2, y, 660, 110);
                    fitToWidth(this._text(70, y, r.nickname || '???', 21, Balance.hex(CONFIG.PASTEL.ink), 0), 350);
                    this._btn(500, y, 130, 56, I18n.t('social.accept'), CONFIG.PASTEL.accent, () => this.doRespond(r.id, true));
                    // v4.0 Phase C Task 3: decline stays visually distinct
                    // (dangerText, not the generic accent) so accept/decline
                    // never look like the same button.
                    this._btn(635, y, 100, 56, I18n.t('social.decline'), CONFIG.PASTEL.dangerText, () => this.doRespond(r.id, false));
                    y += 126;
                });
                if (requests.length > shown.length) {
                    this._text(W / 2, y, I18n.t('social.moreRequests', { n: requests.length - shown.length }), 17, Balance.hex(CONFIG.PASTEL.inkSoft));
                    y += 36;
                }
                y += 20;
            }
            if (!friendsList.length) {
                this.items.push(this.add.text(W / 2, y + 60, I18n.t('social.noFriends'), {
                    fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                    align: 'center', wordWrap: { width: 560 }
                }).setOrigin(0.5));
                return;
            }
            this.paginate(friendsList, y + 90, 3, (f, ry) => this.renderFriendRow(f, ry));
        }

        renderFriendRow(f, y) {
            const W = CONFIG.WIDTH;
            this._card(W / 2, y, 660, 170);
            fitToWidth(this._text(70, y, f.nickname || '???', 24, Balance.hex(CONFIG.PASTEL.ink), 0), 350);
            this._btn(500, y, 140, 64, I18n.t('social.visit'), CONFIG.PASTEL.accent, () => this.doVisit(f.uid));
            this._btn(635, y, 100, 64, I18n.t('social.gift'), CONFIG.PASTEL.accent, () => this.openGiftModal(f));
        }

        // -------------------------------------------------------------------
        // INBOX
        // -------------------------------------------------------------------
        renderInbox(list) {
            const W = CONFIG.WIDTH;
            if (!list.length) {
                this.items.push(this.add.text(W / 2, 460, I18n.t('social.noInbox'), {
                    fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                    align: 'center', wordWrap: { width: 560 }
                }).setOrigin(0.5));
                return;
            }
            this.paginate(list, 220, 4, (g, y) => this.renderInboxRow(g, y));
        }

        renderInboxRow(g, y) {
            const W = CONFIG.WIDTH;
            this._card(W / 2, y, 660, 170);
            fitToWidth(this._text(70, y - 30, g.fromNickname || '???', 22, Balance.hex(CONFIG.PASTEL.ink), 0), 440);
            this._text(70, y + 16, this.giftDesc(g), 19, Balance.hex(CONFIG.PASTEL.goldText), 0);
            this._btn(600, y, 150, 64, I18n.t('social.claim'), CONFIG.PASTEL.accent, () => this.doClaim(g));
        }

        giftDesc(g) {
            if (g.kind === 'gold') return Balance.fmt(g.amount) + ' 💰';
            if (g.kind === 'gems') return Balance.fmt(g.amount) + ' 💎';
            if (g.kind === 'decor') {
                const d = Decor.byId(g.itemId);
                return d ? (d.name[I18n.locale] || d.name.en) : (g.itemId || '');
            }
            return '';
        }

        // -------------------------------------------------------------------
        // Pagination (re-renders from this._cache - never re-fetches network)
        // -------------------------------------------------------------------
        paginate(list, startY, perPage, rowRenderer) {
            const W = CONFIG.WIDTH;
            const pages = Math.max(1, Math.ceil(list.length / perPage));
            this.page = Math.min(this.page, pages - 1);
            const items = list.slice(this.page * perPage, this.page * perPage + perPage);
            items.forEach((it, i) => rowRenderer(it, startY + i * FR_ROW_SPACING));
            if (pages > 1) {
                const py = startY + perPage * FR_ROW_SPACING - 60;
                this._btn(W / 2 - 180, py, 130, 56, '◀', CONFIG.PASTEL.accent, () => {
                    this.page = (this.page - 1 + pages) % pages;
                    this.renderTab(this.tab, this._cache[this.tab]);
                });
                this._text(W / 2, py, (this.page + 1) + ' / ' + pages, 22, Balance.hex(CONFIG.PASTEL.inkSoft));
                this._btn(W / 2 + 180, py, 130, 56, '▶', CONFIG.PASTEL.accent, () => {
                    this.page = (this.page + 1) % pages;
                    this.renderTab(this.tab, this._cache[this.tab]);
                });
            }
        }

        // -------------------------------------------------------------------
        // Row actions
        // -------------------------------------------------------------------
        async doVisit(uid) {
            if (this.busy) return;
            this.busy = true;
            const user = await Social.getUser(uid);
            this.busy = false;
            // getUser resolves a TRUTHY {offline:true} when Social isn't ready -
            // must check .offline, not falsiness (see fb.js contract notes).
            if (!user || user.offline) { this.toast(I18n.t('social.offline')); return; }
            this.scene.start('NestScene', {
                visit: { nickname: user.nickname, petIds: user.petIds || [], decor: user.decor || [] }
            });
        }

        async doAdd(uid) {
            if (this.busy) return;
            this.busy = true;
            const r = await Social.sendFriendReq(uid);
            this.busy = false;
            if (r && r.ok) this.toast(I18n.t('social.added'));
            else this.toast(I18n.t('social.offline'));
        }

        async doRespond(reqId, accept) {
            if (this.busy) return;
            this.busy = true;
            const r = await Social.respond(reqId, accept);
            this.busy = false;
            if (r && r.ok) this.showTab('FRIENDS');
            else this.toast(I18n.t('social.offline'));
        }

        async doClaim(gift) {
            if (this.busy) return;
            this.busy = true;
            const r = await Social.claimGift(gift.id);
            this.busy = false;
            if (!r || r.offline || !r.ok) { this.toast(I18n.t('social.offline')); return; }
            const st = SaveManager.state;
            if (r.kind === 'gold') st.gold += (r.amount || 0);
            else if (r.kind === 'gems') st.gems += (r.amount || 0);
            else if (r.kind === 'decor' && r.itemId) {
                st.decorOwned = st.decorOwned || {};
                st.decorOwned[r.itemId] = (st.decorOwned[r.itemId] || 0) + 1;
            }
            SaveManager.persist();
            Sfx.coin();
            this.toast(I18n.t('social.claimed'));
            this.showTab('INBOX');
        }

        // -------------------------------------------------------------------
        // Gift modal - kind picker (gold/gems/decor) + amount stepper/decor
        // picker, clamped by FriendsGift.maxAmount (Balance.giftAllowed +
        // current balance) and CONFIG.GIFT.dailySendLimit.
        // -------------------------------------------------------------------
        sentToday() {
            const st = SaveManager.state;
            const key = 'sent_' + Social._todayKey(new Date());
            return (st.social && st.social[key]) || 0;
        }

        openGiftModal(target) {
            if (this.giftModal) return;
            // makeUiButton hardcodes depth 21-23 for EVERY button it makes (see
            // ui.js) - the FRIENDS tab's row buttons underneath (VISIT/GIFT/...)
            // sit at that same fixed tier as this modal's own SEND/close/stepper
            // buttons, so there is no depth value that both covers the row
            // buttons AND lets this modal's own buttons render above its own
            // backdrop. Clearing the tab (restored in closeGiftModal) removes
            // that conflict entirely - ShopScene's playReveal() overlay never
            // hits this because it has no makeUiButton children of its own.
            this.clearTab();
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            const top = H / 2 - 360, panelH = 720;
            const parts = [];

            // modal dim-scrim - same near-black exception as ui.js's showSettlement.
            const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.88).setDepth(15).setInteractive();
            parts.push(dim);
            parts.push(this.add.nineslice(W / 2, H / 2, 'btn-tex', 0, W - 70, panelH, 28, 28, 28, 28)
                .setTint(CONFIG.PASTEL.panel).setDepth(16));
            parts.push(this.add.text(W / 2, top + 55, I18n.t('social.giftTitle', { name: target.nickname || '???' }), {
                fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.goodText),
                align: 'center', wordWrap: { width: W - 140 }
            }).setOrigin(0.5).setDepth(17));

            // v6 Task 4 review fix (found via full audit, not in the original
            // overlap list): this closeBtn (top+640, h=68) sits directly under
            // sendBtn (top+560, h=76, built in renderGiftBody() below) with
            // only an 8px raw edge gap - the default +14/+14 pad turns that
            // into a 20px overlap (a tap meant for SEND can land on the X and
            // vice versa). pad:2 on both leaves a 4px margin - the tightest
            // pair in the whole audit, but any pad greater than ~2.5px each
            // re-overlaps given the raw 8px gap.
            const closeBtn = makeUiButton(this, W / 2, top + 640, 200, 68, '✕', CONFIG.PASTEL.accent, () => this.closeGiftModal(), undefined, { pad: 2 });

            this.giftModal = {
                parts, closeBtn, target, top, panelH,
                kind: 'gold', amount: 0, max: 0, decorId: null, decorPage: 0,
                kindTabs: [], bodyParts: []
            };

            this.buildGiftKindTabs();
            this.setGiftKind('gold');
        }

        closeGiftModal() {
            const gm = this.giftModal;
            if (!gm) return;
            gm.parts.forEach(p => p.destroy());
            gm.closeBtn.destroyAll();
            gm.kindTabs.forEach(t => { t.bg.destroy(); t.label.destroy(); });
            gm.bodyParts.forEach(p => (p.destroyAll ? p.destroyAll() : p.destroy()));
            this.giftModal = null;
            // Restore the FRIENDS tab the modal cleared on open (from cache -
            // no network refetch just to redraw rows that haven't changed).
            this.renderTab(this.tab, this._cache[this.tab]);
        }

        buildGiftKindTabs() {
            const gm = this.giftModal, W = CONFIG.WIDTH;
            const kinds = [
                { key: 'gold', label: I18n.t('social.giftGold') },
                { key: 'gems', label: I18n.t('social.giftGems') },
                { key: 'decor', label: I18n.t('social.giftDecor') }
            ];
            const tw = 180, y = gm.top + 120;
            kinds.forEach((k, i) => {
                const x = W / 2 + (i - 1) * (tw + 10);
                const bg = this.add.nineslice(x, y, 'pill-tex', 0, tw, 52, 16, 16, 14, 14)
                    .setTint(CONFIG.PASTEL.panel).setDepth(17).setInteractive({ useHandCursor: true });
                const label = this.add.text(x, y, k.label, {
                    fontFamily: CONFIG.FONT, fontSize: '19px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(18);
                bg.on('pointerdown', () => this.setGiftKind(k.key));
                gm.kindTabs.push({ key: k.key, bg, label });
            });
        }

        setGiftKind(kind) {
            const gm = this.giftModal;
            gm.kind = kind;
            gm.decorId = null;
            gm.decorPage = 0;
            gm.kindTabs.forEach(t => {
                t.bg.setTint(t.key === kind ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel);
                t.label.setColor(Balance.hex(t.key === kind ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
            });
            if (kind !== 'decor') {
                const st = SaveManager.state;
                const balance = kind === 'gold' ? st.gold : st.gems;
                gm.max = FriendsGift.maxAmount(kind, balance, this.sentToday());
                gm.amount = gm.max > 0 ? Math.max(1, Math.min(gm.max, Math.round(gm.max * 0.1))) : 0;
            }
            this.renderGiftBody();
        }

        giftReady() {
            const gm = this.giftModal;
            if (!gm) return false;
            return gm.kind === 'decor' ? !!gm.decorId : gm.amount > 0;
        }

        clearGiftBody() {
            if (!this.giftModal) return;
            this.giftModal.bodyParts.forEach(p => (p.destroyAll ? p.destroyAll() : p.destroy()));
            this.giftModal.bodyParts = [];
        }

        renderGiftBody() {
            this.clearGiftBody();
            const gm = this.giftModal, W = CONFIG.WIDTH;
            const parts = gm.bodyParts;
            const sent = this.sentToday();

            parts.push(this.add.text(W / 2, gm.top + 170, I18n.t('social.giftDaily',
                { sent, max: CONFIG.GIFT.dailySendLimit }), {
                fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(17));

            if (sent >= CONFIG.GIFT.dailySendLimit) {
                parts.push(this.add.text(W / 2, gm.top + 320, I18n.t('social.giftCapReached'), {
                    fontFamily: CONFIG.FONT, fontSize: '22px', color: Balance.hex(CONFIG.PASTEL.dangerText),
                    align: 'center', wordWrap: { width: W - 160 }
                }).setOrigin(0.5).setDepth(17));
                return; // daily gate closed - no stepper/picker/send button
            }

            if (gm.kind === 'decor') this.renderDecorPicker(gm.top + 230, parts);
            else this.renderAmountStepper(gm.top + 230, parts);

            // v6 Task 4 review fix: pad:2 - see closeBtn's comment in
            // showGiftModal() above (8px raw gap to that button, needs both
            // sides trimmed to near-zero pad to stay non-overlapping).
            const sendBtn = makeUiButton(this, W / 2, gm.top + 560, 260, 76,
                I18n.t('social.giftSend'), CONFIG.PASTEL.accent, () => this.sendGiftFlow(), undefined, { pad: 2 });
            if (!this.giftReady()) sendBtn.disable();
            parts.push(sendBtn);
        }

        renderAmountStepper(y, parts) {
            const gm = this.giftModal, W = CONFIG.WIDTH;
            const icon = gm.kind === 'gold' ? 'coin-tex' : 'gem-tex';
            parts.push(this.add.image(W / 2 - 90, y, icon).setDisplaySize(30, 30).setDepth(17));
            parts.push(this.add.text(W / 2, y, gm.max > 0 ? Balance.fmt(gm.amount) : '—', {
                fontFamily: CONFIG.FONT, fontSize: '40px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5).setDepth(17));

            const step = gm.kind === 'gold' ? Math.max(1, Math.round(gm.max * 0.1)) : 1;
            const minus = makeUiButton(this, W / 2 - 200, y, 90, 76, '−', CONFIG.PASTEL.accent, () => {
                gm.amount = Math.max(1, gm.amount - step);
                this.renderGiftBody();
            });
            const plus = makeUiButton(this, W / 2 + 200, y, 90, 76, '+', CONFIG.PASTEL.accent, () => {
                gm.amount = Math.min(gm.max, gm.amount + step);
                this.renderGiftBody();
            });
            if (gm.max <= 0) { minus.disable(); plus.disable(); }
            parts.push(minus, plus);

            if (gm.max <= 0) {
                parts.push(this.add.text(W / 2, y + 70, I18n.t('social.giftInsufficient'), {
                    fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.dangerText)
                }).setOrigin(0.5).setDepth(17));
            }
        }

        renderDecorPicker(y, parts) {
            const gm = this.giftModal, W = CONFIG.WIDTH;
            const st = SaveManager.state;
            const owned = DECOR_ITEMS.filter(d => (st.decorOwned[d.id] || 0) > 0);
            if (!owned.length) {
                parts.push(this.add.text(W / 2, y + 40, I18n.t('social.giftNoDecor'), {
                    fontFamily: CONFIG.FONT, fontSize: '20px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                    align: 'center', wordWrap: { width: W - 160 }
                }).setOrigin(0.5).setDepth(17));
                return;
            }
            const cols = 4, cellW = 130, cellH = 130, perPage = 8;
            const startX = W / 2 - (cols - 1) * cellW / 2;
            const pages = Math.ceil(owned.length / perPage);
            gm.decorPage = Math.min(gm.decorPage, pages - 1);
            const pageItems = owned.slice(gm.decorPage * perPage, gm.decorPage * perPage + perPage);

            pageItems.forEach((def, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const x = startX + col * cellW, yy = y + row * cellH;
                const bg = this.add.nineslice(x, yy, 'btn-tex', 0, cellW - 14, cellH - 14, 16, 16, 16, 16)
                    .setTint(gm.decorId === def.id ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel).setDepth(17)
                    .setInteractive({ useHandCursor: true });
                const icon = this.add.image(x, yy - 14, 'decor-' + def.id).setDisplaySize(56, 56).setDepth(18);
                const label = this.add.text(x, yy + 42, def.name[I18n.locale] || def.name.en, {
                    fontFamily: CONFIG.FONT, fontSize: '13px', color: Balance.hex(CONFIG.PASTEL.ink)
                }).setOrigin(0.5).setDepth(18);
                // v5.0 Task 2 review fix: decor name in a 130px gift cell.
                fitToWidth(label, cellW - 16);
                bg.on('pointerdown', () => {
                    gm.decorId = gm.decorId === def.id ? null : def.id;
                    this.renderGiftBody();
                });
                parts.push(bg, icon, label);
            });

            if (pages > 1) {
                const py = y + 240;
                parts.push(makeUiButton(this, W / 2 - 140, py, 90, 48, '◀', CONFIG.PASTEL.accent, () => {
                    gm.decorPage = (gm.decorPage - 1 + pages) % pages;
                    this.renderGiftBody();
                }));
                parts.push(this.add.text(W / 2, py, (gm.decorPage + 1) + ' / ' + pages, {
                    fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(17));
                parts.push(makeUiButton(this, W / 2 + 140, py, 90, 48, '▶', CONFIG.PASTEL.accent, () => {
                    gm.decorPage = (gm.decorPage + 1) % pages;
                    this.renderGiftBody();
                }));
            }
        }

        async sendGiftFlow() {
            const gm = this.giftModal;
            if (!gm || this.busy || !this.giftReady()) return;
            this.busy = true;
            const payload = FriendsGift.payload(gm.kind, gm.amount, gm.decorId);
            const r = gm.kind === 'decor'
                ? await this.sendDecorGift(gm.target.uid, payload)
                : await Social.sendGift(gm.target.uid, gm.kind, payload);
            this.busy = false;

            if (r && r.ok) {
                Sfx.coin();
                this.toast(I18n.t('social.sent'));
                this.closeGiftModal();
                this.showTab('FRIENDS');
            } else {
                this.toast(this.giftFailMessage(r));
            }
        }

        // fb.js's sendGift() money-safety order (validate -> deduct local ->
        // write -> refund on write failure) ONLY covers gold/gems - its own
        // comment says decor "no local currency cost model yet - the item
        // itself is the cost", so it never touches decorOwned. Mirror that
        // exact order here in the scene for decor: deduct my copy first,
        // write the gift doc, and refund if the write (or the pre-check)
        // fails - so a decor gift can never silently vanish from my nest.
        async sendDecorGift(toUid, itemId) {
            const st = SaveManager.state;
            if ((st.decorOwned[itemId] || 0) < 1) return { ok: false, reason: 'balance' };
            const check = Balance.giftAllowed('decor', 1, this.sentToday());
            if (!check.ok) return check;

            st.decorOwned[itemId] -= 1;
            SaveManager.persist();

            const r = await Social.sendGift(toUid, 'decor', itemId);
            if (!r.ok) {
                st.decorOwned[itemId] += 1;
                SaveManager.persist();
            }
            return r;
        }

        giftFailMessage(r) {
            const reason = r && r.reason;
            if (reason === 'daily') return I18n.t('social.giftCapReached');
            if (reason === 'balance' || reason === 'cap') return I18n.t('social.giftInsufficient');
            return I18n.t('social.offline');
        }

        // -------------------------------------------------------------------
        // Small drawing helpers (same pattern as shop.js's _text/_card/_btn)
        // -------------------------------------------------------------------
        _text(x, y, str, size, color, origin) {
            const t = this.add.text(x, y, str, {
                fontFamily: CONFIG.FONT, fontSize: size + 'px', color: color || Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(origin !== undefined ? origin : 0.5);
            this.items.push(t);
            return t;
        }

        _card(x, y, w, h) {
            const c = this.add.nineslice(x, y, 'btn-tex', 0, w, h, 24, 24, 24, 24).setTint(CONFIG.PASTEL.panel);
            this.items.push(c);
            return c;
        }

        _btn(x, y, w, h, label, color, cb) {
            const b = makeUiButton(this, x, y, w, h, label, color, cb);
            this.items.push(b);
            return b;
        }

        clearTab() {
            this.items.forEach(o => (o.destroyAll ? o.destroyAll() : o.destroy()));
            this.items = [];
        }

        // -------------------------------------------------------------------
        // Toast
        // -------------------------------------------------------------------
        toast(msg) {
            if (this._toast) this._toast.destroy();
            // v4.0 Phase C Task 3 / v5.0 carry-over fix: toast chip stays a
            // dark pill with white text regardless of theme - same "always-
            // dark floating chip" exception as makeUiButton's drop shadow /
            // modal scrims. v5.0 flipped `ink` to bright near-white, so the
            // pill fill moved to `panel` (still a dark surface) to keep the
            // white text readable - see tests/pastel.test.js.
            this._toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 140, msg, {
                fontFamily: CONFIG.FONT, fontSize: '26px', color: Balance.hex(CONFIG.PASTEL.white), backgroundColor: Balance.hex(CONFIG.PASTEL.panel), padding: { x: 18, y: 10 }
            }).setOrigin(0.5).setDepth(60);
            this.tweens.add({
                targets: this._toast, alpha: 0, delay: 1400, duration: 300,
                onComplete: () => this.hideToast(false)
            });
        }

        hideToast(killTween) {
            if (killTween && this._toast) this.tweens.killTweensOf(this._toast);
            if (this._toast) { this._toast.destroy(); this._toast = null; }
        }
    };
}
