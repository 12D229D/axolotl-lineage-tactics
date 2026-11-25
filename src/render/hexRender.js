/**
 * Canvas / SVG Hexagonal Grid Renderer
 * Draws aquatic environment, rippling currents, mud textures, and units.
 */
import { HEX_RADIUS, HEX_WIDTH, BIOME_TILES } from '../combat/hexGrid.js';
import { renderAxolotlSVG } from './creatureSvg.js';

export class HexRenderer {
    constructor(canvas, hexGrid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = hexGrid;
        this.originX = 70;
        this.originY = 60;
        this.hoveredCell = null;
        this.unitSprites = new Map();
    }

    hexToPixel(q, r) {
        const x = HEX_RADIUS * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + this.originX;
        const y = HEX_RADIUS * ((3 / 2) * r) + this.originY;
        return { x, y };
    }

    pixelToHex(px, py) {
        const ptX = px - this.originX;
        const ptY = py - this.originY;
        const q = ((Math.sqrt(3) / 3) * ptX - (1 / 3) * ptY) / HEX_RADIUS;
        const r = ((2 / 3) * ptY) / HEX_RADIUS;
        return this.axialRound(q, r);
    }

    axialRound(q, r) {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        }
        return { q: rq, r: rr };
    }

    drawHex(x, y, radius, fillColor, strokeColor, lineWidth = 1.5) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    render(selectedUnit = null) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fondo de charca / laguna
        const bgGrad = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        bgGrad.addColorStop(0, '#041724');
        bgGrad.addColorStop(1, '#020b12');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar celdas hexagonales
        for (const cell of this.grid.cells.values()) {
            const { x, y } = this.hexToPixel(cell.q, cell.r);
            let fillColor = 'rgba(12, 74, 96, 0.45)';
            let strokeColor = 'rgba(56, 189, 248, 0.25)';

            if (cell.type === BIOME_TILES.MUD) {
                fillColor = 'rgba(84, 52, 28, 0.65)';
                strokeColor = 'rgba(180, 83, 9, 0.4)';
            } else if (cell.type === BIOME_TILES.CURRENT) {
                fillColor = 'rgba(14, 116, 144, 0.6)';
                strokeColor = 'rgba(34, 211, 238, 0.6)';
            } else if (cell.type === BIOME_TILES.ALGAE) {
                fillColor = 'rgba(16, 185, 129, 0.25)';
                strokeColor = 'rgba(52, 211, 153, 0.5)';
            } else if (cell.type === BIOME_TILES.CORAL) {
                fillColor = 'rgba(190, 24, 93, 0.5)';
                strokeColor = 'rgba(244, 114, 182, 0.6)';
            }

            // Resaltados de acción
            if (cell.highlight === 'move') {
                fillColor = 'rgba(34, 211, 238, 0.45)';
                strokeColor = '#00e5ff';
            } else if (cell.highlight === 'attack') {
                fillColor = 'rgba(239, 68, 68, 0.45)';
                strokeColor = '#f87171';
            }

            if (this.hoveredCell && this.hoveredCell.q === cell.q && this.hoveredCell.r === cell.r) {
                fillColor = 'rgba(255, 255, 255, 0.2)';
            }

            this.drawHex(x, y, HEX_RADIUS - 1.5, fillColor, strokeColor);

            // Efectos de Corriente
            if (cell.type === BIOME_TILES.CURRENT) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '12px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('≈≈', x, y + 14);
            }

            // Dibujar ocupantes
            if (cell.occupant) {
                this.drawUnit(cell.occupant, x, y, selectedUnit === cell.occupant);
            }
        }
    }

    drawUnit(unit, x, y, isSelected = false) {
        const ctx = this.ctx;

        // Círculo base de selección
        ctx.beginPath();
        ctx.arc(x, y + 6, 22, 0, Math.PI * 2);
        ctx.fillStyle = unit.isAlly ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ff7597' : (unit.isAlly ? '#38bdf8' : '#ef4444');
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Icono o sprite de criatura
        if (unit.isAlly) {
            // Miniatura de ajolote
            ctx.fillStyle = unit.genome ? unit.genome.skinColor.expressed : '#ff7597';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            // Agallas
            ctx.fillStyle = '#ff7597';
            ctx.fillRect(x - 16, y - 5, 4, 10);
            ctx.fillRect(x + 12, y - 5, 4, 10);
        } else {
            // Depredador de charca (Cangrejo / Garzón / Anguila)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('☠', x, y + 4);
        }

        // Barra de Vida
        const hpPercent = Math.max(0, unit.stats.currentHp / unit.stats.maxHp);
        const barW = 34;
        const barH = 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - barW / 2, y - 26, barW, barH);

        ctx.fillStyle = unit.isAlly ? '#10b981' : '#f43f5e';
        ctx.fillRect(x - barW / 2, y - 26, barW * hpPercent, barH);

        // Nombre de unidad
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name.substring(0, 8), x, y + 26);
    }
}
