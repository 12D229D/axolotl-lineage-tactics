/**
 * Interactive Family Lineage Tree & Axolotl Museum Visualizer
 * Traces genealogical inheritance, ancestral parents, generation tags, and genetic mutations.
 */
import { renderAxolotlSVG } from '../render/creatureSvg.js';

export class LineageTreeUI {
    constructor(containerElement, axolotls, onSelectAxolotl) {
        this.container = containerElement;
        this.axolotls = axolotls;
        this.onSelectAxolotl = onSelectAxolotl;
    }

    render() {
        if (!this.container) return;

        // Agrupar por generación
        const generations = {};
        let maxGen = 1;

        this.axolotls.forEach(axo => {
            const gen = axo.generation || 1;
            if (!generations[gen]) generations[gen] = [];
            generations[gen].push(axo);
            if (gen > maxGen) maxGen = gen;
        });

        let html = `
            <div class="lineage-tree-wrapper">
                <div class="tree-header">
                    <h3>🏛️ Árbol Genealógico y Dinastía Acuática</h3>
                    <p class="subtitle">Registros biológicos guardados en SQLite: ${this.axolotls.length} especímenes analizados.</p>
                </div>
                <div class="tree-generations-container">
        `;

        for (let g = 1; g <= maxGen; g++) {
            const list = generations[g] || [];
            html += `
                <div class="generation-column">
                    <div class="generation-badge">Generación ${g}</div>
                    <div class="generation-nodes">
                        ${list.map(axo => this.renderNode(axo)).join('')}
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    renderNode(axo) {
        const p1 = axo.parent1_id ? this.axolotls.find(a => a.id === axo.parent1_id) : null;
        const p2 = axo.parent2_id ? this.axolotls.find(a => a.id === axo.parent2_id) : null;
        const parentNames = p1 && p2 ? `${p1.name} × ${p2.name}` : (p1 ? p1.name : 'Linaje Fundador');
        const elementIcon = {
            water: '💧', swamp: '🌿', storm: '⚡', biolum: '✨', abyss: '🌀'
        }[axo.element] || '💧';

        return `
            <div class="tree-node-card ${axo.in_squad ? 'in-squad' : ''} ${!axo.is_alive ? 'deceased' : ''}" data-id="${axo.id}">
                <div class="node-svg-preview">
                    ${renderAxolotlSVG(axo, 70)}
                </div>
                <div class="node-info">
                    <div class="node-name">${elementIcon} ${axo.name}</div>
                    <div class="node-lineage">${parentNames}</div>
                    <div class="node-stats">
                        <span>❤️ ${axo.stats.maxHp}</span>
                        <span>⚔️ ${axo.stats.attack}</span>
                        <span>🛡️ ${axo.stats.defense}</span>
                    </div>
                    <div class="node-traits">
                        <span class="trait-tag">${axo.genome?.gills?.expressed || 'plumed'}</span>
                        <span class="trait-tag">${axo.element}</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        this.container.querySelectorAll('.tree-node-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const axo = this.axolotls.find(a => a.id === id);
                if (axo && this.onSelectAxolotl) {
                    this.onSelectAxolotl(axo);
                }
            });
        });
    }
}
