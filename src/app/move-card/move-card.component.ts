import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateHexGrid, HexPolygon } from '../utils/hex-grid';

type MoveKey = 'F' | 'LF' | 'RF' | 'B' | 'LB' | 'RB';

const DIRECTION_MAP: Record<MoveKey, [number, number]> = {
    // maps to axial directions (q, r) matching hex-grid's directions mapping
    F: [0, -1],
    RF: [1, -1],
    LF: [-1, 0],
    B: [0, 1],
    RB: [1, 0],
    LB: [-1, 1],
};

@Component({
    selector: 'move-card',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './move-card.component.html',
    styleUrls: ['./move-card.component.scss'],
})
export class MoveCardComponent {
    title = 'Tactical Move';
    description = 'A short flavorful description.';

    // Movement state
    moves: Record<
        MoveKey,
        { enabled: boolean; dist1: boolean; dist2: boolean }
    > = {
            F: { enabled: true, dist1: true, dist2: false },
            LF: { enabled: false, dist1: false, dist2: false },
            RF: { enabled: false, dist1: false, dist2: false },
            B: { enabled: false, dist1: false, dist2: false },
            LB: { enabled: false, dist1: false, dist2: false },
            RB: { enabled: false, dist1: false, dist2: false },
        };

    // mini-board
    radius = 2;
    diameter = 36;
    border = 1.2;
    rotation = 30; // overall board rotation desired

    polygons: HexPolygon[] = [];
    reachable = new Set<string>();

    // viewbox/pixel size for printing
    viewBoxStr = '0 0 200 200';
    viewBoxW = 200;
    viewBoxH = 200;
    centerX = 0;
    centerY = 0;

    @ViewChild('card', { static: false }) card?: ElementRef<HTMLElement>;

    directionOrder: MoveKey[] = ['LF', 'F', 'RF', 'RB', 'B', 'LB'];

    ngOnInit() {
        this.update();
    }

    update() {
        // regenerate polygons
        this.polygons = generateHexGrid(this.radius, this.diameter, 0, 1);

        // compute bounding box & center
        if (this.polygons.length === 0) return;
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const p of this.polygons) {
            for (const pt of p.points) {
                minX = Math.min(minX, pt.x);
                minY = Math.min(minY, pt.y);
                maxX = Math.max(maxX, pt.x);
                maxY = Math.max(maxY, pt.y);
            }
        }
        const pad = 8;
        const w = maxX - minX + pad * 2;
        const h = maxY - minY + pad * 2;
        this.viewBoxStr = `${minX - pad} ${minY - pad} ${w} ${h}`;
        this.viewBoxW = Math.ceil(w);
        this.viewBoxH = Math.ceil(h);
        this.centerX = (minX + maxX) / 2;
        this.centerY = (minY + maxY) / 2;

