// =============================================================================
// SMOOSH! - i18n.js
// Two-locale string table (en/ko). v5.0 RETRO ARCADE: the game is now
// forced English-only regardless of device language (arcade-cabinet
// presentation) - detect() always resolves to 'en'. _localeFrom is kept
// (used by tests/i18n.test.js and available for a future opt-in toggle);
// STRINGS keeps both en/ko entries so the ko fallback path still works.
// =============================================================================

const I18n = {
    locale: 'en',

    _localeFrom(tag) {
        return (typeof tag === 'string' && tag.toLowerCase().startsWith('ko'))
            ? 'ko' : 'en';
    },

    detect() {
        // v5.0: forced English - device language no longer consulted.
        this.locale = 'en';
        return this.locale;
    },

    t(key, vars) {
        const entry = this.STRINGS[key];
        let s = entry ? (entry[this.locale] || entry.en) : key;
        if (vars) for (const k of Object.keys(vars)) {
            s = s.split('{' + k + '}').join(String(vars[k]));
        }
        return s;
    },

    // Every entry MUST have both en and ko (tests/i18n.test.js enforces).
    STRINGS: {
        'map.title':        { en: 'STAGE MAP',        ko: '스테이지 맵' },
        'map.navButton':    { en: 'MAP',               ko: '맵' },
        'map.replay':       { en: 'REPLAY',            ko: '재도전' },
        'map.stageN':       { en: 'STAGE {n}',          ko: '스테이지 {n}' },
        'map.replayReward': { en: 'Replay: 30% gold, full drops', ko: '재도전: 골드 30%, 드롭 100%' },
        'dex.title':        { en: 'DEX',               ko: '도감' },
        'dex.monsters':     { en: 'MONSTERS',          ko: '몬스터' },
        'dex.pets':         { en: 'PETS',              ko: '펫' },
        'dex.locked':       { en: '???',               ko: '???' },
        'dex.kills':        { en: 'Kills: {n}',        ko: '처치: {n}' },
        'dex.skill':        { en: 'Skill',             ko: '스킬' },
        'shop.adsRemoved':  { en: 'Ads removed ✓',     ko: '광고 제거됨 ✓' },
        'shop.storeSoon':   { en: 'Store opens after release!', ko: '스토어 연결은 출시 후에 열려요!' },
        // v7 T2: no separate remove-ads product anymore - ANY gem purchase
        // removes ads forever. Indicator line shown before the first
        // purchase, uppercase arcade-style badge shown once adsRemoved.
        'shop.anyGemRemovesAds': { en: '💎 Any gem purchase removes all ads — forever', ko: '💎 젬을 구매하면 모든 광고가 영구히 사라져요' },
        'shop.adsRemovedBadge':  { en: '✓ ADS REMOVED', ko: '✓ 광고 제거 완료' },
        // v5 final-review fix: shop.js toasts were hardcoded Korean, violating
        // the forced-English rule (CLAUDE.md). Locale is forced 'en' so only
        // the en value shows in-game; ko kept for completeness/consistency
        // with every other STRINGS entry.
        'shop.needGold':    { en: 'NOT ENOUGH GOLD',   ko: '골드가 부족해요!' },
        'shop.needGems':    { en: 'NOT ENOUGH GEMS',   ko: '젬이 부족해요!' },
        'shop.needShards':  { en: 'NOT ENOUGH SHARDS', ko: '조각이 부족해요!' },
        // v5.0 RETRO ARCADE Task 4: legendary pets are gem-egg only - short
        // tier badges on the EGGS tab (kept terse, pixel font is wide).
        'shop.eggGoldTier': { en: 'UP TO EPIC',        ko: '최대 에픽' },
        'shop.eggGemTier':  { en: '★ LEGENDARY CHANCE', ko: '★ 레전더리 확률' },
        'ult.ready':        { en: 'ULT READY!',        ko: '궁극기 준비!' },
        'drop.despawned':   { en: 'Lost...',           ko: '놓쳤다...' },
        'pvp.pickTeam':     { en: 'PICK YOUR TEAM (max 5)', ko: '팀 선택 (최대 5마리)' },
        'pvp.auto':         { en: 'AUTO',              ko: '자동' },
        'pvp.fight':        { en: 'FIGHT!',            ko: '싸우자!' },
        'battle.ko':        { en: 'KO!',               ko: 'KO!' },
        'battle.down':      { en: 'DOWN...',           ko: '다운...' },
        // v3.5 Task 3: decor catalog + shop tab
        'decor.title':      { en: 'DECOR',             ko: '데코' },
        'decor.owned':      { en: 'Owned {n}',         ko: '보유 {n}개' },
        'decor.dropped':    { en: 'Found {name}!',     ko: '{name} 획득!' },
        'decor.cat.floor':      { en: 'FLOOR',      ko: '바닥' },
        'decor.cat.background': { en: 'BACKGROUND', ko: '배경' },
        'decor.cat.furniture':  { en: 'FURNITURE',  ko: '가구' },
        'decor.cat.toy':         { en: 'TOY',        ko: '장난감' },
        'decor.cat.special':     { en: 'SPECIAL',    ko: '스페셜' },
        'decor.needGems':   { en: 'Not enough gems!', ko: '젬이 부족해요!' },
        'decor.needGold':   { en: 'Not enough gold!', ko: '골드가 부족해요!' },
        // v3.5 Task 4: NestScene - the living nest (idle AI, touch, edit mode)
        'nest.title':       { en: 'NEST',           ko: '둥지' },
        'nest.edit':        { en: 'EDIT',           ko: '편집' },
        'nest.save':        { en: 'SAVE',           ko: '저장' },
        'nest.saved':       { en: 'Nest saved!',    ko: '둥지가 저장됐어요!' },
        'nest.tray':        { en: 'YOUR DECOR',     ko: '내 데코' },
        'nest.trayEmpty':   { en: 'No decor yet — buy some in the shop!', ko: '아직 데코가 없어요 — 상점에서 구매해보세요!' },
        'nest.visiting':    { en: "Visiting {name}'s nest", ko: '{name}의 둥지 방문 중' },
        // v3.5 Task 5: FriendsScene - players list, friend requests, gift inbox
        'social.title':     { en: 'FRIENDS',        ko: '친구' },
        'social.players':   { en: 'PLAYERS',        ko: '플레이어' },
        'social.friends':   { en: 'FRIENDS',        ko: '친구' },
        'social.inbox':     { en: 'INBOX',          ko: '보관함' },
        'social.offline':   { en: 'Offline — sign in to see other players!', ko: '오프라인 — 다른 플레이어를 보려면 연결이 필요해요!' },
        'social.retry':     { en: 'RETRY',          ko: '재시도' },
        'social.visit':     { en: 'VISIT',          ko: '방문' },
        'social.add':       { en: 'ADD',            ko: '추가' },
        'social.added':     { en: 'Friend request sent!', ko: '친구 요청을 보냈어요!' },
        'social.gift':      { en: 'GIFT',           ko: '선물' },
        'social.claim':     { en: 'CLAIM',          ko: '수령' },
        'social.claimed':   { en: 'Claimed!',       ko: '수령 완료!' },
        'social.accept':    { en: 'ACCEPT',         ko: '수락' },
        'social.decline':   { en: 'DECLINE',        ko: '거절' },
        'social.sent':      { en: 'Gift sent!',     ko: '선물을 보냈어요!' },
        'social.requests':  { en: 'FRIEND REQUESTS', ko: '친구 요청' },
        'social.moreRequests': { en: '+{n} more requests', ko: '+{n}개 요청 더 있음' },
        'social.noPlayers': { en: 'No other players yet — check back soon!', ko: '아직 다른 플레이어가 없어요 — 곧 만나요!' },
        'social.noFriends': { en: 'No friends yet — add some players!', ko: '아직 친구가 없어요 — 플레이어를 추가해보세요!' },
        'social.noInbox':   { en: 'No gifts yet!',  ko: '아직 선물이 없어요!' },
        'social.giftTitle': { en: 'SEND GIFT to {name}', ko: '{name}님에게 선물 보내기' },
        'social.giftGold':  { en: 'GOLD',           ko: '골드' },
        'social.giftGems':  { en: 'GEMS',           ko: '젬' },
        'social.giftDecor': { en: 'DECOR',          ko: '데코' },
        'social.giftSend':  { en: 'SEND',           ko: '보내기' },
        'social.giftDaily': { en: 'Sent today: {sent}/{max}', ko: '오늘 보낸 선물: {sent}/{max}' },
        'social.giftNoDecor': { en: "You don't own any decor to gift!", ko: '선물할 데코가 없어요!' },
        'social.giftCapReached': { en: 'Daily gift limit reached!', ko: '오늘의 선물 한도를 다 썼어요!' },
        'social.giftInsufficient': { en: 'Not enough to gift!', ko: '선물할 만큼 충분하지 않아요!' },
        // v7 T12: INFINITE mode
        'infinite.navButton':      { en: '♾ INFINITE',              ko: '♾ 무한모드' },
        'infinite.newBest':        { en: 'NEW PERSONAL BEST!',       ko: '개인 최고 기록!' },
        'infinite.dailyCapReached':{ en: 'DAILY REWARD CAP REACHED', ko: '오늘의 보상 한도 도달' },
        'infinite.checkingRank':   { en: 'checking global rank...',  ko: '글로벌 순위 확인 중...' },
        'infinite.globalRank':     { en: 'GLOBAL RANK #{rank}',      ko: '글로벌 순위 #{rank}' },
        'infinite.playAgain':      { en: 'PLAY AGAIN',               ko: '다시 하기' },
        'common.menu':             { en: 'MENU',                     ko: '메뉴' }
    }
};

if (typeof module !== 'undefined') module.exports = { I18n };
