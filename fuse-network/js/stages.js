// stages.js - Network generation algorithm, difficulty scaling, fuse type assignment
const StageGenerator = {
    generate(stageNum, gameWidth, gameHeight) {
        const p = this._getDifficultyParams(stageNum);
        const isRest = stageNum % 10 === 0 && stageNum > 0;
        const isBoss = stageNum % 15 === 0 && stageNum > 0;
        if (isRest) { p.bombCount = Math.max(1, p.bombCount - 1); p.timer += 3; }
        if (isBoss) { p.burnSpeed *= 1.2; }
        const playTop = LAYOUT.HUD_HEIGHT + 20;
        const playBot = gameHeight - LAYOUT.BOTTOM_BAR - 20;
        const playH = playBot - playTop;
        const nodes = []; const edges = [];
        const base = { id: 0, x: gameWidth / 2, y: playBot - 30, type: 'base' };
        nodes.push(base);
        const bombs = this._placeBombs(p.bombCount, gameWidth, playTop, isBoss);
        bombs.forEach(b => { b.id = nodes.length; nodes.push(b); });
        const safeZones = this._placeSafeZones(gameWidth, playTop + 80, playBot - 100);
        safeZones.forEach(s => { s.id = nodes.length; nodes.push(s); });
        const intCount = Math.min(p.nodeCount - bombs.length - safeZones.length - 1, 10);
        const intermediates = this._placeIntermediateNodes(
            Math.max(2, intCount), gameWidth, playTop + 60, playBot - 80
        );
        intermediates.forEach(n => { n.id = nodes.length; nodes.push(n); });
        this._relaxLayout(nodes.filter(n => n.type === 'intermediate'), 3, gameWidth);
        const bombIds = bombs.map(b => b.id);
        const intIds = intermediates.map(n => n.id);
        this._buildPaths(nodes, edges, bombIds, base.id, intIds);
        this._addBranches(nodes, edges, intIds, p.density);
        this._connectSafeZones(nodes, edges, safeZones.map(s => s.id), intIds);
        this._assignFuseTypes(edges, stageNum, p);
        edges.forEach((e, i) => {
            const nA = nodes[e.from]; const nB = nodes[e.to];
            e.id = i;
            e.length = Math.sqrt((nA.x - nB.x) ** 2 + (nA.y - nB.y) ** 2);
            e.cut = false; e.cutProgress = -1;
        });
        return { nodes, edges, bombs: bombIds, base: base.id,
            safeZones: safeZones.map(s => s.id), params: p, isBoss, isRest };
    },

    _getDifficultyParams(s) {
        let bombCount, burnSpeed, timer, nodeCount, density;
        let fastChance = 0, delayedChance = 0, splitChance = 0;
        if (s <= 3) {
            bombCount = 1; burnSpeed = 60 + (s - 1) * 5; timer = 15;
            nodeCount = 4 + s; density = 1.3;
        } else if (s <= 8) {
            bombCount = 2; burnSpeed = 75 + (s - 3) * 5; timer = 13;
            nodeCount = 6 + Math.floor(s / 2); density = 1.3;
        } else if (s <= 15) {
            bombCount = 2; burnSpeed = 95 + (s - 8) * 4; timer = 12;
            nodeCount = 8 + Math.floor((s - 8) / 3); density = 1.5;
            fastChance = 0.2;
        } else if (s <= 25) {
            bombCount = 3; burnSpeed = 115 + (s - 15) * 3; timer = 10;
            nodeCount = 10 + Math.floor((s - 15) / 5); density = 1.5;
            fastChance = 0.35; delayedChance = 0.15;
        } else if (s <= 40) {
            bombCount = 3 + (s > 30 ? 1 : 0); burnSpeed = Math.min(155, 130 + (s - 25) * 2);
            timer = 9; nodeCount = Math.min(13, 11 + Math.floor((s - 25) / 7));
            density = 1.7; fastChance = 0.5; delayedChance = 0.3; splitChance = 0.2;
        } else {
            bombCount = Math.min(5, 4 + Math.floor((s - 40) / 10));
            burnSpeed = 160; timer = 8; nodeCount = 14; density = 1.7;
            fastChance = 0.5; delayedChance = 0.3; splitChance = 0.35;
        }
        return { bombCount, burnSpeed, timer, nodeCount: Math.min(14, nodeCount),
            density, fastChance, delayedChance, splitChance };
    },

    _placeBombs(count, gw, topY, isBoss) {
        const bombs = []; const spacing = gw / (count + 1);
        for (let i = 0; i < count; i++) {
            bombs.push({
                x: spacing * (i + 1) + (Math.random() - 0.5) * 40,
                y: topY + 20 + Math.random() * 40,
                type: 'bomb', isMega: isBoss && i === 0
            });
        }
        return bombs;
    },

    _placeSafeZones(gw, minY, maxY) {
        const zones = [];
        const leftY = minY + Math.random() * (maxY - minY);
        const rightY = minY + Math.random() * (maxY - minY);
        zones.push({ x: 25, y: leftY, type: 'safe' });
        zones.push({ x: gw - 25, y: rightY, type: 'safe' });
        return zones;
    },

    _placeIntermediateNodes(count, gw, minY, maxY) {
        const nodes = []; const margin = 40;
        const rows = Math.max(2, Math.ceil(count / 3));
        const rowH = (maxY - minY) / rows;
        let placed = 0;
        for (let r = 0; r < rows && placed < count; r++) {
            const cols = Math.min(3, count - placed);
            const colW = (gw - margin * 2) / (cols + 1);
            for (let c = 0; c < cols && placed < count; c++) {
                nodes.push({
                    x: margin + colW * (c + 1) + (Math.random() - 0.5) * 30,
                    y: minY + rowH * r + rowH / 2 + (Math.random() - 0.5) * 20,
                    type: 'intermediate'
                });
                placed++;
            }
        }
        return nodes;
    },

    _relaxLayout(nodes, iterations, gw) {
        for (let i = 0; i < iterations; i++) {
            for (let a = 0; a < nodes.length; a++) {
                for (let b = a + 1; b < nodes.length; b++) {
                    const dx = nodes[b].x - nodes[a].x;
                    const dy = nodes[b].y - nodes[a].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < GAME_CONFIG.NODE_MIN_DIST && dist > 0) {
                        const push = (GAME_CONFIG.NODE_MIN_DIST - dist) / 2 + 5;
                        const nx = (dx / dist) * push; const ny = (dy / dist) * push;
                        nodes[a].x -= nx; nodes[a].y -= ny;
                        nodes[b].x += nx; nodes[b].y += ny;
                    }
                }
                nodes[a].x = Math.max(40, Math.min(gw - 40, nodes[a].x));
            }
        }
    },

    _buildPaths(nodes, edges, bombIds, baseId, intIds) {
        const base = nodes[baseId];
        for (const bId of bombIds) {
            const bomb = nodes[bId];
            let current = bId;
            const visited = new Set([bId]);
            const sorted = [...intIds].sort((a, b) => {
                const na = nodes[a]; const nb = nodes[b];
                const da = Math.abs(na.y - base.y); const db = Math.abs(nb.y - base.y);
                return db - da;
            });
            let hops = 0; const maxHops = Math.min(sorted.length, 4);
            for (const nId of sorted) {
                if (hops >= maxHops) break;
                if (visited.has(nId)) continue;
                const cn = nodes[current]; const nn = nodes[nId];
                if (nn.y <= cn.y) continue;
                if (!this._hasEdge(edges, current, nId)) {
                    edges.push({ from: current, to: nId, fuseType: FUSE_TYPES.NORMAL });
                }
                visited.add(nId); current = nId; hops++;
            }
            if (!this._hasEdge(edges, current, baseId)) {
                edges.push({ from: current, to: baseId, fuseType: FUSE_TYPES.NORMAL });
            }
        }
    },

    _addBranches(nodes, edges, intIds, density) {
        const targetEdges = Math.floor(intIds.length * density);
        let attempts = 0;
        while (edges.length < targetEdges && attempts < 50) {
            const a = intIds[Math.floor(Math.random() * intIds.length)];
            const b = intIds[Math.floor(Math.random() * intIds.length)];
            if (a !== b && !this._hasEdge(edges, a, b)) {
                const na = nodes[a]; const nb = nodes[b];
                const dist = Math.sqrt((na.x - nb.x) ** 2 + (na.y - nb.y) ** 2);
                if (dist < 250) {
                    edges.push({ from: a, to: b, fuseType: FUSE_TYPES.NORMAL });
                }
            }
            attempts++;
        }
    },

    _connectSafeZones(nodes, edges, safeIds, intIds) {
        for (const sId of safeIds) {
            const sn = nodes[sId]; let bestDist = Infinity; let bestId = -1;
            for (const iId of intIds) {
                const n = nodes[iId];
                const dist = Math.sqrt((sn.x - n.x) ** 2 + (sn.y - n.y) ** 2);
                if (dist < bestDist) { bestDist = dist; bestId = iId; }
            }
            if (bestId >= 0 && !this._hasEdge(edges, sId, bestId)) {
                edges.push({ from: bestId, to: sId, fuseType: FUSE_TYPES.NORMAL });
            }
        }
    },

    _assignFuseTypes(edges, stageNum, p) {
        for (const e of edges) {
            const r = Math.random();
            if (r < p.splitChance) e.fuseType = FUSE_TYPES.SPLIT;
            else if (r < p.splitChance + p.delayedChance) e.fuseType = FUSE_TYPES.DELAYED;
            else if (r < p.splitChance + p.delayedChance + p.fastChance) e.fuseType = FUSE_TYPES.FAST;
            else e.fuseType = FUSE_TYPES.NORMAL;
        }
    },

    _hasEdge(edges, a, b) {
        return edges.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    },

    getEdgesFrom(edges, nodeId) {
        return edges.filter(e => e.from === nodeId || e.to === nodeId);
    }
};