        // compute reachable hexes from center (q=0,r=0)
        this.reachable.clear();
        const centerQ = 0,
            centerR = 0;
        for (const key of Object.keys(this.moves) as MoveKey[]) {
            const cfg = this.moves[key];
            if (!cfg.enabled) continue;
            const [dq, dr] = DIRECTION_MAP[key];
            if (cfg.dist1) {
                const tq = centerQ + dq * 1;
                const tr = centerR + dr * 1;
                this.reachable.add(`${tq},${tr}`);
            }
            if (cfg.dist2) {
                const tq2 = centerQ + dq * 2;
                const tr2 = centerR + dr * 2;
                this.reachable.add(`${tq2},${tr2}`);
            }
        }
    }

    toPointsAttr(points: Array<{ x: number; y: number }>) {
        return points.map((p) => `${p.x},${p.y}`).join(' ');
    }

    isReachable(q: number, r: number) {
        return this.reachable.has(`${q},${r}`);
    }

    printCard() {
        if (!this.card) return;
        const el = this.card.nativeElement;
        const html = el.innerHTML;
        // Open a print window sized to standard playing card dimensions (2.5in x 3.5in)
        const w = window.open('', '_blank', 'width=600,height=900');
        if (!w) return;
        const css = `
                    @page { size: 2.5in 3.5in; margin: 0; }
                    html,body{width:2.5in;height:3.5in;margin:0;padding:0}
                    body{display:flex;align-items:center;justify-content:center}
                    .card{width:2.4in;height:3.4in;box-sizing:border-box}
                `;
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${this.title}</title>
            <style>${css}</style>
            </head><body><div class="card">${html}</div></body></html>`);
        w.document.close();
        // Wait a tick for rendering then print
        setTimeout(() => { w.focus(); w.print(); }, 200);
    }

    // setDistance(key: MoveKey, which: 1 | 2) {
    //     // exclusive behavior: selecting one distance will set that distance
    //     this.moves[key].distance = which;
    //     this.update();
    // }

    async exportPNG() {
        if (!this.card) return;
        const el = this.card.nativeElement as HTMLElement;
        // Build a standalone SVG that includes the mini-board SVG and text elements.
        const miniSvgEl = el.querySelector('svg');
        const miniSvg = miniSvgEl ? miniSvgEl.outerHTML : '';

        // Use 300 DPI for high-quality print PNG: 2.5in * 300 = 750px, 3.5in * 300 = 1050px
        const DPI = 300;
        const width = Math.round(2.5 * DPI);
        const height = Math.round(3.5 * DPI);

        // place title at top, mini board left, description below title
        const titleY = 30;
        const miniX = 18;
        const miniY = 60;

        // Escape the miniSvg for embedding as data URL
        const miniSvgEncoded = encodeURIComponent(miniSvg);
        const miniDataUrl = `data:image/svg+xml;charset=utf-8,${miniSvgEncoded}`;

        // produce a Pokémon-like card layout: rounded rect, title banner, framed mini-board and wrapped flavor text
        const cornerR = Math.round(24 * (DPI / 96));
        const bannerH = Math.round(60 * (DPI / 96));
        const innerPadding = Math.round(24 * (DPI / 96));
        const miniW = Math.round(180 * (DPI / 96));
        const miniH = Math.round(140 * (DPI / 96));
        const miniPosX = innerPadding;
        const miniPosY = bannerH + Math.round(18 * (DPI / 96));

        const wrapLines = (text: string, max = 28) => {
            const words = text.split(/\s+/);
            const lines: string[] = [];
            let cur = '';
            for (const w of words) {
                if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
                else {
                    lines.push(cur);
                    cur = w;
                }
            }
            if (cur) lines.push(cur);
            return lines;
        };

        const descLines = wrapLines(this.description || '', 30);
        const descStartX = miniPosX + miniW + Math.round(12 * (DPI / 96));
        const descStartY = miniPosY + Math.round(12 * (DPI / 96));

        const textTspans = descLines
            .map((ln, i) => `<tspan x="${descStartX}" dy="${i === 0 ? 0 : 18}">${ln}</tspan>`)
            .join('');

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <defs>
                    <linearGradient id="bannerGrad" x1="0" x2="1">
                        <stop offset="0" stop-color="#ffd966" />
                        <stop offset="1" stop-color="#ffb84d" />
                    </linearGradient>
                </defs>
                <!-- outer background -->
                <rect x="0" y="0" width="${width}" height="${height}" rx="${cornerR}" ry="${cornerR}" fill="#f7f7f7" stroke="#000" stroke-width="${Math.round(6 * (DPI / 96))}" />
                <!-- inner white card surface -->
                <rect x="${innerPadding}" y="${innerPadding}" width="${width - innerPadding * 2}" height="${height - innerPadding * 2}" rx="${cornerR - Math.round(6 * (DPI / 96))}" fill="#ffffff" />
                <!-- title banner -->
                <rect x="${innerPadding + Math.round(6 * (DPI / 96))}" y="${innerPadding + Math.round(6 * (DPI / 96))}" width="${width - (innerPadding + Math.round(6 * (DPI / 96))) * 2}" height="${bannerH}" rx="${Math.round(8 * (DPI / 96))}" fill="url(#bannerGrad)" />
                <text x="${width / 2}" y="${innerPadding + Math.round(6 * (DPI / 96)) + bannerH / 2 + Math.round(6 * (DPI / 96))}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(20 * (DPI / 96))}" fill="#111" text-anchor="middle" font-weight="700">${this.title}</text>

                <!-- mini-board image framed -->
                <rect x="${miniPosX - Math.round(6 * (DPI / 96))}" y="${miniPosY - Math.round(6 * (DPI / 96))}" width="${miniW + Math.round(12 * (DPI / 96))}" height="${miniH + Math.round(12 * (DPI / 96))}" rx="${Math.round(8 * (DPI / 96))}" fill="#f0f0f0" stroke="#222" />
                <image href="${miniDataUrl}" x="${miniPosX}" y="${miniPosY}" width="${miniW}" height="${miniH}" />

                <!-- description area -->
                <text x="${descStartX}" y="${descStartY}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(12 * (DPI / 96))}" fill="#333">
                    ${textTspans}
                </text>
            </svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `${this.title.replace(/\s+/g, '_')}.png`;
                a.click();
            } catch (err) {
                console.error('Export failed', err);
                URL.revokeObjectURL(url);
            }
        };
        img.onerror = (e) => {
            console.error('Image load error', e);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
}
