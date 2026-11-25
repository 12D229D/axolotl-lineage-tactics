/**
 * Main Game Controller for Axolotl Lineage Tactics
 * Orchestrates Game Loop, SQLite Relational Storage, Genetic Breeding,
 * Tactical Hexagonal Combat, Roguelite Map, and Genealogical Museum.
 */

import { dbService } from './storage/sqlite.js';
import { SceneManager } from './sceneManager.js';
import { generateRandomGenome, calculateStatsFromGenome, generateAxolotlName } from './genetics/genome.js';
import { breedAxolotls } from './genetics/breeding.js';
import { renderAxolotlSVG } from './render/creatureSvg.js';
import { HexRenderer } from './render/hexRender.js';
import { TurnSystem } from './combat/turnSystem.js';
import { LineageTreeUI } from './ui/lineageTree.js';
import { TacticalHUD } from './ui/hud.js';

class AxolotlTacticsGame {
    constructor() {
        this.sceneManager = new SceneManager();
        this.activeLineage = null;
        this.axolotls = [];
        this.dnaPoints = 150;
        this.currentExpedition = null;
        this.turnSystem = null;
        this.hexRenderer = null;

        // Progenitores seleccionados para cruce
        this.parent1 = null;
        this.parent2 = null;

        // UI Helpers
        this.hud = null;
    }

    async init() {
        await dbService.init();
        this.activeLineage = dbService.getActiveLineage();
        this.loadAxolotls();

        // Si no hay ajolotes vivos, generar los 3 fundadores iniciales
        if (this.axolotls.length === 0) {
            this.seedGenesisAxolotls();
        }

        this.setupNavigation();
        this.setupScenes();
        this.setupPondScene();
        this.setupBreedingScene();
        this.setupExpeditionScene();
        this.setupCombatScene();
        this.setupLineageScene();
        this.updateHeaderStats();

        // Arrancar en la Charca
        this.sceneManager.switchScene('POND');
    }

    loadAxolotls() {
        this.axolotls = dbService.getAxolotls(this.activeLineage.id).map(record => dbService.formatAxolotl(record));
    }

    seedGenesisAxolotls() {
        const elements = ['water', 'swamp', 'biolum'];
        for (let i = 0; i < 3; i++) {
            const genome = generateRandomGenome(Date.now() + i * 37);
            const stats = calculateStatsFromGenome(genome);
            const axo = {
                id: 'axo_gen1_' + Math.random().toString(36).substring(2, 7),
                lineage_id: this.activeLineage.id,
                name: generateAxolotlName(Date.now() + i * 99),
                generation: 1,
                parent1_id: null,
                parent2_id: null,
                genome,
                stats,
                element: genome.element.expressed,
                is_alive: true,
                in_squad: i < 2, // 2 en la escuadra inicial
                expeditions_completed: 0,
                kills: 0,
                created_at: new Date().toISOString()
            };
            dbService.saveAxolotl(axo);
        }
        this.loadAxolotls();
    }

    updateHeaderStats() {
        const dnaEl = document.getElementById('dna-points-display');
        if (dnaEl) dnaEl.textContent = this.dnaPoints;

        const squadCountEl = document.getElementById('squad-count-display');
        const squad = this.axolotls.filter(a => a.in_squad && a.is_alive);
        if (squadCountEl) squadCountEl.textContent = `${squad.length}/4`;
    }

