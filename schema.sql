-- SQLite Declarative Schema for Axolotl Lineage Tactics
-- Compatible with SQLite 3.45+ and Browser Storage / OPFS / Relational Persistence

CREATE TABLE IF NOT EXISTS lineages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    founder_id TEXT NOT NULL,
    generation_count INTEGER DEFAULT 1,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS axolotls (
    id TEXT PRIMARY KEY,
    lineage_id TEXT NOT NULL,
    name TEXT NOT NULL,
    generation INTEGER DEFAULT 1,
    parent1_id TEXT,
    parent2_id TEXT,
    genome_json TEXT NOT NULL,
    stats_json TEXT NOT NULL,
    element TEXT NOT NULL,
    is_alive INTEGER DEFAULT 1,
    in_squad INTEGER DEFAULT 0,
    expeditions_completed INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lineage_id) REFERENCES lineages(id)
);

CREATE TABLE IF NOT EXISTS expeditions (
    id TEXT PRIMARY KEY,
    lineage_id TEXT NOT NULL,
    biom_name TEXT NOT NULL,
    seed TEXT NOT NULL,
    nodes_cleared INTEGER DEFAULT 0,
    total_nodes INTEGER DEFAULT 4,
    loot_dna_points INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('IN_PROGRESS', 'VICTORY', 'DEFEAT')),
    squad_ids_json TEXT NOT NULL,
    log_json TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lineage_id) REFERENCES lineages(id)
);

CREATE INDEX IF NOT EXISTS idx_axolotls_lineage ON axolotls(lineage_id);
CREATE INDEX IF NOT EXISTS idx_axolotls_squad ON axolotls(in_squad);
CREATE INDEX IF NOT EXISTS idx_expeditions_lineage ON expeditions(lineage_id);
