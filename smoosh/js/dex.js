// =============================================================================
// SMOOSH! - dex.js
// v3.0 Task 11: Monster + Pet Dex - bilingual lore, unlock tracking, detail
// cards. Pure half (Dex.LORE + unlock predicates) is plain data/functions so
// tests/dex.test.js can run in Node without Phaser or any other module.
// Scene half (DexScene) follows the stagemap.js CROSS-SCRIPT SCOPING RULE:
// a `class ... extends Phaser.Scene` declared directly inside the `if` block
// below would be block-scoped to that block and invisible to main.js's
// `scene: [...]` array - the class EXPRESSION is assigned to the outer
// `let DexScene` binding instead so it stays a normal script-global.
// =============================================================================

const Dex = {

    // Every monster id (SPECIES) and pet id (PET_SPECIES) MUST have an entry
    // here - tests/dex.test.js enforces coverage + a length floor/ceiling so
    // every card has real, hand-written personality (not a placeholder).
    LORE: {
        // --- monsters (24) ---
        blob: {
            en: 'The original jelly. Zero ambitions, maximum bounce. Dreams of being left alone.',
            ko: '원조 젤리. 야망 제로, 통통함 최대. 꿈은 그냥 가만히 있는 것.'
        },
        mini: {
            en: 'Half the size, twice the sass. Zigzags just to watch you miss.',
            ko: '몸집은 절반, 시건방짐은 두 배. 약 올리려고 지그재그로 튄다.'
        },
        tank: {
            en: 'A slow blue wall of spite. Puts up a shield first, questions never.',
            ko: '느릿느릿 움직이는 심술 방벽. 묻지도 따지지도 않고 방어막부터 올린다.'
        },
        zippy: {
            en: 'Yellow lightning in jelly form. Chains a shock to your whole squad for fun.',
            ko: '젤리 모습을 한 노란 번개. 재미로 팀 전체에 감전을 퍼뜨린다.'
        },
        scaredy: {
            en: 'Trembles, flees, and drops extra gold out of pure panic. Never picks a fight.',
            ko: '덜덜 떨며 도망치다 겁에 질려 골드를 더 흘린다. 싸움은 절대 안 건다.'
        },
        pudding: {
            en: 'Warm, wobbly, and weirdly proud of it. Taunts you to smack its jiggly self first.',
            ko: '따뜻하고 물컹하지만 은근히 자신만만. 먼저 때리라고 도발한다.'
        },
        drop: {
            en: 'A teardrop with an attitude. Sprays first, shoves you back for the encore.',
            ko: '성깔 있는 물방울. 먼저 물총을 쏘고 앙코르로 밀쳐낸다.'
        },
        blinky: {
            en: 'Naps mid-battle, then zaps you awake with a static jolt. Rude but effective.',
            ko: '싸우다 말고 낮잠을 자다가 정전기로 화들짝 깨운다. 무례하지만 효과는 확실.'
        },
        twins: {
            en: 'Never shows up alone - if you blink, there are suddenly two of them again.',
            ko: '혼자 오는 법이 없다. 눈 깜빡이면 또 하나 늘어나 있다.'
        },
        grumpy: {
            en: 'Perpetually furious, permanently on fire. Charges first, apologizes never.',
            ko: '항상 화가 나 있고 항상 불타고 있다. 먼저 돌진하고 절대 사과하지 않는다.'
        },
        ghosty: {
            en: 'Half-transparent and fully spooky. Slips into stealth right before the zap lands.',
            ko: '반투명한 몸에 오싹한 기운. 감전 공격 직전에 은신 속으로 사라진다.'
        },
        hoppy: {
            en: 'Bounces everywhere on borrowed rabbit ears. Somehow slows you down mid-hop.',
            ko: '빌려온 토끼 귀로 사방을 튀어 다닌다. 뛰는 와중에도 상대를 느리게 만든다.'
        },
        orbity: {
            en: 'Circles the battlefield wearing its own halo, buffing every ally it passes.',
            ko: '전장을 자기만의 후광을 두르고 맴돌며, 지나치는 아군마다 버프를 걸어준다.'
        },
        lovey: {
            en: 'Chases you with heart-eyes and heals its friends between hugs. Weaponized affection.',
            ko: '하트 눈으로 쫓아오다 틈틈이 친구를 치유한다. 애정도 무기가 된다.'
        },
        rocky: {
            en: 'A pinball with a grudge. Ricochets at absurd speed, then slams the ground for spite.',
            ko: '원한을 품은 핀볼. 말도 안 되는 속도로 튕기다 홧김에 바닥을 내려친다.'
        },
        bubbly: {
            en: 'Floats along in a cheerful bubble and spits poison without losing the smile.',
            ko: '즐겁게 거품을 두른 채 떠다니며 웃는 얼굴로 독을 뱉는다.'
        },
        shysh: {
            en: 'Too shy to fight, so it heals its friends from behind a leaf and hopes nobody notices.',
            ko: '너무 수줍어서 싸우지 못하고 나뭇잎 뒤에서 몰래 친구를 치유한다.'
        },
        cloney: {
            en: 'Winks, blinks out, and reappears as two. A shocking magic trick it never tires of.',
            ko: '윙크하고 순간 사라졌다 둘이 되어 나타난다. 질리지도 않는 전기 마술.'
        },
        freezy: {
            en: 'Cold, sleepy, and coated in frost shards. Freezes you before it even wakes up fully.',
            ko: '차갑고 졸린 데다 서리 조각까지 둘렀다. 다 깨기도 전에 얼려버린다.'
        },
        chunky: {
            en: 'The heaviest jelly in the yard. Slow to arrive, impossible to ignore once it slams.',
            ko: '마당에서 가장 육중한 젤리. 느리게 오지만 내려치면 무시할 수 없다.'
        },
        splitter: {
            en: 'Splits a Mini off itself on a whim - half the jelly, all of the mischief.',
            ko: '마음 내키면 미니를 갈라 만든다. 젤리는 절반이지만 장난기는 그대로.'
        },
        shieldy: {
            en: 'Wears its own shell like armor and throws up a shield before anyone lands a hit.',
            ko: '자기 껍질을 갑옷처럼 두르고, 맞기도 전에 방어막부터 세운다.'
        },
        goldie: {
            en: 'A greedy blur of gold that flees on sight. Catch it fast - it will not stick around.',
            ko: '탐욕스러운 황금빛 잔상, 보자마자 도망친다. 빨리 못 잡으면 사라진다.'
        },
        king: {
            en: 'The King Jelly rules the nest\'s nightmares - summons minions, slams like an earthquake.',
            ko: '둥지의 악몽을 지배하는 젤리 왕. 부하를 소환하고 지진처럼 내리친다.'
        },

        // --- pets (50) ---
        cat: {
            en: 'A fire-hearted cat that dashes in, swats twice, and struts off like nothing happened.',
            ko: '불같은 성격의 고양이. 돌진해서 두 번 할퀴고 아무 일 없었다는 듯 걸어간다.'
        },
        dog: {
            en: 'Loyal, loud, and always barking "pick me!" - taunts every enemy onto itself.',
            ko: '충직하고 시끄러운 강아지. 항상 자기를 공격하라고 짖어 도발한다.'
        },
        rabbit: {
            en: 'A frosty little healer that hops between allies, patching wounds with a cold nuzzle.',
            ko: '서늘한 꼬마 힐러. 아군 사이를 폴짝거리며 차가운 코로 상처를 어루만진다.'
        },
        bear: {
            en: 'A big, chilly bear that slams the ground with all the subtlety of an avalanche.',
            ko: '덩치 크고 서늘한 곰. 눈사태처럼 우악스럽게 바닥을 내리친다.'
        },
        panda: {
            en: 'Rolls up in bamboo leaves and shields the squad, too lazy to actually dodge anything.',
            ko: '대나무 잎을 두르고 팀을 보호막으로 감싼다. 피하기 귀찮아서 막는 쪽을 택했다.'
        },
        fox: {
            en: 'A sly fire fox that vanishes mid-fight, then reappears exactly where it is least wanted.',
            ko: '교활한 불여우. 싸우다 슬쩍 사라졌다가 가장 곤란한 순간에 다시 나타난다.'
        },
        pig: {
            en: 'An enthusiastic little pig that bites hard and slurps back the health it dishes out.',
            ko: '열정 넘치는 돼지. 세게 물고 그만큼 체력을 쪽쪽 빨아들인다.'
        },
        frog: {
            en: 'Croaks once, licks its lips, and leaves a toxic little souvenir on every target.',
            ko: '한 번 개굴 울고 입맛을 다신 뒤 모든 대상에게 독이라는 작은 선물을 남긴다.'
        },
        chick: {
            en: 'A fluffy little light-side chick that chirps encouragement and heals the weakest ally.',
            ko: '포근한 빛의 병아리. 응원하며 지저귀다 가장 약한 아군을 치유한다.'
        },
        penguin: {
            en: 'Waddles into battle in a tuxedo it never asked for, then freezes foes solid.',
            ko: '원치도 않은 턱시도 차림으로 뒤뚱뒤뚱 나서서 상대를 꽁꽁 얼려버린다.'
        },
        koala: {
            en: 'Clings to a leaf and barely moves - which somehow slows everyone else down too.',
            ko: '나뭇잎에 매달려 거의 움직이지 않는데, 어쩐지 주변 모두를 느리게 만든다.'
        },
        tiger: {
            en: 'Stripes of fire, zero patience. Dashes in before you have even noticed it moved.',
            ko: '불꽃 무늬에 인내심은 제로. 움직였는지도 모르게 돌진해 온다.'
        },
        lion: {
            en: 'A maned show-off that roars a challenge and taunts the whole field its way.',
            ko: '갈기 자랑하는 허세왕. 포효하며 전장 전체를 도발한다.'
        },
        mouse: {
            en: 'Tiny, twitchy, and secretly wired - its shock chains from one foe to the next.',
            ko: '작고 신경질적이지만 은근히 전기가 흐른다. 충격이 상대에서 상대로 이어진다.'
        },
        hamster: {
            en: 'Stuffs its cheeks with static electricity and lets a chain shock loose on command.',
            ko: '볼주머니에 정전기를 가득 채워 뒀다가 신호에 맞춰 연쇄 충격을 터뜨린다.'
        },
        duck: {
            en: 'Paddles along on a gust of wind, somehow making the whole squad\'s gold pile up faster.',
            ko: '바람을 타고 헤엄치듯 다니며 어쩐지 팀 전체의 골드가 더 잘 쌓이게 만든다.'
        },
        owl: {
            en: 'Silent wings, judgmental stare, one perfectly timed hoot that stuns everything nearby.',
            ko: '소리 없는 날갯짓과 못마땅한 눈빛, 완벽한 타이밍의 부엉 소리로 주변을 기절시킨다.'
        },
        wolf: {
            en: 'Howls from the shadows and dares every enemy on the field to come at it first.',
            ko: '어둠 속에서 울부짖으며 모든 적에게 먼저 덤비라고 도발한다.'
        },
        deer: {
            en: 'Antlers full of leaves, a gentle nature to match - quietly heals whoever hurts most.',
            ko: '뿔에 잎이 무성한 만큼 성품도 온화하다. 가장 다친 아군을 조용히 치유한다.'
        },
        sheep: {
            en: 'Fluffy, glowing, and inexplicably good at making everyone\'s gold gain go up.',
            ko: '복슬복슬 빛나는 양. 이유는 몰라도 팀의 골드 획득을 늘려준다.'
        },
        cow: {
            en: 'Placid until it is not - the more it gets hurt, the faster it starts swinging.',
            ko: '평소엔 순하지만 다치면 다칠수록 공격 속도가 빨라진다.'
        },
        monkey: {
            en: 'Screeches, flings something, and gets madder with every hit. Never backs down.',
            ko: '꺅꺅 소리 지르며 뭔가를 던진다. 맞을수록 더 화가 나서 절대 물러서지 않는다.'
        },
        elephant: {
            en: 'A gentle giant right up until it slams its trunk down and the whole field shakes.',
            ko: '순한 거인이지만 코로 바닥을 내리치면 전장 전체가 흔들린다.'
        },
        raccoon: {
            en: 'A masked little bandit that melts into the shadows before you notice anything missing.',
            ko: '가면 쓴 꼬마 도둑. 뭔가 없어진 걸 눈치채기도 전에 그림자 속으로 사라진다.'
        },
        hedgehog: {
            en: 'Curls into a spiky ball of dark energy and dares anyone to try hitting it.',
            ko: '어둠의 기운을 두른 가시 뭉치로 몸을 말아, 누구든 때려보라고 도발한다.'
        },
        squirrel: {
            en: 'Hoards acorns and somehow hoards buffs too, spreading strength to the whole team.',
            ko: '도토리도 모으고 버프도 모은다. 어쩐지 팀 전체에 힘을 나눠준다.'
        },
        otter: {
            en: 'Playful right up until a weakened foe wanders too close - then it is over instantly.',
            ko: '장난스럽지만 약해진 상대가 가까이 오면 순식간에 끝장낸다.'
        },
        seal: {
            en: 'Barks happily, claps its flippers, and freezes whatever it was clapping at.',
            ko: '신나게 짖고 지느러미를 짝짝 치더니, 박수 치던 상대를 그대로 얼려버린다.'
        },
        dolphin: {
            en: 'Leaps through the waves squeaking encouragement, boosting every ally\'s attack.',
            ko: '파도를 뛰어넘으며 응원의 소리를 내어 모든 아군의 공격력을 끌어올린다.'
        },
        whale: {
            en: 'The biggest splash in the pond - one flick of its tail sends everyone flying.',
            ko: '연못에서 가장 큰 물보라를 일으킨다. 꼬리 한 번으로 모두를 날려버린다.'
        },
        turtle: {
            en: 'Slow, steady, and permanently armored - shields itself before it even says hello.',
            ko: '느긋하고 항상 갑옷을 두른 거북이. 인사도 하기 전에 방어막부터 올린다.'
        },
        snail: {
            en: 'The slowest creature in the yard, and it insists everyone else slow down with it.',
            ko: '마당에서 가장 느린 생물. 다른 모두도 자기처럼 느려지길 고집한다.'
        },
        bee: {
            en: 'Buzzes with static charge and calls the whole hive in for backup on command.',
            ko: '정전기가 잔뜩 오른 채 붕붕거리며 신호 한 번에 벌집 전체를 불러들인다.'
        },
        ladybug: {
            en: 'Small, spotted, and surprisingly good at calling in a swarm of leafy little friends.',
            ko: '작고 점박이지만 나뭇잎 친구 무리를 불러내는 데는 의외로 능숙하다.'
        },
        butterfly: {
            en: 'Flits on the wind so lightly it seems to split into two right before your eyes.',
            ko: '바람에 너무 가볍게 날다 보니 눈앞에서 둘로 갈라지는 것처럼 보인다.'
        },
        bat: {
            en: 'Hangs upside down until dark, then vanishes into the night before you can blink.',
            ko: '어두워질 때까지 거꾸로 매달려 있다가 눈 깜빡할 사이 밤 속으로 사라진다.'
        },
        crab: {
            en: 'Sidesteps into position, pincers ready, waiting for a weakened foe to finish off.',
            ko: '옆걸음으로 자리를 잡고 집게발을 세운 채 약해진 상대를 끝낼 순간을 기다린다.'
        },
        octopus: {
            en: 'Eight arms, one goal - wrap around a target and siphon its health right back.',
            ko: '여덟 개의 팔로 목표를 휘감아 체력을 그대로 빨아들인다.'
        },
        axolotl: {
            en: 'A permanently smiling salamander that regenerates so well it just makes a copy.',
            ko: '항상 웃는 얼굴의 도롱뇽. 재생력이 너무 좋아서 아예 분신을 만들어버린다.'
        },
        dragon: {
            en: 'Small enough to be adorable, hot enough to leave everything it touches smoldering.',
            ko: '귀여울 정도로 작지만 건드리는 모든 것을 그을릴 만큼 뜨겁다.'
        },
        unicorn: {
            en: 'Sparkles down the battlefield leaving a trail of pure luck - everyone\'s crits go up.',
            ko: '전장을 반짝이며 지나가면 순수한 행운이 남아 모두의 치명타 확률이 오른다.'
        },
        gecko: {
            en: 'A tiny lizard that runs hotter than it looks and darts in faster than you can react.',
            ko: '겉보기보다 뜨거운 작은 도마뱀. 반응하기도 전에 재빨리 돌진해 온다.'
        },
        skunk: {
            en: 'You will smell the trouble before you see it - a lingering, toxic parting gift.',
            ko: '보이기도 전에 냄새로 알 수 있다. 오래가는 독성 작별 선물을 남긴다.'
        },
        goat: {
            en: 'Headbutts first, asks questions never - a frosty slam that rattles the whole area.',
            ko: '일단 박치기부터 하고 질문은 없다. 주변을 뒤흔드는 서늘한 강타.'
        },
        horse: {
            en: 'Gallops in on a gust of wind and kicks hard enough to send enemies sailing.',
            ko: '바람을 타고 질주해 와 적을 멀리 날려버릴 만큼 세게 걷어찬다.'
        },
        alpaca: {
            en: 'Fluffy, serene, and blessed with light - refuses to stay down after its first knockout.',
            ko: '복슬복슬하고 평온하며 빛의 축복을 받아, 처음 쓰러져도 다시 일어난다.'
        },
        toucan: {
            en: 'That beak is not just for show - its lucky squawk sharpens the whole team\'s aim.',
            ko: '그 부리는 장식이 아니다. 행운의 울음소리가 팀 전체의 조준을 날카롭게 한다.'
        },
        jellyfish: {
            en: 'Drifts by looking harmless, then delivers a full-body static shock that locks foes up.',
            ko: '무해해 보이게 떠다니다 온몸으로 정전기를 흘려 상대를 꼼짝 못 하게 만든다.'
        },
        chameleon: {
            en: 'Blends into anything, believes in second chances, gets back up after going down once.',
            ko: '무엇에든 녹아드는 몸, 두 번째 기회를 믿어 한 번은 쓰러져도 다시 일어난다.'
        },
        redpanda: {
            en: 'A masked cutie with a fire streak - every swipe leaves a little smolder behind.',
            ko: '가면 쓴 귀염둥이지만 불꽃 기질이 있어 할퀼 때마다 그을음을 남긴다.'
        }
    },

    // A monster is "unlocked" (revealed in the dex) once you have killed at
    // least one of it. save.kills is a per-species counter maintained by
    // game.js's onKill() (piggybacking the existing settlement persist).
    monsterUnlocked(id, save) {
        return ((save && save.kills && save.kills[id]) || 0) > 0;
    },

    // A pet is "unlocked" if you currently own one OR have ever owned/rolled
    // one before (save.petsSeen, maintained by gacha.js's grant path + the
    // save.js migration that seeds it from currently-owned pets).
    petUnlocked(id, save) {
        if (!save) return false;
        const owned = Array.isArray(save.pets) && save.pets.some(p => p.species === id);
        const seen = Array.isArray(save.petsSeen) && save.petsSeen.includes(id);
        return owned || seen;
    }
};

