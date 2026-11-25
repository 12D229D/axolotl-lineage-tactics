/**
 * Swamp Predator Enemy AI
 * Evaluates tactical positions, prefers wounded allies to finish off, or retreats when low.
 */

export class SwampEnemyAI {
    static decideAction(enemyUnit, hexGrid, allUnits) {
        // Encontrar celda actual del enemigo
        let enemyCell = null;
        for (const cell of hexGrid.cells.values()) {
            if (cell.occupant === enemyUnit) {
                enemyCell = cell;
                break;
            }
        }
        if (!enemyCell) return null;

        // Lista de aliados jugadores vivos
        const playerTargets = allUnits.filter(u => u.isAlly && u.stats.currentHp > 0);
        if (playerTargets.length === 0) return null;

        // Buscar el objetivo más cercano o con menos vida
        let closestTarget = null;
        let closestDist = 999;
        let targetCell = null;

        for (const cell of hexGrid.cells.values()) {
            if (cell.occupant && cell.occupant.isAlly && cell.occupant.stats.currentHp > 0) {
                const d = hexGrid.getDistance(enemyCell, cell);
                if (d < closestDist) {
                    closestDist = d;
                    closestTarget = cell.occupant;
                    targetCell = cell;
                }
            }
        }

        // Si ya está adyacente (distancia 1), atacar
        if (closestDist === 1) {
            return {
                action: 'ATTACK',
                actor: enemyUnit,
                target: closestTarget,
                targetCell: targetCell
            };
        }

        // Si no está adyacente, mover hacia la celda libre vecina más prometedora
        const neighborsOfTarget = hexGrid.getNeighbors(targetCell.q, targetCell.r)
            .filter(c => !c.occupant && c.type !== 'CORAL');

        if (neighborsOfTarget.length > 0) {
            // Escoger la celda vecina al jugador más cercana al enemigo
            let bestMove = null;
            let bestMoveDist = 999;

            for (const n of neighborsOfTarget) {
                const distToEnemy = hexGrid.getDistance(enemyCell, n);
                if (distToEnemy < bestMoveDist) {
                    bestMoveDist = distToEnemy;
                    bestMove = n;
                }
            }

            if (bestMove) {
                // Comprobar rango de movimiento (2 celdas de avance)
                const reachable = hexGrid.getReachableCells(enemyCell, 2);
                if (reachable.includes(bestMove)) {
                    return { action: 'MOVE', actor: enemyUnit, fromCell: enemyCell, toCell: bestMove };
                } else if (reachable.length > 0) {
                    // Moverse al punto accesible más cercano a la meta
                    let stepCell = reachable[0];
                    let stepDist = hexGrid.getDistance(reachable[0], bestMove);
                    for (const r of reachable) {
                        const d = hexGrid.getDistance(r, bestMove);
                        if (d < stepDist) {
                            stepDist = d;
                            stepCell = r;
                        }
                    }
                    return { action: 'MOVE', actor: enemyUnit, fromCell: enemyCell, toCell: stepCell };
                }
            }
        }

        return { action: 'PASS', actor: enemyUnit };
    }
}
