import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateHexGrid, HexPolygon } from '../utils/hex-grid';

@Component({
  selector: 'hex-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hex-board.component.html',
  styleUrls: ['./hex-board.component.scss'],
})
export class HexBoardComponent {
  radius = 2;
  diameter = 80; // px between opposite corners
  border = 2; // stroke width
  rotation = 0; // degrees
  spacing = 1;

  polygons: HexPolygon[] = [];

  rotationOptions = [0, 30, 90, 150];

  @ViewChild('board', { static: false }) board?: ElementRef<HTMLElement>;

  // computed viewBox and center for rotation
  viewBoxStr = '0 0 400 400';
  centerX = 0;
  centerY = 0;
  viewBoxW = 400;
  viewBoxH = 400;

  generate() {
    const r = Math.max(0, Math.floor(this.radius));
    const d = Math.max(4, Number(this.diameter));
    this.polygons = generateHexGrid(r, d, 0, Number(this.spacing));

    // compute bounding box and center
    if (this.polygons.length === 0) {
      this.viewBoxStr = '0 0 400 400';
      this.centerX = 200;
      this.centerY = 200;
      return;
    }

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
    const pad = Math.max(20, this.border * 2 + 8);
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    this.viewBoxStr = `${minX - pad} ${minY - pad} ${w} ${h}`;
    this.viewBoxW = Math.ceil(w);
    this.viewBoxH = Math.ceil(h);

    // center for rotation (geometric center)
    this.centerX = (minX + maxX) / 2;
    this.centerY = (minY + maxY) / 2;
  }

  ngOnInit() {
    this.generate();
  }

  printBoard() {
    if (!this.board) return;
    // Grab the SVG element and print it with explicit pixel dimensions so it's not clipped
    const svgEl = this.board.nativeElement.querySelector('svg');
    const svgHtml = svgEl ? svgEl.outerHTML : this.board.nativeElement.innerHTML;

    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) return;
    const svgWithSize = svgHtml.replace(/<svg([^>]*)>/, `<svg$1 width="${this.viewBoxW}px" height="${this.viewBoxH}px" preserveAspectRatio="xMidYMid meet">`);

    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print Hex Board</title>
      <style>html,body{height:100%;margin:0} svg{display:block;max-width:100%;height:auto}</style>
      </head><body>${svgWithSize}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  get viewBox(): string {
    return this.viewBoxStr;
  }

  get groupTransform(): string {
    // rotate around the calculated center
    return `rotate(${Number(this.rotation || 0)} ${this.centerX} ${this.centerY})`;
  }

  toPointsAttr(points: Array<{ x: number; y: number }>) {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  }
}
