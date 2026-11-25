/**
 * Breeding Engine (Crianza y Cruce Genético)
 * Implements Mendelian segregation, independent assortment, and spontaneous mutations.
 */
import { createRNG, calculateStatsFromGenome, generateAxolotlName } from './genome.js';
import { attemptMutation, evaluatePhenotype } from './mutations.js';

export function breedAxolotls(parent1, parent2, seed = Date.now()) {
    const rng = createRNG(seed);
    const childGenome = {};
    const mutationLog = [];

    const traits = ['skinColor', 'gills', 'element', 'tail', 'eyes'];

    for (const trait of traits) {
        // Segregación mendeliana: el padre 1 dona allele1 o allele2 (50%)
        const p1Allele = rng() > 0.5 ? parent1.genome[trait].allele1 : parent1.genome[trait].allele2;
        // El padre 2 dona allele1 o allele2 (50%)
        const p2Allele = rng() > 0.5 ? parent2.genome[trait].allele1 : parent2.genome[trait].allele2;

        // Evaluación de mutaciones
        const mut1 = attemptMutation(trait, p1Allele, rng);
        const mut2 = attemptMutation(trait, p2Allele, rng);

        if (mut1.mutated) {
            mutationLog.push(`Mutación materna en ${trait}: ${mut1.previous} -> ${mut1.allele}`);
        }
        if (mut2.mutated) {
            mutationLog.push(`Mutación paterna en ${trait}: ${mut2.previous} -> ${mut2.allele}`);
        }

        const expressed = evaluatePhenotype(trait, mut1.allele, mut2.allele);

        childGenome[trait] = {
            allele1: mut1.allele,
            allele2: mut2.allele,
            expressed
        };
    }

    // Vitalidad heredada ponderada con vigor híbrido
    const avgVitality = (parent1.genome.vitalityFactor + parent2.genome.vitalityFactor) / 2;
    const hybridVigor = rng() * 0.15 - 0.05; // -5% a +10%
    childGenome.vitalityFactor = Number(Math.max(0.75, Math.min(1.45, avgVitality + hybridVigor)).toFixed(2));
    childGenome.magicAura = (parent1.genome.magicAura || parent2.genome.magicAura) && rng() > 0.4;

    const stats = calculateStatsFromGenome(childGenome);
    const nextGeneration = Math.max(parent1.generation, parent2.generation) + 1;
    const childName = generateAxolotlName(seed);

    return {
        id: 'axo_' + Math.random().toString(36).substring(2, 9),
        lineage_id: parent1.lineage_id,
        name: childName,
        generation: nextGeneration,
        parent1_id: parent1.id,
        parent2_id: parent2.id,
        genome: childGenome,
        stats: stats,
        element: childGenome.element.expressed,
        is_alive: true,
        in_squad: false,
        expeditions_completed: 0,
        kills: 0,
        mutationLog,
        created_at: new Date().toISOString()
    };
}