if (typeof module !== 'undefined') module.exports = { Dex };

// =============================================================================
// DexScene - two tabs (MONSTERS/PETS), 4-wide scrollable card grid, tap an
// unlocked card for a detail overlay. Guarded so this file stays require()-able
// (and side-effect-free) from plain Node tests - see the scoping note up top.
// =============================================================================
let DexScene; // eslint-disable-line no-unused-vars

if (typeof Phaser !== 'undefined') {

    const DEX_ELEMENT_COLORS = {
        fire: 0xff7d5c, water: 0x5aa9ff, leaf: 0x7dffb2, wind: 0xc7a4ff,
        electric: 0xffe066, ice: 0xbfe8ff, light: 0xffe9a8, dark: 0x8a7aa8
    };
    const DEX_COLS = 4, DEX_CARD = 148, DEX_GAP = 16, DEX_ROW_H = DEX_CARD + DEX_GAP;

    DexScene = class DexScene extends Phaser.Scene {
        constructor() { super({ key: 'DexScene' }); }

        init(data) {
            this.fromGame = !!(data && data.from === 'game');
            if (!this.tab) this.tab = 'MONSTERS';
        }

        create() {
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            this.viewTop = 176;
            this.viewBottom = H - 20;
            this.detailParts = null;

            this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.bg).setDepth(0);

            this.tabDefs = [
                {
                    key: 'MONSTERS', label: I18n.t('dex.monsters'), list: SPECIES,
                    tex: id => 'sp-' + id + '-idle',
                    unlocked: id => Dex.monsterUnlocked(id, SaveManager.state)
                },
                {
                    key: 'PETS', label: I18n.t('dex.pets'), list: PET_SPECIES,
                    tex: id => 'pet-' + id,
                    unlocked: id => Dex.petUnlocked(id, SaveManager.state)
                }
            ];

            // scrollable grid FIRST (low depth), fixed header drawn on top
            // after it - same trick StageMapScene uses so scrolled-past cards
            // never bleed over the header/tabs.
            this.gridContainer = this.add.container(0, this.viewTop).setDepth(1);
            this.scrollY = this.viewTop;
            this.buildGrid();

            this.add.rectangle(W / 2, 88, W, 176, CONFIG.COLORS.bg).setDepth(5);
            const back = this.add.text(44, 56, this.fromGame ? '▶' : '‹', {
                fontFamily: 'Arial, sans-serif', fontSize: this.fromGame ? '36px' : '48px',
                fontStyle: 'bold', color: this.fromGame ? '#7dffb2' : '#8d86a8'
            }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
            back.on('pointerdown', () => {
                if (this.detailParts) { this.hideDetail(); return; }
                if (this.fromGame) { this.scene.stop(); this.scene.resume('GameScene'); }
                else SmooshGame.goto('MenuScene');
            });

            this.add.text(W / 2, 56, I18n.t('dex.title'), {
                fontFamily: 'Arial, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#7dffb2'
            }).setOrigin(0.5).setDepth(10);

            this.tabButtons = [];
            const tw = 220;
            this.tabDefs.forEach((t, i) => {
                const x = W / 2 + (i - 0.5) * (tw + 12);
                const bg = this.add.nineslice(x, 132, 'pill-tex', 0, tw, 54, 16, 16, 14, 14)
                    .setTint(t.key === this.tab ? 0x342a52 : 0x241f3d).setDepth(10)
                    .setInteractive({ useHandCursor: true });
                const label = this.add.text(x, 132, t.label, {
                    fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold',
                    color: t.key === this.tab ? '#e8e6f5' : '#8d86a8'
                }).setOrigin(0.5).setDepth(11);
                bg.on('pointerdown', () => {
                    if (this.detailParts || this.tab === t.key) return;
                    this.tab = t.key;
                    this.tabButtons.forEach(b => {
                        b.bg.setTint(b.key === this.tab ? 0x342a52 : 0x241f3d);
                        b.label.setColor(b.key === this.tab ? '#e8e6f5' : '#8d86a8');
                    });
                    this.buildGrid();
                });
                this.tabButtons.push({ key: t.key, bg, label });
            });

            this.wireScroll();
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideDetail());
        }

        currentTabDef() { return this.tabDefs.find(t => t.key === this.tab); }

        buildGrid() {
            this.gridContainer.removeAll(true);
            this.cardViews = [];
            const def = this.currentTabDef();
            const W = CONFIG.WIDTH;
            const startX = (W - (DEX_COLS * DEX_CARD + (DEX_COLS - 1) * DEX_GAP)) / 2 + DEX_CARD / 2;

            def.list.forEach((sp, i) => {
                const col = i % DEX_COLS, row = Math.floor(i / DEX_COLS);
                const x = startX + col * (DEX_CARD + DEX_GAP);
                const y = DEX_CARD / 2 + row * DEX_ROW_H;
                const unlocked = def.unlocked(sp.id);

                const card = this.add.nineslice(x, y, 'btn-tex', 0, DEX_CARD, DEX_CARD, 20, 20, 20, 20)
                    .setTint(unlocked ? 0x201a33 : 0x18142a);
                const spr = this.add.image(x, y - 16, def.tex(sp.id)).setDisplaySize(80, 80);
                if (!unlocked) spr.setTint(0x221a38);
                const label = this.add.text(x, y + 50, unlocked ? sp.name : I18n.t('dex.locked'), {
                    fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold',
                    color: unlocked ? '#e8e6f5' : '#5a5570'
                }).setOrigin(0.5);
                this.gridContainer.add([card, spr, label]);

                this.cardViews.push({ x, y, r: DEX_CARD / 2, sp, def, unlocked });
            });

            const rows = Math.max(1, Math.ceil(def.list.length / DEX_COLS));
            this.gridContentHeight = rows * DEX_ROW_H;
            this.scrollMax = this.viewTop;
            this.scrollMin = Math.min(this.viewTop, this.viewBottom - this.gridContentHeight);
            this.scrollY = this.scrollMax;
            this.applyScroll();
        }

        clampScroll(v) { return Phaser.Math.Clamp(v, this.scrollMin, this.scrollMax); }
        applyScroll() { this.gridContainer.y = this.scrollY; }

        wireScroll() {
            this.dragging = false;
            this.dragMoved = false;
            this.dragStartY = 0;
            this.scrollStartY = 0;
            this._downOverUi = false;

            this.input.on('pointerdown', (pointer, currentlyOver) => {
                if (this.detailParts) return;
                this._downOverUi = !!(currentlyOver && currentlyOver.length > 0);
                this.dragging = true;
                this.dragMoved = false;
                this.dragStartY = pointer.y;
                this.scrollStartY = this.scrollY;
            });
            this.input.on('pointermove', (pointer) => {
                if (!this.dragging) return;
                const dy = pointer.y - this.dragStartY;
                if (Math.abs(dy) > 6) this.dragMoved = true;
                this.scrollY = this.clampScroll(this.scrollStartY + dy);
                this.applyScroll();
            });
            this.input.on('pointerup', (pointer) => {
                this.dragging = false;
                if (this.detailParts) return;
                if (!this.dragMoved && !this._downOverUi) this.handleTap(pointer.x, pointer.y);
            });
            this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
                if (this.detailParts) return;
                this.scrollY = this.clampScroll(this.scrollY - dy * 0.6);
                this.applyScroll();
            });
        }

        handleTap(x, y) {
            const worldY = y - this.scrollY;
            for (const v of this.cardViews) {
                const dx = x - v.x, dyy = worldY - v.y;
                if (Math.abs(dx) <= v.r && Math.abs(dyy) <= v.r) {
                    if (v.unlocked) this.showDetail(v.sp, v.def);
                    return;
                }
            }
        }

        showDetail(sp, def) {
            this.hideDetail();
            const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
            const parts = [];

            const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.9).setDepth(20).setInteractive();
            parts.push(dim);
            dim.on('pointerdown', () => this.hideDetail());

            const panelH = H * 0.66;
            const panel = this.add.nineslice(W / 2, H / 2, 'btn-tex', 0, W - 60, panelH, 28, 28, 28, 28)
                .setTint(0x1c1730).setDepth(21);
            parts.push(panel);

            const top = H / 2 - panelH / 2 + 74;

            const spr = this.add.image(W / 2, top, def.tex(sp.id)).setDisplaySize(150, 150).setDepth(22);
            parts.push(spr);

            const nameY = top + 104;
            parts.push(this.add.text(W / 2, nameY, sp.name, {
                fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#e8e6f5'
            }).setOrigin(0.5).setDepth(22));

            const elem = sp.elem || sp.element;
            const chip = makeChip(this, W / 2, nameY + 42, 150, 40,
                DEX_ELEMENT_COLORS[elem] || 0x5a5570, null, (elem || '').toUpperCase(), '#141020');
            chip.parts.forEach(p => p.setDepth(22));
            parts.push(...chip.parts);

            const skillId = sp.skill;
            const arche = (typeof Skills !== 'undefined' && Skills.ARCHETYPES[skillId]) || null;
            const skillY = nameY + 88;
            parts.push(this.add.image(W / 2 - 128, skillY, 'spark-tex')
                .setDisplaySize(26, 26).setTint(DEX_ELEMENT_COLORS[elem] || 0xffffff).setDepth(22));
            parts.push(this.add.text(W / 2 - 100, skillY, I18n.t('dex.skill') + ': ' +
                (skillId ? skillId.toUpperCase() : '-'), {
                fontFamily: 'Arial, sans-serif', fontSize: '21px', fontStyle: 'bold', color: '#ffd54a'
            }).setOrigin(0, 0.5).setDepth(22));
            parts.push(this.add.text(W / 2, skillY + 32,
                arche ? (arche.desc[I18n.locale] || arche.desc.en) : '', {
                fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#8d86a8',
                align: 'center', wordWrap: { width: W - 140 }
            }).setOrigin(0.5, 0).setDepth(22));

            const loreEntry = Dex.LORE[sp.id];
            const lore = loreEntry ? (loreEntry[I18n.locale] || loreEntry.en) : '';
            const loreY = skillY + 88;
            parts.push(this.add.text(W / 2, loreY, lore, {
                fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'italic', color: '#e8e6f5',
                align: 'center', wordWrap: { width: W - 140 }
            }).setOrigin(0.5, 0).setDepth(22));

            const st = SaveManager.state;
            const statLines = def.key === 'MONSTERS'
                ? ['HP ×' + sp.hpMult.toFixed(1), 'SPD ' + sp.speed, 'GOLD ×' + sp.goldMult.toFixed(1),
                    I18n.t('dex.kills', { n: (st.kills && st.kills[sp.id]) || 0 })]
                : (() => {
                    const owned = st.pets.find(p => p.species === sp.id);
                    return owned
                        ? ['LV ' + owned.level, owned.rarity.toUpperCase(), (elem || '').toUpperCase()]
                        : [(elem || '').toUpperCase(), (skillId || '').toUpperCase()];
                })();
            parts.push(this.add.text(W / 2, H / 2 + panelH / 2 - 128, statLines.join('   ·   '), {
                fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#7dffb2',
                align: 'center', wordWrap: { width: W - 100 }
            }).setOrigin(0.5).setDepth(22));

            const closeBtn = makeUiButton(this, W / 2, H / 2 + panelH / 2 - 60, 200, 68,
                '✕', 0xff5ec4, () => this.hideDetail());

            this.detailParts = { parts, closeBtn };
        }

        hideDetail() {
            if (!this.detailParts) return;
            this.detailParts.parts.forEach(p => p.destroy());
            this.detailParts.closeBtn.destroyAll();
            this.detailParts = null;
        }
    };
}
