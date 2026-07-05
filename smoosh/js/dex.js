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
        // --- monsters (24 original + 40 v6 Task 8 newcomers = 64) ---
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
            en: 'Trembles and flees, but its jitters somehow sharpen the whole squad’s aim.',
            ko: '덜덜 떨며 도망치지만, 그 긴장감이 이상하게 팀 전체의 명중률을 날카롭게 만든다.'
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
            en: 'Bounces closer on borrowed rabbit ears, then snaps out a sticky tongue to reel you in.',
            ko: '빌려온 토끼 귀로 통통 튀어 다가온 뒤, 끈적한 혀를 뻗어 확 끌어당긴다.'
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

        // --- v6 Task 8: 40 elemental newcomers (fire/water/leaf/wind/
        // electric/ice/light/dark x5) ---
        embit: {
            en: 'A tiny fire imp that zips in fast, bites once, and leaves you smoldering for the trouble.',
            ko: '빠르게 달려들어 한 입 물고 사라지는 작은 불의 임프. 물린 자리는 계속 그을린다.'
        },
        magmaw: {
            en: 'A lava-veined brute that gets angrier - and faster - the more damage it takes.',
            ko: '용암 혈관이 흐르는 거한. 맞을수록 더 화가 나서 공격이 빨라진다.'
        },
        cinderwing: {
            en: 'Flits through smoke on ember wings, then swoops in to finish off the weak.',
            ko: '연기 속을 불씨 날개로 날아다니다가, 약해진 상대에게 급강하해 끝장낸다.'
        },
        scorchess: {
            en: 'A crowned fire knight in a stolen helmet, roaring the whole squad\'s attack louder.',
            ko: '훔친 투구를 쓴 불꽃 기사 여왕. 포효 한 번으로 팀 전체의 공격력을 끌어올린다.'
        },
        ashghast: {
            en: 'The last wisp of a burned-out ember, freckled with soot and gone before you can swing.',
            ko: '다 타버린 불씨의 마지막 잔영. 그을음투성이로 휘두르기도 전에 사라진다.'
        },
        dribblet: {
            en: 'A cheerful little droplet that splashes in fast and slows everyone it touches.',
            ko: '명랑한 작은 물방울. 재빠르게 튀어와 닿는 모두를 느리게 만든다.'
        },
        tidalump: {
            en: 'A curled wave given a temper - slams down like a rogue tide, then shoves you back.',
            ko: '성격 있는 파도 덩어리. 변덕스러운 해일처럼 내려치고 다시 밀쳐낸다.'
        },
        finling: {
            en: 'A gleaming little fish that drifts above the fray, patching up whoever is hurting most.',
            ko: '반짝이는 작은 물고기. 전투 위를 떠다니며 가장 다친 아군을 치료한다.'
        },
        pearlessa: {
            en: 'A pearl-crowned healer who drifts in slow circles, mending the squad between splashes.',
            ko: '진주관을 쓴 치유사. 천천히 원을 그리며 물장구 사이사이 팀을 치료한다.'
        },
        anglerfin: {
            en: 'Lurks still in the murk with a glowing lure, then yanks the curious in for a bite.',
            ko: '어둠 속에서 빛나는 미끼를 드리우고 가만히 기다리다, 호기심 많은 상대를 확 끌어당겨 문다.'
        },
        sprigby: {
            en: 'A sprouting little jelly that dashes through the grass just to see you flinch.',
            ko: '싹이 튼 작은 젤리. 그저 놀라는 모습을 보려고 풀밭을 가로질러 돌진한다.'
        },
        brambull: {
            en: 'A thorn-crowned bull of a jelly that head-slams first and dares you to complain.',
            ko: '가시관을 쓴 황소 같은 젤리. 일단 박치기로 내려치고 항의는 받지 않는다.'
        },
        thornel: {
            en: 'Drifts on thorny vines, draining a little health back with every scratch.',
            ko: '가시 넝쿨을 타고 떠다니며, 할퀼 때마다 체력을 조금씩 빨아들인다.'
        },
        mossking: {
            en: 'A self-crowned ruler of moss and mulch who somehow makes the whole squad\'s gold pile up.',
            ko: '이끼와 부엽토의 자칭 왕. 이유는 몰라도 팀 전체의 골드를 불려준다.'
        },
        bogwisp: {
            en: 'Too shy to bite, so it hides in the muck and poisons you from a safe distance.',
            ko: '물기엔 너무 수줍어서 진흙 속에 숨어 안전한 거리에서 독을 뿌린다.'
        },
        gustlet: {
            en: 'A gust of a jelly, zigzagging so fast its own static charge chains between foes.',
            ko: '지그재그로 너무 빨리 움직여서 자체 정전기가 적들 사이로 튀는 돌풍 젤리.'
        },
        gale: {
            en: 'A living windstorm that charges in and ground-pounds before you feel the breeze.',
            ko: '돌진해 들어와 산들바람을 느끼기도 전에 바닥을 내려치는 살아있는 폭풍.'
        },
        skyferry: {
            en: 'Rides the high thermals on long ears, sparking every ally\'s attack as it passes.',
            ko: '긴 귀로 상승기류를 타고 날며, 지나칠 때마다 아군의 공격력에 불꽃을 더한다.'
        },
        zephyrex: {
            en: 'A haloed breeze-jelly that spins slow circles, sharpening the whole squad\'s crits.',
            ko: '후광을 두른 산들바람 젤리. 천천히 맴돌며 팀 전체의 치명타를 날카롭게 만든다.'
        },
        hushwind: {
            en: 'A cold hush of a breeze that blinks out of sight and freezes you before you notice.',
            ko: '차가운 정적의 바람. 눈 깜빡할 새 사라졌다가 알아채기도 전에 얼려버린다.'
        },
        sparkitten: {
            en: 'A tiny electric kitten that darts about and stuns anything it winks at.',
            ko: '찌릿찌릿 돌아다니는 작은 전기 고양이. 윙크하는 상대는 그대로 기절시킨다.'
        },
        voltox: {
            en: 'A horned powerhouse crackling with charge, throwing up a shield before the first hit lands.',
            ko: '전류가 흐르는 뿔 달린 거한. 첫 타격이 오기도 전에 보호막부터 세운다.'
        },
        circuitina: {
            en: 'Traces glowing circuit lines through the air, sharpening the squad\'s aim as she loops.',
            ko: '허공에 빛나는 회로 무늬를 그리며, 맴돌 때마다 팀의 명중률을 날카롭게 다듬는다.'
        },
        thundrake: {
            en: 'A crowned little dragon crackling with rage, charging in with a thunderclap finish.',
            ko: '분노로 지지직거리는 작은 왕관 쓴 드래곤. 천둥 같은 마무리로 돌진한다.'
        },
        staticmoth: {
            en: 'Flickers in and out like bad static, draining a little life with every clinging zap.',
            ko: '고장 난 정전기처럼 깜빡이며, 달라붙는 감전 한 번마다 생명력을 조금씩 빨아들인다.'
        },
        chilla: {
            en: 'A pointy-eared little chill that darts around and freezes whatever it spits at.',
            ko: '뾰족귀를 가진 작은 냉기 덩어리. 여기저기 튀어다니며 뱉는 것마다 얼려버린다.'
        },
        glacior: {
            en: 'A glacier with curved horns and a grudge, roaring a challenge before it slams down.',
            ko: '굽은 뿔에 원한까지 품은 빙하. 내려치기 전에 먼저 포효로 도발한다.'
        },
        frostwing: {
            en: 'Floats on frosty air, patching up the most wounded ally with a chilly, gentle touch.',
            ko: '서리 낀 공기 위를 떠다니며, 차갑지만 다정한 손길로 가장 다친 아군을 치료한다.'
        },
        iceira: {
            en: 'A haloed ice queen who circles the field, chilling the air while boosting every ally\'s swing.',
            ko: '후광을 두른 얼음 여왕. 전장을 맴돌며 공기를 식히고 아군의 공격력을 끌어올린다.'
        },
        shiverling: {
            en: 'Shivers so hard it slows down everything nearby, itself included, without meaning to.',
            ko: '너무 심하게 떨어서 자기 자신을 포함해 주변 모두를 느리게 만들어 버린다.'
        },
        glimmite: {
            en: 'A tiny sparkle of a jelly whose every hit somehow leaves a little extra gold behind.',
            ko: '작고 반짝이는 젤리. 어쩐지 때릴 때마다 골드를 조금씩 더 남긴다.'
        },
        seraphume: {
            en: 'A haloed knight that charges in with love in its eyes and a shield around its allies.',
            ko: '사랑의 눈빛으로 돌진하며 아군에게 보호막을 씌워주는 후광 두른 기사.'
        },
        sundrop: {
            en: 'A drop of pure sunshine that drifts by, sharpening the squad\'s crits with every glow.',
            ko: '순수한 햇살 한 방울. 떠다니며 빛날 때마다 팀의 치명타를 날카롭게 만든다.'
        },
        haloghost: {
            en: 'A gentle spirit wrapped in light that vanishes from sight right before it strikes.',
            ko: '빛에 감싸인 온화한 영혼. 공격 직전 시야에서 슬며시 사라진다.'
        },
        beamy: {
            en: 'A drifting beam of pure encouragement that never fights, only lifts the squad\'s power.',
            ko: '떠다니는 순수한 응원의 빛줄기. 싸우지 않고 오직 팀의 힘만 끌어올린다.'
        },
        shadowlet: {
            en: 'A pointy little shadow that darts in, bites, and drinks back the health it takes.',
            ko: '뾰족한 작은 그림자. 재빨리 달려들어 물고 그만큼 체력을 빨아들인다.'
        },
        voidmaw: {
            en: 'A curved-horned void of a brute that slams down and finishes off the weakened.',
            ko: '굽은 뿔을 가진 어둠의 거한. 내려친 뒤 약해진 상대를 끝장낸다.'
        },
        wraithkite: {
            en: 'A spiked, scared little wraith that flits above the fray, spitting poison as it flees.',
            ko: '가시 달린 겁 많은 유령. 전투 위를 날아다니며 도망치듯 독을 뱉는다.'
        },
        nightqueen: {
            en: 'A crowned queen of the dark who charges in adoringly, sharpening the squad\'s every crit.',
            ko: '어둠의 왕관을 쓴 여왕. 사랑스럽게 돌진하며 팀의 치명타를 날카롭게 만든다.'
        },
        duskfang: {
            en: 'A long-snouted shadow that lies in wait, then yanks its prey in with a sticky tongue.',
            ko: '긴 주둥이를 가진 그림자. 숨어 기다리다 끈적한 혀로 먹잇감을 확 끌어당긴다.'
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
            en: 'Croaks once, then its tongue snaps out and yanks the nearest target in close.',
            ko: '한 번 개굴 울고는 끈적한 혀를 뻗어 가장 가까운 대상을 훅 끌어당긴다.'
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
        },

        // --- v7 Task 7: 6 legendary-caliber newcomers ---
        phoenix: {
            en: 'Bursts into flame, crumbles to ash, and struts back to life like nothing happened.',
            ko: '화르륵 타올라 재가 되어도, 아무 일 없었다는 듯 다시 걸어 나온다.'
        },
        griffin: {
            en: 'Half eagle, half lion, all business - swoops down and drags its prey straight to the pride.',
            ko: '반은 독수리, 반은 사자. 급강하해 먹잇감을 무리 앞까지 확 끌고 온다.'
        },
        thunderbird: {
            en: 'Every wingbeat cracks like thunder, and one bolt from its beak arcs to three foes at once.',
            ko: '날갯짓마다 천둥이 치고, 부리에서 뻗은 번개가 적 셋에게 한 번에 튄다.'
        },
        yeti: {
            en: 'A legend from the highest peak that lumbers down just once - and leaves the whole field frozen solid.',
            ko: '가장 높은 봉우리의 전설. 딱 한 번 내려와 전장을 통째로 얼려버린다.'
        },
        pegasus: {
            en: 'Wings of pure light carry it above the fray, and its battle-cry lifts every ally\'s attack.',
            ko: '순수한 빛의 날개로 전장 위를 날며, 함성 한 번으로 아군 전체의 공격력을 끌어올린다.'
        },
        hydra: {
            en: 'Cut off one head and two more grow back - this shadowy beast refuses to ever stay down for good.',
            ko: '머리 하나를 자르면 두 개가 자란다. 이 그림자 괴수는 완전히 쓰러지길 거부한다.'
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

    // v4.0 Phase C Task 3: element-scoped FX use CONFIG.PASTEL.elements[e].base
    // directly (same convention as Task 2's game.js/effects.js sweep) instead
    // of this file keeping its own parallel element->color table.
    function dexElementColor(elem, fallback) {
        const ramp = CONFIG.PASTEL.elements[elem];
        return ramp ? ramp.base : fallback;
    }
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
            // v4.0 Phase C Task 3: header text sits on-bg (not on-panel), and
            // bg (0xf6f1fb) is lighter than panel - goodText reads even
            // better here than it does on panel, so it's safe for this hue.
            const back = this.add.text(44, 56, this.fromGame ? '▶' : '‹', {
                fontFamily: CONFIG.FONT, fontSize: this.fromGame ? '36px' : '48px',
                color: this.fromGame ? Balance.hex(CONFIG.PASTEL.goodText) : Balance.hex(CONFIG.PASTEL.inkSoft)
            }).setOrigin(0.5).setDepth(10);
            // v6 Task 4: isolated corner glyph - the 2-tab bar below starts
            // at x=134 (W/2 - 0.5*(220+12)), well clear of this button's
            // x-range (~[20,68]), so no overlap risk from any direction.
            padTapArea(back);
            back.on('pointerdown', () => {
                if (this.detailParts) { this.hideDetail(); return; }
                if (this.fromGame) { this.scene.stop(); this.scene.resume('GameScene'); }
                else SmooshGame.goto('SubMainScene'); // v7 T14: back -> the hub, not the splash
            });

            // v5.0 Task 2: 40->34 - header-title trim (pixel-font headroom).
            this.add.text(W / 2, 56, I18n.t('dex.title'), {
                fontFamily: CONFIG.FONT, fontSize: '34px', color: Balance.hex(CONFIG.PASTEL.goodText)
            }).setOrigin(0.5).setDepth(10);

            this.tabButtons = [];
            const tw = 220;
            this.tabDefs.forEach((t, i) => {
                const x = W / 2 + (i - 0.5) * (tw + 12);
                const bg = this.add.nineslice(x, 132, 'pill-tex', 0, tw, 54, 16, 16, 14, 14)
                    .setTint(t.key === this.tab ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel).setDepth(10)
                    .setInteractive({ useHandCursor: true });
                const label = this.add.text(x, 132, t.label, {
                    fontFamily: CONFIG.FONT, fontSize: '21px', color: Balance.hex(t.key === this.tab ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5).setDepth(11);
                bg.on('pointerdown', () => {
                    if (this.detailParts || this.tab === t.key) return;
                    this.tab = t.key;
                    this.tabButtons.forEach(b => {
                        b.bg.setTint(b.key === this.tab ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel);
                        b.label.setColor(Balance.hex(b.key === this.tab ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft));
                    });
                    this.buildGrid();
                });
                this.tabButtons.push({ key: t.key, bg, label });
            });

            this.wireScroll();
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hideDetail());
        }

        currentTabDef() { return this.tabDefs.find(t => t.key === this.tab); }

        // v5.0 RETRO ARCADE Task 5: the currently-owned pet instance for a
        // species (or undefined) - the source of truth for which frame
        // rarity a pet card/detail should render, since rarity lives on the
        // owned pet, not the species definition (see gacha.js).
        ownedPet(id) {
            const st = SaveManager.state;
            return (st && Array.isArray(st.pets)) ? st.pets.find(p => p.species === id) : undefined;
        }

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

                // v5.0 RETRO ARCADE Task 5: pet cards get a frame in the
                // OWNED pet's rolled rarity (gacha rarity is per-owned-pet-
                // instance, not per species - see gacha.js); monsters have
                // no rarity concept at all, so they get a flat neutral
                // 'common' frame instead of an elem-tinted one (keeps every
                // monster card visually uniform - only pets carry a rarity
                // signal). Locked/never-seen cards also get the flat
                // 'common' frame (no rarity to reveal yet). Computed once
                // (v6 Task 12) and reused for the pedestal below too.
                const rarity = def.key === 'PETS' ? Frames.rarityOf(this.ownedPet(sp.id)) : 'common';

                // v4.0 Phase C Task 3: unlocked cards pop with panelLight
                // (same "available" convention as the upgrade bar's afford
                // state); locked cards use plain panel dimmed slightly (same
                // convention as the upgrade bar's "MAX" card).
                const card = this.add.nineslice(x, y, 'btn-tex', 0, DEX_CARD, DEX_CARD, 20, 20, 20, 20)
                    .setTint(unlocked ? CONFIG.PASTEL.panelLight : CONFIG.PASTEL.panel)
                    .setAlpha(unlocked ? 1 : 0.85);
                // v6 Task 12: little pedestal the sprite stands on, centered
                // under its feet (sprite is 80px tall at y-16, so its feet
                // sit around y+22).
                const pedestal = Frames.drawPedestal(this, x, y + 22, 76, rarity);
                const spr = this.add.image(x, y - 16, def.tex(sp.id)).setDisplaySize(80, 80);
                // Locked silhouette: deep ink tint so it still reads as a
                // "shadow" of the creature on the light card underneath.
                if (!unlocked) spr.setTint(CONFIG.PASTEL.ink);
                const label = this.add.text(x, y + 50, unlocked ? sp.name : I18n.t('dex.locked'), {
                    fontFamily: CONFIG.FONT, fontSize: '17px', color: Balance.hex(unlocked ? CONFIG.PASTEL.ink : CONFIG.PASTEL.inkSoft)
                }).setOrigin(0.5);
                // v5.0 Task 2 review fix: longest species name (e.g. "King
                // Jelly") at 1.0em/char overruns the 148px card - clamp it.
                fitToWidth(label, DEX_CARD - 12);
                // v6 Task 12: small name-plate pill behind the label, sized
                // to the label's OWN (already-clamped) display width so it
                // never itself overruns the card.
                const plate = this.add.nineslice(x, y + 50, 'pill-tex', 0,
                    label.displayWidth + 16, 24, 12, 12, 10, 10)
                    .setTint(CONFIG.PASTEL.panel).setAlpha(0.85);
                // v6 Task 12: grid cards can show ~50 at once - shimmer/glow/
                // pip/gem tweens stay OFF here (static sheen instead) no
                // matter how rare the pet rolled; only the single detail
                // view and gacha single-pull reveal (one card on screen at a
                // time) get the animated version. See frames.js's
                // drawShimmerBand comment for the full rationale.
                const frame = Frames.draw(this, x, y, DEX_CARD, DEX_CARD, rarity, { animate: false });
                this.gridContainer.add([card, pedestal, spr, plate, label, frame]);

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

            // v4.0 Phase C Task 3: modal dim-scrim - stays near-black on
            // purpose regardless of theme (same exception class as
            // ui.js's showSettlement scrim).
            const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0714, 0.9).setDepth(20).setInteractive();
            parts.push(dim);
            dim.on('pointerdown', () => this.hideDetail());

            const panelH = H * 0.66;
            const panel = this.add.nineslice(W / 2, H / 2, 'btn-tex', 0, W - 60, panelH, 28, 28, 28, 28)
                .setTint(CONFIG.PASTEL.panel).setDepth(21);
            parts.push(panel);

            const top = H / 2 - panelH / 2 + 74;

            // v5.0 RETRO ARCADE Task 5: same rarity-frame rule as the grid
            // cards (owned-pet rarity for PETS, flat 'common' for monsters),
            // sized a little larger than the 150px sprite so the border
            // doesn't hug it. v6 Task 12: computed once and reused for the
            // pedestal below too; detail is a single big card on screen at a
            // time, so it keeps the default `animate: true` (full sweeping
            // shimmer/glow/gem) unlike the grid's `{ animate: false }`.
            const rarity = def.key === 'PETS' ? Frames.rarityOf(this.ownedPet(sp.id)) : 'common';

            // v6 Task 12: pedestal the sprite stands on, centered under its
            // feet (150px sprite centered at `top` -> feet around top+62).
            // Depth sits below the frame/sprite (22) but above the panel
            // (21) - the panel/pedestal/frame/sprite regions don't overlap
            // each other in a way that makes finer insertion-order control
            // necessary here (see nameplate pill below for the case where
            // it does).
            const pedestal = Frames.drawPedestal(this, W / 2, top + 62, 150, rarity).setDepth(21.4);
            parts.push(pedestal);

            const frame = Frames.draw(this, W / 2, top, 190, 190, rarity).setDepth(22);
            parts.push(frame);

            const spr = this.add.image(W / 2, top, def.tex(sp.id)).setDisplaySize(150, 150).setDepth(22);
            parts.push(spr);

            const nameY = top + 104;
            const nameText = this.add.text(W / 2, nameY, sp.name, {
                fontFamily: CONFIG.FONT, fontSize: '32px', color: Balance.hex(CONFIG.PASTEL.ink)
            }).setOrigin(0.5).setDepth(22);
            // v6 Task 12: "name plate (pixel font, fitToWidth)" - clamp
            // BEFORE measuring the plate width below so a hypothetical very
            // long localized name can never itself overrun the plate/panel.
            fitToWidth(nameText, W - 160);
            // v6 Task 12: name-plate pill behind the name, sized to the
            // (already-clamped) text's own display width. Depth pinned
            // just under the text's 22 (rather than relying on creation
            // order, the way the container-based grid cards above do) since
            // this pill is created AFTER measuring the text it sits behind.
            parts.push(this.add.nineslice(W / 2, nameY, 'pill-tex', 0,
                nameText.displayWidth + 40, 46, 18, 18, 14, 14)
                .setTint(CONFIG.PASTEL.panelLight).setDepth(21.9));
            parts.push(nameText);

            const elem = sp.elem || sp.element;
            // v5 final-review fix: this chip's fill is the element's bright
            // neon `base` (dexElementColor) - the v5 palette flip made `ink`
            // (near-white) too light a label on that same bright fill
            // (contrast ~1.0-3.7 across all 8 elements, all fail WCAG). `bg`
            // (near-black) reads dark-on-bright instead, like the button-label
            // fix - verified >=4.5:1 against every element base in
            // tests/pastel.test.js.
            const chip = makeChip(this, W / 2, nameY + 42, 150, 40,
                dexElementColor(elem, CONFIG.PASTEL.inkSoft), null, (elem || '').toUpperCase(), Balance.hex(CONFIG.PASTEL.bg));
            chip.parts.forEach(p => p.setDepth(22));
            parts.push(...chip.parts);

            const skillId = sp.skill;
            const arche = (typeof Skills !== 'undefined' && Skills.ARCHETYPES[skillId]) || null;
            const skillY = nameY + 88;
            // v6 Task 12: "element + skill chips" - the skill row upgraded
            // from a bare icon+text line into a proper chip matching the
            // element chip above it, for the trading-card look. panelLight
            // fill + ink text is the same "light text on dark panel"
            // convention every other panelLight chip/card in this file
            // already uses (unlike the element chip's bright-fill/dark-text
            // exception, which has its own contrast-floor test).
            const skillChip = makeChip(this, W / 2, skillY, 260, 40,
                CONFIG.PASTEL.panelLight, 'spark-tex',
                I18n.t('dex.skill') + ': ' + (skillId ? skillId.toUpperCase() : '-'),
                Balance.hex(CONFIG.PASTEL.ink));
            skillChip.parts.forEach(p => p.setDepth(22));
            if (skillChip.parts[1]) skillChip.parts[1].setTint(dexElementColor(elem, CONFIG.PASTEL.white));
            parts.push(...skillChip.parts);
            parts.push(this.add.text(W / 2, skillY + 32,
                arche ? (arche.desc[I18n.locale] || arche.desc.en) : '', {
                fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.inkSoft),
                align: 'center', wordWrap: { width: W - 140 }
            }).setOrigin(0.5, 0).setDepth(22));

            const loreEntry = Dex.LORE[sp.id];
            const lore = loreEntry ? (loreEntry[I18n.locale] || loreEntry.en) : '';
            const loreY = skillY + 88;
            parts.push(this.add.text(W / 2, loreY, lore, {
                fontFamily: CONFIG.FONT, fontSize: '19px', fontStyle: 'italic', color: Balance.hex(CONFIG.PASTEL.ink),
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
                fontFamily: CONFIG.FONT, fontSize: '18px', color: Balance.hex(CONFIG.PASTEL.goodText),
                align: 'center', wordWrap: { width: W - 100 }
            }).setOrigin(0.5).setDepth(22));

            const closeBtn = makeUiButton(this, W / 2, H / 2 + panelH / 2 - 60, 200, 68,
                '✕', CONFIG.PASTEL.accent, () => this.hideDetail());

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