    setupNavigation() {
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetScene = btn.getAttribute('data-scene');
                this.sceneManager.switchScene(targetScene);
            });
        });

        this.sceneManager.onSceneChange((sceneName) => {
            document.querySelectorAll('.nav-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-scene') === sceneName);
            });
        });

        // Quick button to expedition
        const quickExpBtn = document.getElementById('btn-start-expedition-quick');
        if (quickExpBtn) {
            quickExpBtn.onclick = () => this.sceneManager.switchScene('EXPEDITION');
        }

        // Spawn founder
        const spawnFounderBtn = document.getElementById('btn-spawn-founder');
        if (spawnFounderBtn) {
            spawnFounderBtn.onclick = () => {
                if (this.dnaPoints < 30) {
                    alert('Necesitas al menos 30 puntos de ADN para rescatar un ejemplar silvestre.');
                    return;
                }
                this.dnaPoints -= 30;
                const genome = generateRandomGenome();
                const stats = calculateStatsFromGenome(genome);
                const axo = {
                    id: 'axo_wild_' + Math.random().toString(36).substring(2, 7),
                    lineage_id: this.activeLineage.id,
                    name: generateAxolotlName(),
                    generation: 1,
                    parent1_id: null,
                    parent2_id: null,
                    genome,
                    stats,
                    element: genome.element.expressed,
                    is_alive: true,
                    in_squad: false,
                    expeditions_completed: 0,
                    kills: 0,
                    created_at: new Date().toISOString()
                };
                dbService.saveAxolotl(axo);
                this.loadAxolotls();
                this.renderPondCards();
                this.updateHeaderStats();
            };
        }
    }

    setupScenes() {
        this.sceneManager.registerScene('POND', document.getElementById('scene-pond'), () => {
            this.renderPondCards();
        });

        this.sceneManager.registerScene('BREEDING', document.getElementById('scene-breeding'), () => {
            this.renderBreedingSelection();
        });

        this.sceneManager.registerScene('EXPEDITION', document.getElementById('scene-expedition'), () => {
            this.renderExpeditionView();
        });

        this.sceneManager.registerScene('COMBAT', document.getElementById('scene-combat'), () => {
            this.initCombatEncounter();
        });

        this.sceneManager.registerScene('LINEAGE', document.getElementById('scene-lineage'), () => {
            this.renderLineageTree();
        });
    }

    /* ----------------------------------------------------
       1. Escena de la Charca
    ---------------------------------------------------- */
    setupPondScene() {
        this.renderPondCards();
    }

    renderPondCards() {
        const grid = document.getElementById('pond-axolotl-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.axolotls.forEach(axo => {
            const card = document.createElement('div');
            card.className = `axolotl-card ${axo.in_squad ? 'squad-member' : ''}`;
            card.innerHTML = `
                ${axo.in_squad ? '<div class="squad-badge">⚔️ Escuadra</div>' : ''}
                <div class="axolotl-card-svg">${renderAxolotlSVG(axo, 140)}</div>
                <h3 class="axolotl-card-name">${axo.name}</h3>
                <span class="axolotl-element-badge ${axo.element}">${axo.element}</span>
                <div class="axolotl-stats-mini">
                    <span>❤️ ${axo.stats.maxHp}</span>
                    <span>⚔️ ${axo.stats.attack}</span>
                    <span>🛡️ ${axo.stats.defense}</span>
                    <span>⚡ ${axo.stats.speed}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-secondary btn-inspect">Inspeccionar</button>
                    <button class="btn-primary btn-toggle-squad">
                        ${axo.in_squad ? 'Retirar' : 'A Escuadra'}
                    </button>
                </div>
            `;

            // Botón Inspeccionar
            card.querySelector('.btn-inspect').onclick = () => this.showAxolotlModal(axo);

            // Botón Alternar Escuadra
            card.querySelector('.btn-toggle-squad').onclick = () => {
                const currentSquad = this.axolotls.filter(a => a.in_squad && a.is_alive);
                if (!axo.in_squad && currentSquad.length >= 4) {
                    alert('La escuadra ya tiene el máximo permitido de 4 ajolotes.');
                    return;
                }
                axo.in_squad = !axo.in_squad;
                dbService.saveAxolotl(axo);
                this.updateHeaderStats();
                this.renderPondCards();
            };

            grid.appendChild(card);
        });
    }

    showAxolotlModal(axo) {
        const modal = document.getElementById('axolotl-modal');
        const modalBody = document.getElementById('modal-body');
        const closeBtn = document.getElementById('modal-close');

        const g = axo.genome;
        modalBody.innerHTML = `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem;">
                ${renderAxolotlSVG(axo, 130)}
                <div>
                    <h2 style="font-family: var(--font-heading); color: var(--color-axolotl-cyan);">${axo.name}</h2>
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">Generación ${axo.generation} | ${axo.element.toUpperCase()}</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem;">Factor de Vitalidad: <b>×${g.vitalityFactor}</b></p>
                    <p style="font-size: 0.85rem;">Aura Mística: <b>${g.magicAura ? 'Despertada ✨' : 'Inerte'}</b></p>
                </div>
            </div>
            <div style="background: hsla(205, 45%, 10%, 0.6); padding: 1rem; border-radius: 8px; font-size: 0.85rem;">
                <h4 style="margin-bottom: 0.5rem; color: var(--color-axolotl-pink);">Alelos y Genotipo:</h4>
                <ul style="list-style: none; padding-left: 0; line-height: 1.6;">
                    <li>🧬 <b>Piel:</b> ${g.skinColor.expressed} (${g.skinColor.allele1} / ${g.skinColor.allele2})</li>
                    <li>🪶 <b>Branquias:</b> ${g.gills.expressed}</li>
                    <li>⚡ <b>Elemento:</b> ${g.element.expressed}</li>
                    <li>🐟 <b>Cola:</b> ${g.tail.expressed}</li>
                    <li>👁️ <b>Ojos:</b> ${g.eyes.expressed}</li>
                </ul>
            </div>
        `;

        modal.classList.add('active');
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    }

    /* ----------------------------------------------------
       2. Escena de Cruzamiento Genético (Breeding)
    ---------------------------------------------------- */
    setupBreedingScene() {
        const breedBtn = document.getElementById('btn-execute-breeding');
        if (breedBtn) {
            breedBtn.onclick = () => this.executeBreeding();
        }
    }

    renderBreedingSelection() {
        const grid = document.getElementById('breeding-candidates-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.axolotls.forEach(axo => {
            const card = document.createElement('div');
            card.className = 'axolotl-card';
            card.innerHTML = `
                <div class="axolotl-card-svg">${renderAxolotlSVG(axo, 90)}</div>
                <h4 style="font-size: 1rem;">${axo.name} (Gen ${axo.generation})</h4>
                <div class="card-actions" style="margin-top: 0.5rem;">
                    <button class="btn-secondary btn-pick-p1">Como Madre</button>
                    <button class="btn-secondary btn-pick-p2">Como Padre</button>
                </div>
            `;

            card.querySelector('.btn-pick-p1').onclick = () => {
                this.parent1 = axo;
                this.updateBreedingSlots();
            };
            card.querySelector('.btn-pick-p2').onclick = () => {
                this.parent2 = axo;
                this.updateBreedingSlots();
            };

            grid.appendChild(card);
        });

        this.updateBreedingSlots();
    }

    updateBreedingSlots() {
        const s1 = document.getElementById('parent-slot-1');
        const s2 = document.getElementById('parent-slot-2');
        const btn = document.getElementById('btn-execute-breeding');

        if (this.parent1) {
            s1.innerHTML = `
                ${renderAxolotlSVG(this.parent1, 100)}
                <p><b>${this.parent1.name}</b></p>
                <small style="color: var(--color-axolotl-cyan);">Gen ${this.parent1.generation} - ${this.parent1.element}</small>
            `;
            s1.classList.add('selected');
        } else {
            s1.innerHTML = `<span style="font-size: 2rem;">🦎</span><p><b>Madre / Progenitor 1</b></p>`;
            s1.classList.remove('selected');
        }

        if (this.parent2) {
            s2.innerHTML = `
                ${renderAxolotlSVG(this.parent2, 100)}
                <p><b>${this.parent2.name}</b></p>
                <small style="color: var(--color-axolotl-pink);">Gen ${this.parent2.generation} - ${this.parent2.element}</small>
            `;
            s2.classList.add('selected');
        } else {
            s2.innerHTML = `<span style="font-size: 2rem;">🦎</span><p><b>Padre / Progenitor 2</b></p>`;
            s2.classList.remove('selected');
        }

        const canBreed = this.parent1 && this.parent2 && this.parent1.id !== this.parent2.id && this.dnaPoints >= 40;
        if (btn) btn.disabled = !canBreed;
    }

    executeBreeding() {
        if (!this.parent1 || !this.parent2 || this.parent1.id === this.parent2.id) {
            alert('Debes seleccionar dos ejemplares distintos para el cruce.');
            return;
        }
        if (this.dnaPoints < 40) {
            alert('Necesitas al menos 40 puntos de ADN para cruzar.');
            return;
        }

        this.dnaPoints -= 40;
        const offspring = breedAxolotls(this.parent1, this.parent2);
        dbService.saveAxolotl(offspring);
        this.loadAxolotls();
        this.updateHeaderStats();

        // Mostrar registro de mutaciones
        const logPanel = document.getElementById('breeding-result-log');
        const logText = document.getElementById('mutation-log-text');
        logPanel.style.display = 'block';

        let logContent = `<p>✨ ¡Ha nacido <b>${offspring.name}</b> (Generación ${offspring.generation})!</p>`;
        if (offspring.mutationLog && offspring.mutationLog.length > 0) {
            logContent += `<p style="color: var(--color-axolotl-gold); margin-top: 0.5rem;">⚠️ Mutaciones espontáneas detectadas:</p><ul>`;
            offspring.mutationLog.forEach(m => logContent += `<li>${m}</li>`);
            logContent += `</ul>`;
        } else {
            logContent += `<p style="color: var(--color-text-muted);">Segregación mendeliana estándar sin aberraciones genéticas.</p>`;
        }
        logText.innerHTML = logContent;

        // Reset progenitores
        this.parent1 = null;
        this.parent2 = null;
        this.updateBreedingSlots();
        this.renderBreedingSelection();
    }

    /* ----------------------------------------------------
       3. Escena de Expedición Roguelite
    ---------------------------------------------------- */
    setupExpeditionScene() {
        const engageBtn = document.getElementById('btn-engage-combat');
        if (engageBtn) {
            engageBtn.onclick = () => {
                const squad = this.axolotls.filter(a => a.in_squad && a.is_alive);
                if (squad.length === 0) {
                    alert('Asigna al menos 1 ajolote vivo a tu escuadra antes de aventurarte.');
                    return;
                }
                this.sceneManager.switchScene('COMBAT');
            };
        }
    }

    renderExpeditionView() {
        if (!this.currentExpedition) {
            this.currentExpedition = {
                id: 'exp_' + Math.random().toString(36).substring(2, 7),
                lineage_id: this.activeLineage.id,
                biom_name: 'Laguna de Loto Eléctrico',
                seed: 'AXO-' + Math.floor(Math.random() * 900 + 100),
                nodes_cleared: 0,
                total_nodes: 4,
                loot_dna_points: 0,
                status: 'IN_PROGRESS'
            };
        }

        const seedDisplay = document.getElementById('expedition-seed-display');
        if (seedDisplay) seedDisplay.textContent = this.currentExpedition.seed;

        // Actualizar visual de nodos
        for (let i = 1; i <= 4; i++) {
            const nodeEl = document.getElementById(`node-${i}`);
            const lineEl = document.getElementById(`line-${i - 1}`);
            if (nodeEl) {
                nodeEl.classList.toggle('completed', i <= this.currentExpedition.nodes_cleared);
                nodeEl.classList.toggle('current', i === this.currentExpedition.nodes_cleared + 1);
            }
            if (lineEl) {
                lineEl.classList.toggle('completed', i <= this.currentExpedition.nodes_cleared);
            }
        }
    }

    /* ----------------------------------------------------
       4. Escena de Combate Táctico Hexagonal
    ---------------------------------------------------- */
    setupCombatScene() {
        const canvas = document.getElementById('combat-hex-canvas');
        if (!canvas) return;

        this.hud = new TacticalHUD({
            selectedUnitCard: document.getElementById('hud-selected-unit'),
            actionButtons: document.getElementById('hud-unit-actions'),
            battleLog: document.getElementById('combat-battle-log'),
            roundCounter: document.getElementById('combat-round-counter')
        });

        // Interacción con la cuadrícula hexagonal vía Canvas
        canvas.addEventListener('click', (e) => {
            if (!this.turnSystem || !this.hexRenderer) return;

            const rect = canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            const hexCoord = this.hexRenderer.pixelToHex(px, py);
            const clickedCell = this.turnSystem.grid.getCell(hexCoord.q, hexCoord.r);
            if (!clickedCell) return;

            // Si la celda tiene un aliado, seleccionarlo
            if (clickedCell.occupant && clickedCell.occupant.isAlly) {
                this.turnSystem.selectUnit(clickedCell.occupant);
                this.updateCombatHUD();
                this.hexRenderer.render(this.turnSystem.selectedUnit);
                return;
            }

            // Si es celda de movimiento
            if (clickedCell.highlight === 'move') {
                this.turnSystem.moveSelectedUnit(clickedCell);
                this.updateCombatHUD();
                this.hexRenderer.render(this.turnSystem.selectedUnit);
                return;
            }

            // Si es celda de ataque enemigo
            if (clickedCell.highlight === 'attack' && clickedCell.occupant && !clickedCell.occupant.isAlly) {
                this.turnSystem.basicAttack(clickedCell.occupant);
                this.updateCombatHUD();
                this.hexRenderer.render(this.turnSystem.selectedUnit);
                return;
            }
        });
    }

    initCombatEncounter() {
        const squad = this.axolotls.filter(a => a.in_squad && a.is_alive);
        if (squad.length === 0) {
            alert('¡No tienes escuadra para combatir!');
            this.sceneManager.switchScene('POND');
            return;
        }

        // Crear enemigos según el nodo
        const enemyCount = Math.min(4, Math.max(2, (this.currentExpedition?.nodes_cleared || 0) + 2));
        const enemyUnits = [];
        const enemyNames = ['Cangrejo del Fango', 'Garza Voraz', 'Anguila Lodosa', 'Sanguijuela Abisal'];

        for (let i = 0; i < enemyCount; i++) {
            enemyUnits.push({
                id: 'ene_' + i,
                name: enemyNames[i % enemyNames.length],
                stats: {
                    maxHp: 45 + i * 10,
                    currentHp: 45 + i * 10,
                    attack: 12 + i * 2,
                    defense: 4 + i,
                    speed: 8 + i,
                    energy: 3,
                    maxEnergy: 3
                }
            });
        }

        const canvas = document.getElementById('combat-hex-canvas');
        this.hud.clearLog();

        this.turnSystem = new TurnSystem(
            squad,
            enemyUnits,
            (outcome) => this.handleCombatResolution(outcome),
            (msg) => this.hud.addLog(msg)
        );

        this.hexRenderer = new HexRenderer(canvas, this.turnSystem.grid);
        this.updateCombatHUD();
        this.hexRenderer.render(this.turnSystem.selectedUnit);
    }

    updateCombatHUD() {
        if (!this.hud || !this.turnSystem) return;

        this.hud.updateRound(this.turnSystem.round);
        this.hud.updateSelectedUnit(
            this.turnSystem.selectedUnit,
            // On basic attack
            () => {
                const target = this.turnSystem.enemyUnits.find(e => {
                    return e.stats.currentHp > 0 && this.turnSystem.grid.getDistance(this.turnSystem.selectedUnit.cell, e.cell) === 1;
                });
                if (target) {
                    this.turnSystem.basicAttack(target);
                    this.updateCombatHUD();
                    this.hexRenderer.render(this.turnSystem.selectedUnit);
                } else {
                    this.hud.addLog('⚠️ No hay enemigo adyacente para atacar.');
                }
            },
            // On ability
            (abilityId) => {
                const target = this.turnSystem.enemyUnits.find(e => {
                    return e.stats.currentHp > 0 && this.turnSystem.grid.getDistance(this.turnSystem.selectedUnit.cell, e.cell) <= 2;
                }) || this.turnSystem.selectedUnit; // Si es curación, a sí mismo o aliado
                if (target) {
                    this.turnSystem.useAbility(abilityId, target);
                    this.updateCombatHUD();
                    this.hexRenderer.render(this.turnSystem.selectedUnit);
                }
            },
            // On pass
            () => {
                this.turnSystem.passTurn();
                this.updateCombatHUD();
                this.hexRenderer.render(this.turnSystem.selectedUnit);
            }
        );
    }

    handleCombatResolution(outcome) {
        if (outcome === 'VICTORY') {
            const rewardDna = 45;
            this.dnaPoints += rewardDna;
            if (this.currentExpedition) {
                this.currentExpedition.nodes_cleared++;
                this.currentExpedition.loot_dna_points += rewardDna;
            }
            // Sincronizar victorias en BD
            this.turnSystem.playerSquad.forEach(ally => {
                const original = this.axolotls.find(a => a.id === ally.id);
                if (original) {
                    original.expeditions_completed = (original.expeditions_completed || 0) + 1;
                    original.kills = (original.kills || 0) + (ally.kills || 0);
                    dbService.saveAxolotl(original);
                }
            });

            setTimeout(() => {
                alert(`🎉 ¡Victoria en el combate! Has ganado +${rewardDna} Puntos de ADN.`);
                if (this.currentExpedition.nodes_cleared >= this.currentExpedition.total_nodes) {
                    alert('🏆 ¡Expedición Completada! Regresas con gloria a tu charca.');
                    this.currentExpedition = null;
                    this.sceneManager.switchScene('POND');
                } else {
                    this.sceneManager.switchScene('EXPEDITION');
                }
                this.updateHeaderStats();
            }, 1200);
        } else {
            setTimeout(() => {
                alert('💀 Tu escuadra ha sido derrotada. Regresas con las manos vacías.');
                this.currentExpedition = null;
                this.sceneManager.switchScene('POND');
                this.updateHeaderStats();
            }, 1200);
        }
    }

    /* ----------------------------------------------------
       5. Escena de Linaje y Museo
    ---------------------------------------------------- */
    setupLineageScene() {
        const exportBtn = document.getElementById('btn-export-database');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbService.mockDb, null, 2));
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", `axolotl_lineage_backup_${Date.now()}.json`);
                dlAnchorElem.click();
            };
        }
    }

    renderLineageTree() {
        const mount = document.getElementById('lineage-tree-mount');
        if (!mount) return;
        const treeUI = new LineageTreeUI(mount, this.axolotls, (axo) => {
            this.showAxolotlModal(axo);
        });
        treeUI.render();
    }
}

// Inicialización de la aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    const game = new AxolotlTacticsGame();
    game.init();
});
