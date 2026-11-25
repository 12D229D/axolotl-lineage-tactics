/**
 * Mutation Engine for Axolotl Lineage Tactics
 * Introduces spontaneous genetic variance during breeding or deep swamp exposure.
 */
import { GENE_TRAITS, createRNG } from './genome.js';

export const MUTATION_CHANCE = 0.12; // 12% por rasgo genético base

export function attemptMutation(traitKey, currentAllele, rng) {
    if (rng() >= MUTATION_CHANCE) {
        return { allele: currentAllele, mutated: false };
    }

    const trait = GENE_TRAITS[traitKey];
    if (!trait) return { allele: currentAllele, mutated: false };

    // Posibilidad de despertar un alelo recesivo raro o aberración biológica
    const rarePool = trait.recessive;
    const mutatedAllele = rarePool[Math.floor(rng() * rarePool.length)];
    return {
        allele: mutatedAllele,
        mutated: true,
        previous: currentAllele
    };
}

export function evaluatePhenotype(traitKey, a1, a2) {
    const catalog = GENE_TRAITS[traitKey];
    if (!catalog) return a1;

    const isA1Dom = catalog.dominant.includes(a1);
    const isA2Dom = catalog.dominant.includes(a2);

    // Dominancia mendeliana: si uno es dominante y el otro recesivo, manda el dominante.
    // Si ambos son de la misma clase (ambos dominantes o ambos recesivos), co-expresión o aleatorio.
    if (isA1Dom && !isA2Dom) return a1;
    if (!isA1Dom && isA2Dom) return a2;
    // Si ambos dominantes o ambos recesivos:
    return Math.random() > 0.5 ? a1 : a2;
}
