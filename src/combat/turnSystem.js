/**
 * Turn-Based Tactical Combat System
 * Coordinates initiative order (speed-based), action points, and event logging.
 */
import { HexGrid, BIOME_TILES } from './hexGrid.js';
import { SwampEnemyAI } from './ai.js';
import { getAbilitiesForElement } from './abilities.js';

export class TurnSystem {
    constructor(playerSquad, enemyUnits, onCombatEnd, onLog) {
        this.playerSquad = playerSquad.map(axo => ({
            ...axo,
            isAlly: true,
            hasActed: false
        }));
        this.enemyUnits = enemyUnits.map(ene => ({
            ...ene,
            isAlly: false,
            hasActed: false
        }));
        this.onCombatEnd = onCombatEnd;
        this.onLog = onLog || console.log;

        this.grid = new HexGrid(7, 6);
        this.activeUnitIndex = 0;
        this.round = 1;
        this.phase = 'PLAYER_SELECTION'; // 'PLAYER_SELECTION', 'ENEMY_TURN', 'VICTORY', 'DEFEAT'
        this.selectedUnit = null;

        this.setupBoard();
    }

    setupBoard() {
        // Asignar celdas con corrientes y fango procedural
        const cells = Array.from(this.grid.cells.values());
        cells[8].type = BIOME_TILES.MUD;
        cells[14].type = BIOME_TILES.CURRENT;
        cells[20].type = BIOME_TILES.ALGAE;
        cells[12].type = BIOME_TILES.CORAL;

        // Posicionar aliados a la izquierda (q bajos)
        const leftCells = cells.filter(c => c.q <= 0 && c.type !== BIOME_TILES.CORAL);
        this.playerSquad.forEach((axo, i) => {
            if (leftCells[i]) {
                leftCells[i].occupant = axo;
                axo.cell = leftCells[i];
            }
        });

        // Posicionar enemigos a la derecha
        const rightCells = cells.filter(c => c.q >= 3 && c.type !== BIOME_TILES.CORAL);
        this.enemyUnits.forEach((ene, i) => {
            if (rightCells[i]) {
                rightCells[i].occupant = ene;
                ene.cell = rightCells[i];
            }
        });

        // Auto-seleccionar primer aliado vivo
        this.selectedUnit = this.playerSquad.find(u => u.stats.currentHp > 0) || null;
        this.onLog(`¡Comienza el encuentro! Ronda ${this.round}.`);
    }

    getAllUnits() {
        return [...this.playerSquad, ...this.enemyUnits];
    }

    selectUnit(unit) {
        if (!unit || !unit.isAlly || unit.stats.currentHp <= 0) return;
        this.selectedUnit = unit;
        this.refreshHighlights();
    }

    refreshHighlights() {
        this.grid.clearHighlights();
        if (!this.selectedUnit || this.selectedUnit.hasActed) return;

        // Resaltar celdas de movimiento alcanzables (rango 2)
        const moves = this.grid.getReachableCells(this.selectedUnit.cell, 2);
        moves.forEach(c => c.highlight = 'move');

        // Resaltar posibles ataques normales (rango 1 adyacente)
        const attacks = this.grid.getAttackTargets(this.selectedUnit.cell, 1, true);
        attacks.forEach(c => c.highlight = 'attack');
    }

    moveSelectedUnit(targetCell) {
        if (!this.selectedUnit || this.selectedUnit.hasActed) return false;
        if (targetCell.occupant || targetCell.type === BIOME_TILES.CORAL) return false;

        const reachable = this.grid.getReachableCells(this.selectedUnit.cell, 2);
        if (!reachable.includes(targetCell)) return false;

        // Mover
        this.selectedUnit.cell.occupant = null;
        targetCell.occupant = this.selectedUnit;
        this.selectedUnit.cell = targetCell;

        // Efecto de corriente
        if (targetCell.type === BIOME_TILES.CURRENT) {
            const neighbors = this.grid.getNeighbors(targetCell.q, targetCell.r).filter(n => !n.occupant && n.type !== BIOME_TILES.CORAL);
            if (neighbors.length > 0) {
                targetCell.occupant = null;
                neighbors[0].occupant = this.selectedUnit;
                this.selectedUnit.cell = neighbors[0];
                this.onLog(`🌊 La corriente arrastró a ${this.selectedUnit.name}!`);
            }
        }

        this.onLog(`${this.selectedUnit.name} se desplazó por la charca.`);
        this.refreshHighlights();
        return true;
    }

    basicAttack(targetUnit) {
        if (!this.selectedUnit || this.selectedUnit.hasActed) return false;
        if (!targetUnit || targetUnit.isAlly || targetUnit.stats.currentHp <= 0) return false;

        const dist = this.grid.getDistance(this.selectedUnit.cell, targetUnit.cell);
        if (dist > 1) return false;

        const rawDmg = Math.max(4, this.selectedUnit.stats.attack - targetUnit.stats.defense * 0.4);
        const dmg = Math.round(rawDmg);
        targetUnit.stats.currentHp = Math.max(0, targetUnit.stats.currentHp - dmg);

        this.onLog(`💥 ${this.selectedUnit.name} atacó a ${targetUnit.name} infligiendo ${dmg} daño.`);
        if (targetUnit.stats.currentHp === 0) {
            targetUnit.cell.occupant = null;
            this.selectedUnit.kills = (this.selectedUnit.kills || 0) + 1;
            this.onLog(`☠️ ${targetUnit.name} ha sido derrotado!`);
        }

        this.selectedUnit.hasActed = true;
        this.grid.clearHighlights();
        this.checkVictoryOrDefeat();
        this.checkRoundProgression();
        return true;
    }

