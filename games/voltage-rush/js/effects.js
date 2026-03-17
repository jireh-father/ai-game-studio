// Voltage Rush - Effects & Audio (juice, particles, sound)
var Effects = {
    punchNode: function(scene, idx, scale, dur) {
        var n = scene.nodes[idx];
        if (!n || !n._gfxCircle) return;
        scene.tweens.add({
            targets: n._gfxCircle, scaleX: scale, scaleY: scale, duration: dur / 2,
            yoyo: true, ease: 'Back.easeOut'
        });
    },

    spawnParticles: function(scene, x, y, tier) {
        var color = tier === 'critical' ? COLORS.critical : (tier === 'warning' ? COLORS.warning : COLORS.nodeIdle);
        var count = GameState.safeChain >= 5 ? 12 : 8;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2;
            var speed = 80 + Math.random() * 80;
            var p = scene.add.circle(x, y, 3, color).setDepth(15);
            scene.tweens.add({
                targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed,
                alpha: 0, scale: 0, duration: 350,
                onComplete: function() { p.destroy(); }
            });
        }
    },

    showFloatingScore: function(scene, x, y, points, tier) {
        var color = tier === 'critical' ? '#FF3300' : (tier === 'warning' ? '#FFAA00' : '#00FFCC');
        var txt = scene.add.text(x, y, '+' + points, {
            fontSize: '22px', fontFamily: 'Arial', fill: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(15);
        scene.tweens.add({
            targets: txt, y: y - 70, alpha: 0, duration: 700,
            onComplete: function() { txt.destroy(); }
        });
    },

    scorePunch: function(scene) {
        if (!scene.scoreText) return;
        scene.tweens.add({
            targets: scene.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 75,
            yoyo: true, ease: 'Bounce.easeOut'
        });
    },

    showChainMilestone: function(scene, text, big) {
        var t = scene.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '\u26A1 ' + text, {
            fontSize: big ? '32px' : '26px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0).setDepth(20);
        scene.tweens.add({
            targets: t, scaleX: 1.3, scaleY: 1.3, duration: 200, ease: 'Back.easeOut',
            onComplete: function() {
                scene.tweens.add({
                    targets: t, scaleX: 1, scaleY: 1, alpha: 0, duration: 600,
                    onComplete: function() { t.destroy(); }
                });
            }
        });
        if (big) {
            for (var i = 0; i < 20; i++) {
                var a = (i / 20) * Math.PI * 2;
                var p = scene.add.circle(GAME_WIDTH/2, GAME_HEIGHT/2, 3, COLORS.gold).setDepth(20);
                scene.tweens.add({
                    targets: p, x: GAME_WIDTH/2 + Math.cos(a) * 100,
                    y: GAME_HEIGHT/2 + Math.sin(a) * 100, alpha: 0, duration: 700,
                    onComplete: function() { p.destroy(); }
                });
            }
        }
    },

    explodeNode: function(scene, idx) {
        var n = scene.nodes[idx];
        if (!n) return;
        var ring = scene.add.circle(n.x, n.y, NODE_RADIUS, COLORS.critical).setDepth(20);
        scene.tweens.add({
            targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 300,
            onComplete: function() { ring.destroy(); }
        });
    },

    // Audio
    initAudio: function() {
        try {
            return new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { return null; }
    },

    playTapSound: function(audioCtx, tier) {
        if (!GameState.soundOn || !audioCtx) return;
        try {
            var freq = tier === 'critical' ? 660 : (tier === 'warning' ? 550 : 440);
            freq += GameState.safeChain * 10;
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        } catch(e) {}
    },

    playArcSound: function(audioCtx) {
        if (!GameState.soundOn || !audioCtx) return;
        try {
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 220;
            osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        } catch(e) {}
    },

    playExplosionSound: function(audioCtx, index) {
        if (!GameState.soundOn || !audioCtx) return;
        try {
            var freq = 120 + index * 20;
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } catch(e) {}
    }
};
