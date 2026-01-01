import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateHexGrid } from '../utils/hex-grid';

type Movement = { distance: number; direction: 'F' | 'LF' | 'RF' | 'LB' | 'RB' | 'B' };
type Card = { title: string; flavor: string; movements: Movement[] };

const DIRECTION_MAP: Record<Movement['direction'], [number, number]> = {
    F: [0, -1],
    RF: [1, -1],
    LF: [-1, 0],
    B: [0, 1],
    RB: [1, 0],
    LB: [-1, 1],
};

@Component({
    selector: 'move-card-batch',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './move-card-batch.component.html',
    styleUrls: ['./move-card-batch.component.scss'],
})
export class MoveCardBatchComponent {
    input = `Charge,Quick strike,1F,2RF
"Sweep Attack","Wide arc, heavy",2LF,1B
Guard,Hold the line,1B,1LB`;
    error = '';
    cards: Card[] = [];

    csvSplit(line: string): string[] {
        const res: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (ch === ',' && !inQuotes) {
                res.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
        }
        res.push(cur);
        return res.map(s => s.trim().replace(/^"(.*)"$/, '$1'));
    }

    parseMovementCardLine(line: string): Card {
        const parts = this.csvSplit(line).filter(p => p.length > 0);
        if (parts.length < 2) throw new Error('Line must have at least title and flavor');
        const title = parts[0].trim();
        const flavor = parts[1].trim();
        const movements: Movement[] = parts.slice(2).map(raw => {
            const s = raw.trim().toUpperCase();
            const m = s.match(/^([12])\s*([A-Z]{1,2})$/);
            if (!m) throw new Error(`Invalid movement token: "${raw}"`);
            const dist = Number(m[1]);
            const dir = m[2] as Movement['direction'];
            if (!['F', 'LF', 'RF', 'LB', 'RB', 'B'].includes(dir)) throw new Error(`Unknown direction: "${dir}"`);
            return { distance: dist, direction: dir as Movement['direction'] };
        });
        return { title, flavor, movements };
    }

    parseAll() {
        try {
            this.error = '';
            const lines = this.input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            this.cards = lines.map(l => this.parseMovementCardLine(l));
        } catch (err: any) {
            this.cards = [];
            this.error = err?.message || String(err);
        }
    }

