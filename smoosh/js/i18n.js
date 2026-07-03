// =============================================================================
// SMOOSH! - i18n.js
// Two-locale string table (en/ko). Locale follows the DEVICE language:
// Korean devices get Korean, everyone else gets English (spec §A9).
// =============================================================================

const I18n = {
    locale: 'en',

    _localeFrom(tag) {
        return (typeof tag === 'string' && tag.toLowerCase().startsWith('ko'))
            ? 'ko' : 'en';
    },

    detect() {
        const tag = (typeof navigator !== 'undefined' && navigator.language) || 'en';
        this.locale = this._localeFrom(tag);
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
        'shop.removeAds':   { en: 'Remove Ads',        ko: '광고 제거' },
        'shop.removeAdsLabel': { en: '🚫 Ads',         ko: '🚫 광고' },
        'shop.adsRemoved':  { en: 'Ads removed ✓',     ko: '광고 제거됨 ✓' },
        'shop.storeSoon':   { en: 'Store opens after release!', ko: '스토어 연결은 출시 후에 열려요!' },
        'ult.ready':        { en: 'ULT READY!',        ko: '궁극기 준비!' },
        'drop.despawned':   { en: 'Lost...',           ko: '놓쳤다...' },
        'pvp.pickTeam':     { en: 'PICK YOUR TEAM (max 5)', ko: '팀 선택 (최대 5마리)' },
        'pvp.auto':         { en: 'AUTO',              ko: '자동' },
        'pvp.fight':        { en: 'FIGHT!',            ko: '싸우자!' },
        'battle.ko':        { en: 'KO!',               ko: 'KO!' },
        'battle.down':      { en: 'DOWN...',           ko: '다운...' }
    }
};

if (typeof module !== 'undefined') module.exports = { I18n };
