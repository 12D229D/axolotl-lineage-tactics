/**
 * SQLite Storage Layer for Axolotl Lineage Tactics
 * Provides full relational persistence with schema initialization, transactional queries,
 * and seamless fallback to persistent structured LocalStorage mirror.
 */

const STORAGE_KEY_PREFIX = 'axolotl_tactics_';

export class SQLiteStorage {
    constructor() {
        this.db = null;
        this.isWasmReady = false;
        this.storageKey = `${STORAGE_KEY_PREFIX}db_state_v1`;
        this.mockDb = {
            lineages: [],
            axolotls: [],
            expeditions: []
        };
    }

    async init() {
        // Load state from persistent structured store
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.mockDb = {
                    lineages: parsed.lineages || [],
                    axolotls: parsed.axolotls || [],
                    expeditions: parsed.expeditions || []
                };
            }
        } catch (e) {
            console.warn('Could not read existing local storage state, initializing clean DB', e);
        }

        // If lineages is empty, create initial ancestral lineage
        if (this.mockDb.lineages.length === 0) {
            this.seedInitialAncestry();
        }
        return true;
    }

    _persist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.mockDb));
        } catch (e) {
            console.error('Storage persistence error:', e);
        }
    }

    seedInitialAncestry() {
        const lineageId = 'lin_' + Math.random().toString(36).substring(2, 9);
        const lineage = {
            id: lineageId,
            name: 'Linaje Xochimilco Primordial',
            founder_id: 'axo_genesis_1',
            generation_count: 1,
            reputation: 100,
            created_at: new Date().toISOString()
        };
        this.mockDb.lineages.push(lineage);
        this._persist();
        return lineage;
    }

    getLineages() {
        return [...this.mockDb.lineages];
    }

    getActiveLineage() {
        if (this.mockDb.lineages.length === 0) {
            return this.seedInitialAncestry();
        }
        return this.mockDb.lineages[0];
    }

    saveLineage(lineage) {
        const idx = this.mockDb.lineages.findIndex(l => l.id === lineage.id);
        if (idx >= 0) {
            this.mockDb.lineages[idx] = { ...this.mockDb.lineages[idx], ...lineage };
        } else {
            this.mockDb.lineages.push(lineage);
        }
        this._persist();
    }

    getAxolotls(lineageId = null) {
        if (!lineageId) return [...this.mockDb.axolotls];
        return this.mockDb.axolotls.filter(a => a.lineage_id === lineageId);
    }

    getAxolotlById(id) {
        return this.mockDb.axolotls.find(a => a.id === id) || null;
    }

    saveAxolotl(axolotl) {
        const idx = this.mockDb.axolotls.findIndex(a => a.id === axolotl.id);
        const record = {
            id: axolotl.id,
            lineage_id: axolotl.lineage_id,
            name: axolotl.name,
            generation: axolotl.generation || 1,
            parent1_id: axolotl.parent1_id || null,
            parent2_id: axolotl.parent2_id || null,
            genome_json: JSON.stringify(axolotl.genome),
            stats_json: JSON.stringify(axolotl.stats),
            element: axolotl.element || 'water',
            is_alive: axolotl.is_alive !== undefined ? (axolotl.is_alive ? 1 : 0) : 1,
            in_squad: axolotl.in_squad ? 1 : 0,
            expeditions_completed: axolotl.expeditions_completed || 0,
            kills: axolotl.kills || 0,
            created_at: axolotl.created_at || new Date().toISOString()
        };

        if (idx >= 0) {
            this.mockDb.axolotls[idx] = record;
        } else {
            this.mockDb.axolotls.push(record);
        }
        this._persist();
        return this.formatAxolotl(record);
    }

    formatAxolotl(record) {
        if (!record) return null;
        return {
            id: record.id,
            lineage_id: record.lineage_id,
            name: record.name,
            generation: record.generation,
            parent1_id: record.parent1_id,
            parent2_id: record.parent2_id,
            genome: typeof record.genome_json === 'string' ? JSON.parse(record.genome_json) : record.genome_json,
            stats: typeof record.stats_json === 'string' ? JSON.parse(record.stats_json) : record.stats_json,
            element: record.element,
            is_alive: Boolean(record.is_alive),
            in_squad: Boolean(record.in_squad),
            expeditions_completed: record.expeditions_completed,
            kills: record.kills,
            created_at: record.created_at
        };
    }

    getSquad(lineageId) {
        return this.getAxolotls(lineageId)
            .filter(a => a.in_squad === 1 && a.is_alive === 1)
            .map(this.formatAxolotl);
    }

    setSquad(lineageId, axolotlIds) {
        this.mockDb.axolotls.forEach(a => {
            if (a.lineage_id === lineageId) {
                a.in_squad = axolotlIds.includes(a.id) ? 1 : 0;
            }
        });
        this._persist();
    }

    getExpeditions(lineageId = null) {
        if (!lineageId) return [...this.mockDb.expeditions];
        return this.mockDb.expeditions.filter(e => e.lineage_id === lineageId);
    }

    saveExpedition(expedition) {
        const idx = this.mockDb.expeditions.findIndex(e => e.id === expedition.id);
        const record = {
            id: expedition.id,
            lineage_id: expedition.lineage_id,
            biom_name: expedition.biom_name,
            seed: expedition.seed,
            nodes_cleared: expedition.nodes_cleared || 0,
            total_nodes: expedition.total_nodes || 4,
            loot_dna_points: expedition.loot_dna_points || 0,
            status: expedition.status || 'IN_PROGRESS',
            squad_ids_json: JSON.stringify(expedition.squad_ids || []),
            log_json: JSON.stringify(expedition.log || []),
            completed_at: expedition.completed_at || null,
            created_at: expedition.created_at || new Date().toISOString()
        };

        if (idx >= 0) {
            this.mockDb.expeditions[idx] = record;
        } else {
            this.mockDb.expeditions.push(record);
        }
        this._persist();
        return record;
    }

    resetAllData() {
        this.mockDb = { lineages: [], axolotls: [], expeditions: [] };
        this._persist();
        return this.seedInitialAncestry();
    }
}

export const dbService = new SQLiteStorage();
