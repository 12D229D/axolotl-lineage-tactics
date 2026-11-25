/**
 * Procedural SVG Generator for Axolotls based on genetic alleles.
 * Renders dynamically: body tone, gills, tail shape, eyes, spots, and elemental bioluminescence.
 */

export function renderAxolotlSVG(axolotl, size = 180) {
    if (!axolotl || !axolotl.genome) return '<svg width="100" height="100"></svg>';

    const genome = axolotl.genome;
    const skinColor = genome.skinColor ? genome.skinColor.expressed : '#ff7597';
    const gillsType = genome.gills ? genome.gills.expressed : 'plumed';
    const tailType = genome.tail ? genome.tail.expressed : 'fin_classic';
    const eyesType = genome.eyes ? genome.eyes.expressed : 'amber';
    const element = genome.element ? genome.element.expressed : 'water';
    const hasAura = genome.magicAura;

    // Colores elementales para reflejos y agallas
    const elementGlow = {
        water: '#38bdf8',
        swamp: '#22c55e',
        storm: '#eab308',
        biolum: '#00e5ff',
        abyss: '#c084fc'
    }[element] || '#38bdf8';

    // Ojos según alelo
    const eyeColors = {
        amber: '#f59e0b',
        ruby: '#ef4444',
        void: '#1e1b4b',
        cyan_glow: '#06b6d4',
        gold_slit: '#fbbf24'
    }[eyesType] || '#f59e0b';

    // Generar ramas de agallas según estilo genético
    let gillsSvg = '';
    if (gillsType === 'crystalline') {
        gillsSvg = `
            <!-- Agallas de Cuarzo Marino -->
            <polygon points="50,65 30,35 45,55" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />
            <polygon points="45,85 20,70 40,85" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
            <polygon points="50,105 25,120 45,100" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />

            <polygon points="150,65 170,35 155,55" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />
            <polygon points="155,85 180,70 160,85" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
            <polygon points="150,105 175,120 155,100" fill="${elementGlow}" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />
        `;
    } else if (gillsType === 'branched') {
        gillsSvg = `
            <!-- Cuernos Arbóreos Ramificados -->
            <path d="M 52,65 Q 25,45 15,30 M 25,45 Q 15,55 8,62 M 50,85 Q 20,85 10,95 M 50,105 Q 25,125 15,145" 
                  stroke="${elementGlow}" stroke-width="4.5" stroke-linecap="round" fill="none" />
            <path d="M 148,65 Q 175,45 185,30 M 175,45 Q 185,55 192,62 M 150,85 Q 180,85 190,95 M 150,105 Q 175,125 185,145" 
                  stroke="${elementGlow}" stroke-width="4.5" stroke-linecap="round" fill="none" />
        `;
    } else if (gillsType === 'feathered') {
        gillsSvg = `
            <!-- Plumas de Corriente -->
            <path d="M 52,60 C 20,40 10,60 5,45 C 10,70 20,80 50,85 C 15,95 20,120 50,110" 
                  fill="${elementGlow}" opacity="0.85" />
            <path d="M 148,60 C 180,40 190,60 195,45 C 190,70 180,80 150,85 C 185,95 180,120 150,110" 
                  fill="${elementGlow}" opacity="0.85" />
        `;
    } else {
        // Plumed clásico
        gillsSvg = `
            <path d="M 55,65 Q 25,45 18,35 Q 35,60 48,72" fill="${elementGlow}" />
            <path d="M 50,85 Q 15,82 10,80 Q 25,95 48,93" fill="${elementGlow}" />
            <path d="M 55,105 Q 25,125 18,135 Q 35,110 48,102" fill="${elementGlow}" />

            <path d="M 145,65 Q 175,45 182,35 Q 165,60 152,72" fill="${elementGlow}" />
            <path d="M 150,85 Q 185,82 190,80 Q 175,95 152,93" fill="${elementGlow}" />
            <path d="M 145,105 Q 175,125 182,135 Q 165,110 152,102" fill="${elementGlow}" />
        `;
    }

    // Estilo de Cola
    let tailSvg = '';
    if (tailType === 'fin_serpent') {
        tailSvg = `<path d="M 85,150 C 70,180 115,200 95,230 C 80,245 95,255 100,260 C 105,250 120,230 115,200 C 115,180 115,150 115,150 Z" 
                         fill="${skinColor}" stroke="${elementGlow}" stroke-width="2" />`;
    } else if (tailType === 'fin_wide') {
        tailSvg = `<path d="M 80,150 C 50,190 60,225 100,250 C 140,225 150,190 120,150 Z" 
                         fill="${skinColor}" stroke="${elementGlow}" stroke-width="2.5" opacity="0.9" />`;
    } else {
        tailSvg = `<path d="M 88,145 C 80,180 75,210 100,240 C 125,210 120,180 112,145 Z" 
                         fill="${skinColor}" stroke="${elementGlow}" stroke-width="2" />`;
    }

    return `
    <svg viewBox="0 0 200 260" width="${size}" height="${(size * 1.3).toFixed(0)}" class="axolotl-render" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="gradBody_${axolotl.id}" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
                <stop offset="60%" stop-color="${skinColor}" />
                <stop offset="100%" stop-color="#0a192f" stop-opacity="0.4" />
            </radialGradient>
            <radialGradient id="auraGrad_${axolotl.id}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="${elementGlow}" stop-opacity="0.4" />
                <stop offset="100%" stop-color="${elementGlow}" stop-opacity="0" />
            </radialGradient>
            <filter id="glow_${axolotl.id}" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        ${hasAura ? `<circle cx="100" cy="110" r="85" fill="url(#auraGrad_${axolotl.id})" filter="url(#glow_${axolotl.id})" />` : ''}

        <!-- Cola y Aletas -->
        ${tailSvg}

        <!-- Agallas Genéticas -->
        <g class="gills-group" filter="url(#glow_${axolotl.id})">
            ${gillsSvg}
        </g>

        <!-- Extremidades (patitas tiernas) -->
        <ellipse cx="60" cy="145" rx="14" ry="9" fill="${skinColor}" transform="rotate(-20 60 145)" />
        <ellipse cx="140" cy="145" rx="14" ry="9" fill="${skinColor}" transform="rotate(20 140 145)" />
        <ellipse cx="65" cy="180" rx="12" ry="8" fill="${skinColor}" transform="rotate(-15 65 180)" />
        <ellipse cx="135" cy="180" rx="12" ry="8" fill="${skinColor}" transform="rotate(15 135 180)" />

        <!-- Cuerpo y Cabeza -->
        <ellipse cx="100" cy="155" rx="34" ry="45" fill="url(#gradBody_${axolotl.id})" stroke="${elementGlow}" stroke-width="1.5" />
        <ellipse cx="100" cy="90" rx="46" ry="38" fill="url(#gradBody_${axolotl.id})" stroke="${elementGlow}" stroke-width="2" />

        <!-- Mejillas bioluminiscentes -->
        <ellipse cx="68" cy="98" rx="8" ry="5" fill="#ff4081" opacity="0.45" />
        <ellipse cx="132" cy="98" rx="8" ry="5" fill="#ff4081" opacity="0.45" />

        <!-- Ojos -->
        <circle cx="75" cy="82" r="7" fill="${eyeColors}" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="73" cy="80" r="2.5" fill="#ffffff" />
        
        <circle cx="125" cy="82" r="7" fill="${eyeColors}" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="123" cy="80" r="2.5" fill="#ffffff" />

        <!-- Boca sonriente clásica de ajolote -->
        <path d="M 88,105 Q 100,116 112,105" fill="none" stroke="#be185d" stroke-width="2.5" stroke-linecap="round" />

        <!-- Gema o Marca Frontal Elemental -->
        <circle cx="100" cy="72" r="4" fill="${elementGlow}" filter="url(#glow_${axolotl.id})" />
    </svg>
    `;
}
