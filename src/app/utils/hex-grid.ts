export interface HexPolygon {
  q: number;
  r: number;
  x: number;
  y: number;
  points: Array<{ x: number; y: number }>;
}

/**
 * Generate a hex grid (axial coordinates) and polygon points for each hex.
 * - radius: number of rings around the center (r=1 => 1 ring of 6 hexes)
 * - diameter: distance between opposite vertices (point-to-point)
 * - rotationDeg: rotation to apply to the hexagon vertices
 * - spacing: optional extra spacing multiplier between hex centers (1 = snug)
 */
export function generateHexGrid(
  radius: number,
  diameter: number,
  // rotationDeg is intentionally ignored here; rotate the whole board in the SVG instead
  _rotationDeg = 0,
  spacing = 1
): HexPolygon[] {
  const size = diameter / 2; // radius from center to a corner
  const results: HexPolygon[] = [];

  // axial directions for ring generation
  const directions = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];

  // center
  const addHex = (q: number, r: number) => {
    // pointy-top axial to pixel conversion
    const x = size * Math.sqrt(3) * (q + r / 2) * spacing;
    const y = size * (3 / 2) * r * spacing;

    const points: Array<{ x: number; y: number }> = [];
    // Keep per-hex vertices unrotated here; the component will rotate the entire group.
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30); // -30 to make pointy-top default
      const px = x + size * Math.cos(angle) * spacing;
      const py = y + size * Math.sin(angle) * spacing;
      points.push({ x: px, y: py });
    }

    results.push({ q, r, x, y, points });
  };

  addHex(0, 0);

  for (let k = 1; k <= radius; k++) {
    // start at cube direction
    let q = -k;
    let r = k;
    for (let side = 0; side < 6; side++) {
      const [dq, dr] = directions[side];
      for (let step = 0; step < k; step++) {
        addHex(q, r);
        q += dq;
        r += dr;
      }
    }
  }

  return results;
}