    useAbility(abilityId, targetUnit) {
        if (!this.selectedUnit || this.selectedUnit.hasActed) return false;
        const abilities = getAbilitiesForElement(this.selectedUnit.element);
        const ability = abilities.find(a => a.id === abilityId);
        if (!ability) return false;

        if (this.selectedUnit.stats.energy < ability.cost) {
            this.onLog(`⚠️ ${this.selectedUnit.name} no tiene suficiente energía (${ability.cost} req).`);
            return false;
        }

        const dist = this.grid.getDistance(this.selectedUnit.cell, targetUnit.cell);
        if (dist > ability.range) {
            this.onLog(`⚠️ Objetivo fuera de alcance (${ability.range} máx).`);
            return false;
        }

        this.selectedUnit.stats.energy -= ability.cost;
        const res = ability.execute(this.selectedUnit, targetUnit);
        this.onLog(`✨ ${res.text}`);

        if (targetUnit.stats.currentHp === 0) {
            targetUnit.cell.occupant = null;
            this.selectedUnit.kills = (this.selectedUnit.kills || 0) + 1;
            this.onLog(`☠️ ${targetUnit.name} ha sido derrotado!`);
        }

        this.selectedUnit.hasActed = true;
        this.grid.clearHighlights();
        this.checkVictoryOrDefeat();
        this.checkRoundProgression();
        return true;
    }

    passTurn() {
        if (this.selectedUnit) {
            this.selectedUnit.hasActed = true;
            this.onLog(`⏩ ${this.selectedUnit.name} pasó su turno.`);
        }
        this.grid.clearHighlights();
        this.checkRoundProgression();
    }

    checkRoundProgression() {
        const activeAllies = this.playerSquad.filter(u => u.stats.currentHp > 0);
        const allActed = activeAllies.every(u => u.hasActed);

        if (allActed && this.phase !== 'VICTORY' && this.phase !== 'DEFEAT') {
            this.executeEnemyTurns();
        } else {
            // Seleccionar el siguiente aliado disponible
            const nextAlly = activeAllies.find(u => !u.hasActed);
            if (nextAlly) {
                this.selectUnit(nextAlly);
            }
        }
    }

    executeEnemyTurns() {
        this.phase = 'ENEMY_TURN';
        this.onLog(`--- Turno de los Depredadores de Pantano ---`);

        const aliveEnemies = this.enemyUnits.filter(e => e.stats.currentHp > 0);

        for (const enemy of aliveEnemies) {
            const decision = SwampEnemyAI.decideAction(enemy, this.grid, this.getAllUnits());
            if (!decision) continue;

            if (decision.action === 'MOVE') {
                decision.fromCell.occupant = null;
                decision.toCell.occupant = enemy;
                enemy.cell = decision.toCell;
                this.onLog(`🦎 ${enemy.name} se arrastra por el lodo.`);
            } else if (decision.action === 'ATTACK') {
                const rawDmg = Math.max(3, enemy.stats.attack - decision.target.stats.defense * 0.5);
                const dmg = Math.round(rawDmg);
                decision.target.stats.currentHp = Math.max(0, decision.target.stats.currentHp - dmg);
                this.onLog(`🩸 ${enemy.name} muerde con ferocidad a ${decision.target.name} causándole ${dmg} daño.`);

                if (decision.target.stats.currentHp === 0) {
                    decision.target.cell.occupant = null;
                    decision.target.is_alive = false;
                    this.onLog(`💀 ¡${decision.target.name} ha caído en combate!`);
                }
            }
        }

        this.checkVictoryOrDefeat();

        if (this.phase !== 'VICTORY' && this.phase !== 'DEFEAT') {
            // Iniciar nueva ronda aliada
            this.round++;
            this.phase = 'PLAYER_SELECTION';
            this.playerSquad.forEach(u => {
                if (u.stats.currentHp > 0) {
                    u.hasActed = false;
                    u.stats.energy = Math.min(u.stats.maxEnergy, u.stats.energy + 2);
                    // Regeneración pasiva de agallas
                    u.stats.currentHp = Math.min(u.stats.maxHp, u.stats.currentHp + (u.stats.regenPerTurn || 3));
                }
            });
            this.enemyUnits.forEach(e => e.hasActed = false);

            this.selectedUnit = this.playerSquad.find(u => u.stats.currentHp > 0) || null;
            this.refreshHighlights();
            this.onLog(`=== Ronda ${this.round} ===`);
        }
    }

    checkVictoryOrDefeat() {
        const aliveEnemies = this.enemyUnits.filter(e => e.stats.currentHp > 0);
        const aliveAllies = this.playerSquad.filter(u => u.stats.currentHp > 0);

        if (aliveEnemies.length === 0) {
            this.phase = 'VICTORY';
            this.onLog(`🏆 ¡VICTORIA! Los depredadores del pantano han sido repelidos.`);
            if (this.onCombatEnd) this.onCombatEnd('VICTORY');
        } else if (aliveAllies.length === 0) {
            this.phase = 'DEFEAT';
            this.onLog(`💀 DERROTA: Todo tu escuadrón ha sucumbido a las profundidades.`);
            if (this.onCombatEnd) this.onCombatEnd('DEFEAT');
        }
    }
}
