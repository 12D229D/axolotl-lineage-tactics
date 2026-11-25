/**
 * Abilities and Elemental Combos System
 * Covers Water, Swamp, Storm, Bioluminescence, and Abyss skillsets.
 */

export const ABILITIES = {
    BURBUJA_SANADORA: {
        id: 'BURBUJA_SANADORA',
        name: 'Burbuja Regeneradora',
        element: 'water',
        cost: 2,
        range: 2,
        isHeal: true,
        description: 'Restaura 28 PV y otorga regeneración continua a un aliado.',
        execute: (user, target) => {
            const healVal = Math.round(28 * (user.genome?.vitalityFactor || 1.0));
            target.stats.currentHp = Math.min(target.stats.maxHp, target.stats.currentHp + healVal);
            return {
                type: 'HEAL',
                val: healVal,
                text: `${user.name} envolvió a ${target.name} en una Burbuja (+${healVal} PV).`
            };
        }
    },
    MORDEDURA_FANGOSA: {
        id: 'MORDEDURA_FANGOSA',
        name: 'Mordedura Fangosa',
        element: 'swamp',
        cost: 2,
        range: 1,
        isHeal: false,
        description: 'Mordisco que inflige 22 de daño y ralentiza al enemigo.',
        execute: (user, target) => {
            const rawDmg = Math.max(5, user.stats.attack * 1.3 - target.stats.defense * 0.5);
            const dmg = Math.round(rawDmg);
            target.stats.currentHp = Math.max(0, target.stats.currentHp - dmg);
            target.stats.speed = Math.max(4, target.stats.speed - 3);
            return {
                type: 'DAMAGE',
                val: dmg,
                text: `${user.name} arremetió con Mordedura Fangosa infligiendo ${dmg} y ralentizando a ${target.name}.`
            };
        }
    },
    DESCARGA_VOLTICA: {
        id: 'DESCARGA_VOLTICA',
        name: 'Descarga de Tempestad',
        element: 'storm',
        cost: 3,
        range: 3,
        isHeal: false,
        description: 'Arco eléctrico acuático de alta potencia y alcance.',
        execute: (user, target) => {
            const isCrit = Math.random() < (user.stats.critChance || 0.1);
            const multiplier = isCrit ? 1.8 : 1.25;
            const dmg = Math.round(Math.max(8, user.stats.attack * multiplier));
            target.stats.currentHp = Math.max(0, target.stats.currentHp - dmg);
            return {
                type: 'DAMAGE',
                val: dmg,
                isCrit,
                text: `${user.name} liberó una Descarga de Tempestad ${isCrit ? '¡CRÍTICA!' : ''} causando ${dmg} a ${target.name}.`
            };
        }
    },
    DESTELLO_BIOLUM: {
        id: 'DESTELLO_BIOLUM',
        name: 'Destello Bioluminiscente',
        element: 'biolum',
        cost: 2,
        range: 2,
        isHeal: false,
        description: 'Ciega temporalmente al oponente reduciendo su precisión y defensa.',
        execute: (user, target) => {
            const dmg = Math.round(user.stats.attack * 0.9);
            target.stats.currentHp = Math.max(0, target.stats.currentHp - dmg);
            target.stats.defense = Math.max(0, target.stats.defense - 4);
            return {
                type: 'DAMAGE',
                val: dmg,
                text: `${user.name} cegó con Destello a ${target.name} (-4 DEF, ${dmg} daño).`
            };
        }
    },
    VORTICE_ABISAL: {
        id: 'VORTICE_ABISAL',
        name: 'Vórtice del Abismo',
        element: 'abyss',
        cost: 3,
        range: 2,
        isHeal: false,
        description: 'Remolino oscuro que drena 20 PV y cura al usuario.',
        execute: (user, target) => {
            const dmg = 20;
            target.stats.currentHp = Math.max(0, target.stats.currentHp - dmg);
            user.stats.currentHp = Math.min(user.stats.maxHp, user.stats.currentHp + Math.round(dmg * 0.75));
            return {
                type: 'DRAIN',
                val: dmg,
                text: `${user.name} drenó la esencia de ${target.name} con Vórtice Abisal (+${Math.round(dmg * 0.75)} PV drenados).`
            };
        }
    }
};

export function getAbilitiesForElement(element) {
    const list = [ABILITIES.BURBUJA_SANADORA];
    if (element === 'swamp') list.push(ABILITIES.MORDEDURA_FANGOSA);
    else if (element === 'storm') list.push(ABILITIES.DESCARGA_VOLTICA);
    else if (element === 'biolum') list.push(ABILITIES.DESTELLO_BIOLUM);
    else if (element === 'abyss') list.push(ABILITIES.VORTICE_ABISAL);
    else list.push(ABILITIES.MORDEDURA_FANGOSA); // Predeterminado
    return list;
}
