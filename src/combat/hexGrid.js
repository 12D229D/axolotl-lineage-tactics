/**
 * Hexagonal Grid Math and Coordinate System (Axial coordinates q, r)
 * Supports aquatic water currents, mud tiles, obstacles, and distance calculations.
 */

export const HEX_RADIUS = 38;
export const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
export const HEX_HEIGHT = 2 * HEX_RADIUS;

export const BIOME_TILES = {
    WATER: 'WATER',         // Movimiento estándar, flujo
    CURRENT: 'CURRENT',     // Empuja a la criatura al terminar el movimiento
    MUD: 'MUD',             // Cuesta doble movimiento
    ALGAE: 'ALGAE',         // Cobertura vegetal (+defensa, regeneración leve)
    CORAL: 'CORAL',         // Obstáculo insalvable o cobertura dura
    DEEP: 'DEEP'            // Abismo de pantano, solo cruzable con aletas especiales
};

export class HexGrid {
    constructor(cols = 7, rows = 6) {
        this.cols = cols;
        this.rows = rows;
        this.cells = new Map(); // key: "q,r" -> HexCell
        this.initGrid();
    }

    initGrid() {
        for (let r = 0; r < this.rows; r++) {
            const rOffset = Math.floor(r / 2);
            for (let q = -rOffset; q < this.cols - rOffset; q++) {
                const cell = {
                    q,
                    r,
                    type: BIOME_TILES.WATER,
                    occupant: null,
                    highlight: null, // 'move', 'attack', 'aoe', null
                    currentDirection: null // 'N', 'S', 'E', 'W', etc.
                };
                this.cells.set(`${q},${r}`, cell);
            }
        }
    }

    getCell(q, r) {
        return this.cells.get(`${q},${r}`) || null;
    }

    getNeighbors(q, r) {
        const directions = [
            { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 }
        ];
        return directions
            .map(d => this.getCell(q + d.q, r + d.r))
            .filter(Boolean);
    }

    getDistance(c1, c2) {
        return (Math.abs(c1.q - c2.q) + Math.abs(c1.q + c1.r - c2.q - c2.r) + Math.abs(c1.r - c2.r)) / 2;
    }

    getReachableCells(startCell, maxDistance) {
        const reachable = [];
        for (const cell of this.cells.values()) {
            if (cell.type === BIOME_TILES.CORAL) continue;
            if (cell.occupant && cell !== startCell) continue;
            const dist = this.getDistance(startCell, cell);
            if (dist > 0 && dist <= maxDistance) {
                reachable.push(cell);
            }
        }
        return reachable;
    }

    getAttackTargets(startCell, range, isAllySquad = true) {
        const targets = [];
        for (const cell of this.cells.values()) {
            if (cell.occupant) {
                const dist = this.getDistance(startCell, cell);
                if (dist <= range && dist > 0) {
                    if (isAllySquad !== cell.occupant.isAlly) {
                        targets.push(cell);
                    }
                }
            }
        }
        return targets;
    }

    clearHighlights() {
        for (const cell of this.cells.values()) {
            cell.highlight = null;
        }
    }
}
