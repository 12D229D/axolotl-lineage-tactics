/**
 * Pseudo-Random Number Generator (Mulberry32) for deterministic seeding.
 * Guarantees reproducibility of genetic crosses and procedural encounters.
 */
export function createRNG(seedStrOrNum) {
    let s = 123456789;
    if (typeof seedStrOrNum === 'number') {
        s = seedStrOrNum >>> 0;
    } else if (typeof seedStrOrNum === 'string') {
        for (let i = 0; i < seedStrOrNum.length; i++) {
            s = (Math.imul(31, s) + seedStrOrNum.charCodeAt(i)) >>> 0;
        }
    }
    return function() {
        let t = (s += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Available Allele Catalogs and Phenotypic Expression Rules.
 */
export const GENE_TRAITS = {
    skinColor: {
        dominant: ['#ff7597', '#00e5ff', '#a855f7'], // Rosa Axolote clásico, Turquesa Bioluminiscente, Amatista Mística
        recessive: ['#facc15', '#10b981', '#38bdf8', '#fb7185'], // Dorado Solar, Alga Esmeralda, Azul Glaciar, Coral Albino
        names: {
            '#ff7597': 'Rosa Axolote Leucístico',
            '#00e5ff': 'Cian Bioluminiscente',
            '#a855f7': 'Amatista de Profundidad',
            '#facc15': 'Dorado Solar Primordial',
            '#10b981': 'Verde Alga Ancestral',
            '#38bdf8': 'Glaciar de Xochimilco',
            '#fb7185': 'Coral Carmesí'
        }
    },
    gills: {
        dominant: ['plumed', 'branched'],
        recessive: ['crystalline', 'feathered', 'radiant'],
        names: {
            'plumed': 'Penachos Ramificados',
            'branched': 'Cuernos Arbóreos',
            'crystalline': 'Prismas de Cuarzo Marino',
            'feathered': 'Plumas de Corriente',
            'radiant': 'Corona Resplandeciente'
        }
    },
    element: {
        dominant: ['water', 'swamp'],
        recessive: ['storm', 'biolum', 'abyss'],
        names: {
            'water': 'Agua Dulce (Sanación / Flujo)',
            'swamp': 'Fango Pantanoso (Control / Resistencia)',
            'storm': 'Tempestad Eléctrica (Daño Rápido)',
            'biolum': 'Bioluminiscencia (Apoyo / Crítico)',
            'abyss': 'Abismo Primordial (Veneno / Succión)'
        }
    },
    tail: {
        dominant: ['fin_classic', 'fin_wide'],
        recessive: ['fin_ribbon', 'fin_serpent', 'fin_lunar'],
        names: {
            'fin_classic': 'Aleta Dorsal Ondulada',
            'fin_wide': 'Aleta Ancha Propulsora',
            'fin_ribbon': 'Cinta de Seda Acuática',
            'fin_serpent': 'Cola Anguiloide',
            'fin_lunar': 'Vela Lunar Escarchada'
        }
    },
    eyes: {
        dominant: ['amber', 'ruby'],
        recessive: ['void', 'cyan_glow', 'gold_slit'],
        names: {
            'amber': 'Ámbar Cálido',
            'ruby': 'Rubí Glotón',
            'void': 'Ojo del Abismo',
            'cyan_glow': 'Iris Fulgurante',
            'gold_slit': 'Pupila Reptiliana Dorada'
        }
    }
};

/**
 * Generate a randomized initial or founder genome.
 */
export function generateRandomGenome(seed = Date.now()) {
    const rng = createRNG(seed);

    const pickAllelePair = (traitCatalog) => {
        const pool = [...traitCatalog.dominant, ...traitCatalog.recessive];
        const a1 = pool[Math.floor(rng() * pool.length)];
        const a2 = pool[Math.floor(rng() * pool.length)];
        return {
            allele1: a1,
            allele2: a2,
            expressed: traitCatalog.dominant.includes(a1) ? a1 : a2
        };
    };

    return {
        skinColor: pickAllelePair(GENE_TRAITS.skinColor),
        gills: pickAllelePair(GENE_TRAITS.gills),
        element: pickAllelePair(GENE_TRAITS.element),
        tail: pickAllelePair(GENE_TRAITS.tail),
        eyes: pickAllelePair(GENE_TRAITS.eyes),
        vitalityFactor: Number((0.85 + rng() * 0.4).toFixed(2)),
        magicAura: rng() > 0.65
    };
}

/**
 * Calculate combat base statistics from genome phenotypes.
 */
export function calculateStatsFromGenome(genome) {
    const element = genome.element.expressed;
    const gills = genome.gills.expressed;
    const tail = genome.tail.expressed;
    const vitality = genome.vitalityFactor || 1.0;

    let maxHp = Math.round((75 + (gills === 'crystalline' ? 25 : gills === 'branched' ? 18 : 10)) * vitality);
    let attack = Math.round(14 + (element === 'storm' ? 8 : element === 'swamp' ? 4 : 5));
    let defense = Math.round(6 + (gills === 'branched' ? 5 : element === 'swamp' ? 4 : 2));
    let speed = Math.round(10 + (tail === 'fin_serpent' ? 5 : tail === 'fin_wide' ? 3 : 1));
    let energy = element === 'biolum' || element === 'abyss' ? 5 : 4;
    let regenPerTurn = gills === 'feathered' || element === 'water' ? 6 : 3;

    return {
        maxHp,
        currentHp: maxHp,
        attack,
        defense,
        speed,
        energy,
        maxEnergy: energy,
        regenPerTurn,
        critChance: genome.eyes.expressed === 'void' ? 0.25 : 0.10
    };
}

export function generateAxolotlName(seed = Date.now()) {
    const prefixes = ['Xochi', 'Nahu', 'Tlal', 'Cuauh', 'Atla', 'Quetz', 'Mizt', 'Yohu', 'Ixt', 'Zempo'];
    const suffixes = ['lotl', 'tlan', 'pilli', 'coatl', 'cueitl', 'mon', 'mar', 'zin', 'nox', 'ri'];
    const rng = createRNG(seed);
    const p = prefixes[Math.floor(rng() * prefixes.length)];
    const s = suffixes[Math.floor(rng() * suffixes.length)];
    return `${p}${s}`;
}
