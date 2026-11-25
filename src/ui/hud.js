/**
 * Tactical Combat & Pond HUD UI Controller
 * Handles bottom action bar, unit cards, combat battle log, and modal inspections.
 */
import { getAbilitiesForElement } from '../combat/abilities.js';

export class TacticalHUD {
    constructor(elements) {
        this.selectedUnitCard = elements.selectedUnitCard;
        this.actionButtons = elements.actionButtons;
        this.battleLog = elements.battleLog;
        this.roundCounter = elements.roundCounter;
    }

    updateSelectedUnit(unit, onAttackClick, onAbilityClick, onPassClick) {
        if (!this.selectedUnitCard) return;

        if (!unit) {
            this.selectedUnitCard.innerHTML = `<p class="hud-empty">Selecciona un ajolote en la cuadrícula para actuar.</p>`;
            if (this.actionButtons) this.actionButtons.innerHTML = '';
            return;
        }

        const abilities = getAbilitiesForElement(unit.element);

        this.selectedUnitCard.innerHTML = `
            <div class="hud-unit-header">
                <h4>${unit.name} <span class="badge-element ${unit.element}">${unit.element.toUpperCase()}</span></h4>
                <div class="hud-badges">
                    <span class="badge-gen">Gen ${unit.generation}</span>
                    <span class="badge-vigor">Vigor ×${unit.genome?.vitalityFactor || 1.0}</span>
                </div>
            </div>
            <div class="hud-bars">
                <div class="hud-bar-row">
                    <span>PV: ${unit.stats.currentHp} / ${unit.stats.maxHp}</span>
                    <div class="meter-bg"><div class="meter-fill hp" style="width: ${(unit.stats.currentHp / unit.stats.maxHp) * 100}%"></div></div>
                </div>
                <div class="hud-bar-row">
                    <span>EN: ${unit.stats.energy} / ${unit.stats.maxEnergy}</span>
                    <div class="meter-bg"><div class="meter-fill en" style="width: ${(unit.stats.energy / unit.stats.maxEnergy) * 100}%"></div></div>
                </div>
            </div>
            <div class="hud-stat-grid">
                <div>⚔️ ATK: <b>${unit.stats.attack}</b></div>
                <div>🛡️ DEF: <b>${unit.stats.defense}</b></div>
                <div>⚡ VEL: <b>${unit.stats.speed}</b></div>
                <div>💚 REG: <b>+${unit.stats.regenPerTurn}/t</b></div>
            </div>
        `;

        // Render Action Buttons
        if (this.actionButtons) {
            let btnsHtml = `
                <button id="btn-action-attack" class="hud-btn btn-attack" ${unit.hasActed ? 'disabled' : ''}>
                    💥 Ataque Básico (1 Alcance)
                </button>
            `;

            abilities.forEach(ab => {
                const canAfford = unit.stats.energy >= ab.cost && !unit.hasActed;
                btnsHtml += `
                    <button class="hud-btn btn-ability" data-ability="${ab.id}" ${canAfford ? '' : 'disabled'}>
                        ✨ ${ab.name} (${ab.cost} EN)
                    </button>
                `;
            });

            btnsHtml += `
                <button id="btn-action-pass" class="hud-btn btn-pass" ${unit.hasActed ? 'disabled' : ''}>
                    ⏩ Pasar Turno
                </button>
            `;

            this.actionButtons.innerHTML = btnsHtml;

            // Bindings
            const atkBtn = document.getElementById('btn-action-attack');
            if (atkBtn) atkBtn.onclick = onAttackClick;

            const passBtn = document.getElementById('btn-action-pass');
            if (passBtn) passBtn.onclick = onPassClick;

            this.actionButtons.querySelectorAll('.btn-ability').forEach(btn => {
                btn.onclick = () => {
                    const abId = btn.getAttribute('data-ability');
                    if (onAbilityClick) onAbilityClick(abId);
                };
            });
        }
    }

    addLog(message) {
        if (!this.battleLog) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        this.battleLog.prepend(entry);
    }

    clearLog() {
        if (this.battleLog) this.battleLog.innerHTML = '';
    }

    updateRound(roundNumber) {
        if (this.roundCounter) {
            this.roundCounter.textContent = `Ronda ${roundNumber}`;
        }
    }
}
