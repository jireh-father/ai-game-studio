// Voltage Rush - Rendering (node drawing, arcs, wires)
var Renderer = {
    drawWires: function(scene) {
        scene.wireGraphics.clear();
        scene.wireGraphics.lineStyle(1, COLORS.wire, 0.4);
        for (var i = 0; i < scene.nodes.length; i++) {
            var n = scene.nodes[i];
            if (n.type === 'insulated' || n.arcTarget < 0) continue;
            var t = scene.nodes[n.arcTarget];
            scene.wireGraphics.lineBetween(n.x, n.y, t.x, t.y);
        }
    },

    drawNodes: function(scene) {
        scene.chargeGraphics.clear();
        for (var i = 0; i < scene.nodes.length; i++) {
            var n = scene.nodes[i];
            var g = scene.chargeGraphics;

            if (n.type === 'insulated') {
                g.lineStyle(2, COLORS.insulated);
                g.strokeCircle(n.x, n.y, NODE_RADIUS);
                g.fillStyle(COLORS.insulatedBody);
                g.fillCircle(n.x, n.y, NODE_RADIUS - 2);
                g.lineStyle(2, 0x555566);
                g.lineBetween(n.x - 8, n.y - 8, n.x + 8, n.y + 8);
                g.lineBetween(n.x + 8, n.y - 8, n.x - 8, n.y + 8);
                continue;
            }

            var bodyColor = n.type === 'rapid' ? COLORS.rapid : COLORS.nodeIdle;

            // Outer glow
            g.lineStyle(1, bodyColor, 0.3);
            g.strokeCircle(n.x, n.y, NODE_RADIUS + 4);

            // Node body
            g.fillStyle(0x0A1428);
            g.fillCircle(n.x, n.y, NODE_RADIUS);
            g.lineStyle(2, bodyColor);
            g.strokeCircle(n.x, n.y, NODE_RADIUS);

            // Inner core
            g.fillStyle(bodyColor, 0.6);
            g.fillCircle(n.x, n.y, 10);
            g.fillStyle(COLORS.white);
            g.fillCircle(n.x, n.y, 4);

            // Charge arc
            if (n.fill > 0.01) {
                var chargeColor = getChargeColor(n.fill);
                var arcAngle = n.fill * Math.PI * 2;
                g.lineStyle(3, chargeColor);
                g.beginPath();
                g.arc(n.x, n.y, NODE_RADIUS + 2, -Math.PI / 2, -Math.PI / 2 + arcAngle);
                g.strokePath();
            }

            // Danger pulsing
            if (n.fill >= 0.8) {
                var pulse = 0.5 + 0.5 * Math.sin(scene.time.now / 150);
                g.lineStyle(2, COLORS.critical, pulse);
                g.strokeCircle(n.x, n.y, NODE_RADIUS + 6);
            }

            // Rapid node jagged ring
            if (n.type === 'rapid') {
                g.lineStyle(1.5, COLORS.rapid, 0.5);
                Renderer.drawJaggedRing(g, n.x, n.y, NODE_RADIUS + 5, 8);
            }

            // Invisible ref for punch tween
            if (!n._gfxCircle) {
                n._gfxCircle = scene.add.circle(n.x, n.y, 1, 0x000000, 0).setDepth(-1);
            }
        }
    },

    drawJaggedRing: function(g, cx, cy, r, sides) {
        var pts = [];
        for (var i = 0; i <= sides; i++) {
            var a = (i / sides) * Math.PI * 2;
            var rr = (i % 2 === 0) ? r : r - 6;
            pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
        }
        for (var i = 0; i < pts.length - 1; i++) {
            g.lineBetween(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
        }
    },

    drawArcs: function(scene, delta) {
        scene.arcGraphics.clear();
        var alive = [];
        for (var a = 0; a < scene.activeArcs.length; a++) {
            var arc = scene.activeArcs[a];
            arc.age += delta;
            if (arc.age >= arc.maxAge) continue;
            alive.push(arc);
            var alpha = 1.0 - (arc.age / arc.maxAge);
            var lw = GameState.safeChain >= 5 ? 5 : 3;
            var color = GameState.safeChain >= 5 ? 0x00FFFF : COLORS.arc;

            for (var line = 0; line < 3; line++) {
                var midX = (arc.from.x + arc.to.x) / 2 + (Math.random() - 0.5) * 40;
                var midY = (arc.from.y + arc.to.y) / 2 + (Math.random() - 0.5) * 40;
                scene.arcGraphics.lineStyle(lw + 4, color, alpha * 0.2);
                scene.arcGraphics.lineBetween(arc.from.x, arc.from.y, midX, midY);
                scene.arcGraphics.lineBetween(midX, midY, arc.to.x, arc.to.y);
                scene.arcGraphics.lineStyle(lw, color, alpha);
                scene.arcGraphics.lineBetween(arc.from.x, arc.from.y, midX, midY);
                scene.arcGraphics.lineBetween(midX, midY, arc.to.x, arc.to.y);
            }
        }
        scene.activeArcs = alive;
    }
};