    downloadJSON() {
        const data = JSON.stringify(this.cards, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'move-cards.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    movementsText(c: Card) {
        return (c.movements || []).map(m => `${m.distance}${m.direction}`).join(', ');
    }

    buildCardSVG(card: Card, pxW: number, pxH: number, DPI: number) {
        const cornerR = Math.round(24 * (DPI / 96));
        const innerPadding = Math.round(18 * (DPI / 96));

        // Top area: use top 1/3 for title+desc, bottom 2/3 for mini-board
        const topAreaH = Math.floor(pxH / 3);
        const miniAreaY = topAreaH;
        const miniAreaH = pxH - miniAreaY - innerPadding;
        const miniAreaW = pxW - innerPadding * 2;

        // Banner height (black) and description area inside the top third
        const bannerH = Math.round(36 * (DPI / 96));
        const descGap = Math.round(8 * (DPI / 96));
        const descAreaY = innerPadding + bannerH + descGap;
        const descAreaH = topAreaH - (bannerH + descGap + innerPadding);

        // Build reachable set from movements
        const reachable = new Set<string>();
        const centerQ = 0, centerR = 0;
        for (const m of card.movements || []) {
            const dir = m.direction as Movement['direction'];
            const map = DIRECTION_MAP[dir];
            if (!map) continue;
            const [dq, dr] = map;
            const tq = centerQ + dq * m.distance;
            const tr = centerR + dr * m.distance;
            reachable.add(`${tq},${tr}`);
        }

        // Generate a base hex grid and scale to fit mini area
        const baseRadius = 2;
        const baseDiameter = 60; // arbitrary, will scale
        const polys = generateHexGrid(baseRadius, baseDiameter, 0, 1);
        // compute bbox of base polys
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of polys) {
            for (const pt of p.points) {
                minX = Math.min(minX, pt.x);
                minY = Math.min(minY, pt.y);
                maxX = Math.max(maxX, pt.x);
                maxY = Math.max(maxY, pt.y);
            }
        }
        const baseW = maxX - minX;
        const baseH = maxY - minY;
        const pad = Math.round(8 * (DPI / 96));
        const scale = Math.min((miniAreaW - pad * 2) / baseW, (miniAreaH - pad * 2) / baseH);

        const offsetX = innerPadding + (miniAreaW / 2) - ((minX + maxX) / 2) * scale;
        const offsetY = miniAreaY + (miniAreaH / 2) - ((minY + maxY) / 2) * scale;

        const strokeW = Math.max(1, Math.round(2 * (DPI / 96)));

        // Build polygon SVGs
        const polySvgs = polys.map(p => {
            const pts = p.points.map(pt => `${pt.x * scale + offsetX},${pt.y * scale + offsetY}`).join(' ');
            const isCenter = p.q === 0 && p.r === 0;
            const isReach = reachable.has(`${p.q},${p.r}`);
            if (isCenter) {
                return `<polygon points="${pts}" fill="#000000" stroke="#ffffff" stroke-width="${Math.max(2, strokeW)}" />`;
            }
            const fill = isReach ? '#b7f0b7' : '#ffffff';
            return `<polygon points="${pts}" fill="${fill}" stroke="#333" stroke-width="${strokeW}" />`;
        }).join('\n');

        // build description lines (italic with quotes)
        const wrapLines = (text: string, max = 30) => {
            const words = text.split(/\s+/);
            const lines: string[] = [];
            let cur = '';
            for (const w of words) {
                if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
                else { lines.push(cur); cur = w; }
            }
            if (cur) lines.push(cur);
            return lines;
        };
        const descLines = wrapLines(`"${card.flavor}"`, 36);

        const descTspans = descLines.map((ln, i) => `<tspan x="${pxW / 2}" dy="${i === 0 ? 0 : Math.round(18 * (DPI / 96))}">${this.escapeXml(ln)}</tspan>`).join('');

        // Title banner: black with white text. Description sits on white background below banner.
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="0 0 ${pxW} ${pxH}">
                <rect x="0" y="0" width="${pxW}" height="${pxH}" rx="${cornerR}" fill="#f7f7f7" stroke="#000" stroke-width="${Math.round(6 * (DPI / 96))}" />
                <!-- black title banner -->
                <rect x="${innerPadding}" y="${innerPadding}" width="${pxW - innerPadding * 2}" height="${bannerH}" rx="${Math.round(6 * (DPI / 96))}" fill="#000" />
                <text x="${pxW / 2}" y="${innerPadding + Math.round(bannerH / 2) + Math.round(8 * (DPI / 96))}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(26 * (DPI / 96))}" fill="#fff" text-anchor="middle" font-weight="700">${this.escapeXml(card.title)}</text>

                <!-- white description area below banner -->
                <rect x="${innerPadding}" y="${descAreaY}" width="${pxW - innerPadding * 2}" height="${Math.max(0, descAreaH)}" rx="${Math.round(6 * (DPI / 96))}" fill="#fff" />
                <text x="${pxW / 2}" y="${descAreaY + Math.round(18 * (DPI / 96))}" font-family="Georgia,serif" font-size="${Math.round(14 * (DPI / 96))}" fill="#222" text-anchor="middle" font-style="italic">
                    ${descTspans}
                </text>

                <!-- mini-board area -->
                <g>
                    ${polySvgs}
                </g>
            </svg>`;
        return svg;
    }

    escapeXml(s: string) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    printCards() {
        if (!this.cards || this.cards.length === 0) return;
        const DPI = 300;
        const pxW = Math.round(2.5 * DPI);
        const pxH = Math.round(3.5 * DPI);

        const cardSvgs = this.cards.map(c => this.buildCardSVG(c, pxW, pxH, DPI));

        // Build HTML with many card containers sized in inches for printing
        const css = `
            @page { size: letter; margin: 0.25in; }
            html,body{margin:0;padding:0}
            body{display:flex;flex-wrap:wrap;gap:0.25in;padding:0.25in}
            .card{width:2.5in;height:3.5in;box-sizing:border-box}
            .card svg{width:100%;height:100%}
        `;

        const cardsHtml = cardSvgs.map(svg => `<div class="card">${svg}</div>`).join('\n');

        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print Cards</title><style>${css}</style></head><body>${cardsHtml}</body></html>`);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 400);
    }
}
