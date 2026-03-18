// ── Divider-based layout for Cover Maker ────────────────────────────────────
// Main image occupies one cell, fill images occupy the remaining gap,
// split by user-draggable dividers.

export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageInCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isVerticalMain(naturalW: number, naturalH: number): boolean {
  return naturalW / naturalH < 1;
}

/** Seeded PRNG (mulberry32) */
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Compute which fill images go in which cells, respecting:
 *  - cellAssignments (explicit user picks override shuffle)
 *  - seeded shuffle for the remaining cells
 */
export function computeSelectedFill<T extends { id: string }>(
  pool: T[],
  fillCount: number,
  fillSeed: number,
  cellAssignments: Record<number, string>,
): (T | null)[] {
  const count = fillCount;
  const result: (T | null)[] = new Array(count).fill(null);
  const usedIds = new Set<string>();

  // 1. Place explicitly assigned images
  for (let i = 0; i < count; i++) {
    const assignedId = cellAssignments[i];
    if (assignedId) {
      const img = pool.find((p) => p.id === assignedId);
      if (img) {
        result[i] = img;
        usedIds.add(img.id);
      }
    }
  }

  // 2. Shuffle remaining pool images for unassigned cells
  const remaining = pool.filter((p) => !usedIds.has(p.id));
  const seedInt = Math.floor(fillSeed * 2147483647);
  const rng = seededRng(seedInt);
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }

  // 3. Fill unassigned cells from shuffled remainder
  let ri = 0;
  for (let i = 0; i < count; i++) {
    if (!result[i] && ri < remaining.length) {
      result[i] = remaining[ri++];
    }
  }

  return result;
}

/**
 * Auto-compute a reasonable mainDividerPos from image aspect ratio.
 * Horizontal → fraction of canvas height the main takes.
 * Vertical   → fraction of canvas width the main takes.
 */
export function autoMainDividerPos(naturalW: number, naturalH: number): number {
  const aspect = naturalW / naturalH;
  if (aspect >= 1) {
    // Horizontal: fit-to-width → height = canvasSize / aspect
    // Ratio = (canvasSize / aspect) / canvasSize = 1 / aspect
    return Math.max(0.3, Math.min(0.8, 1 / aspect));
  } else {
    // Vertical: fit-to-height → width = canvasSize * aspect
    // Ratio = (canvasSize * aspect) / canvasSize = aspect
    return Math.max(0.3, Math.min(0.8, aspect));
  }
}

/**
 * Generate equal-spaced dividers for N cells → N-1 divider positions.
 */
export function equalDividers(count: number): number[] {
  if (count <= 1) return [];
  return Array.from({ length: count - 1 }, (_, i) => (i + 1) / count);
}

/**
 * Compute the main image cell rect.
 * Horizontal: top portion.  Vertical: right portion.
 */
export function computeMainCell(
  canvasSize: number,
  mainDividerPos: number,
  vertical: boolean,
): CellRect {
  if (vertical) {
    const mainW = canvasSize * mainDividerPos;
    return { x: canvasSize - mainW, y: 0, width: mainW, height: canvasSize };
  } else {
    const mainH = canvasSize * mainDividerPos;
    return { x: 0, y: 0, width: canvasSize, height: mainH };
  }
}

/**
 * Compute fill cell rects from divider positions.
 * Horizontal main → fill cells are columns below the main.
 * Vertical main   → fill cells are rows to the left of the main.
 */
export function computeFillCells(
  canvasSize: number,
  mainDividerPos: number,
  fillDividers: number[],
  fillCount: number,
  vertical: boolean,
): CellRect[] {
  const cells: CellRect[] = [];

  if (vertical) {
    // Fill area is on the left
    const fillW = canvasSize * (1 - mainDividerPos);
    const fillH = canvasSize;
    const fillX = 0;
    const fillY = 0;

    // Dividers split vertically (rows)
    const breaks = [0, ...fillDividers.slice(0, fillCount - 1), 1];
    for (let i = 0; i < fillCount; i++) {
      const y0 = breaks[i] * fillH;
      const y1 = breaks[i + 1] * fillH;
      cells.push({ x: fillX, y: fillY + y0, width: fillW, height: y1 - y0 });
    }
  } else {
    // Fill area is below
    const fillX = 0;
    const fillY = canvasSize * mainDividerPos;
    const fillW = canvasSize;
    const fillH = canvasSize - fillY;

    // Dividers split horizontally (columns)
    const breaks = [0, ...fillDividers.slice(0, fillCount - 1), 1];
    for (let i = 0; i < fillCount; i++) {
      const x0 = breaks[i] * fillW;
      const x1 = breaks[i + 1] * fillW;
      cells.push({ x: fillX + x0, y: fillY, width: x1 - x0, height: fillH });
    }
  }

  return cells;
}

/**
 * Cover-fit an image into a cell, then apply user pan + zoom.
 * Returns the image draw rect (may extend beyond cell — caller clips).
 */
export function computeImageInCell(
  cell: CellRect,
  naturalW: number,
  naturalH: number,
  panX: number,
  panY: number,
  zoom: number,
): ImageInCell {
  // Cover-fit: scale so image fully covers cell
  const baseScale = Math.max(cell.width / naturalW, cell.height / naturalH);
  const effectiveScale = baseScale * zoom;
  const imgW = naturalW * effectiveScale;
  const imgH = naturalH * effectiveScale;

  // Center in cell, then offset by pan
  const x = cell.x + (cell.width - imgW) / 2 + panX;
  const y = cell.y + (cell.height - imgH) / 2 + panY;

  return { x, y, width: imgW, height: imgH };
}
