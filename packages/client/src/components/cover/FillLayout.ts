import type { CoverImage } from '../../store/coverStore';

export interface LayoutRect {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GapRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Simple seeded PRNG (mulberry32) */
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shuffle array using seeded RNG */
function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Compute gap regions left by the main image in a square canvas.
 * Horizontal main → pinned to top, gap below.
 * Vertical main → pinned to right, gap on left.
 */
export function computeGapRegions(
  canvasSize: number,
  mainW: number,
  mainH: number,
): GapRegion[] {
  const aspect = mainW / mainH;
  const gaps: GapRegion[] = [];

  if (aspect >= 1) {
    const fitH = canvasSize / aspect;
    const gapH = canvasSize - fitH;
    if (gapH > 1) {
      gaps.push({ x: 0, y: fitH, width: canvasSize, height: gapH });
    }
  } else {
    const fitW = canvasSize * aspect;
    const gapW = canvasSize - fitW;
    if (gapW > 1) {
      gaps.push({ x: 0, y: 0, width: gapW, height: canvasSize });
    }
  }
  return gaps;
}

/**
 * Compute main image position and size.
 */
export function computeMainImageRect(
  canvasSize: number,
  mainW: number,
  mainH: number,
): { x: number; y: number; width: number; height: number } {
  const aspect = mainW / mainH;
  if (aspect >= 1) {
    const fitH = canvasSize / aspect;
    return { x: 0, y: 0, width: canvasSize, height: fitH };
  } else {
    const fitW = canvasSize * aspect;
    return { x: canvasSize - fitW, y: 0, width: fitW, height: canvasSize };
  }
}

// ── Justified Grid Layout ────────────────────────────────────────────────────

interface RowData {
  images: CoverImage[];
  aspects: number[];
  totalAspect: number;
}

/**
 * Greedy row packing: split images into rows targeting a given row height.
 * Each row accumulates images until its natural width >= gap width.
 */
function packRows(
  images: CoverImage[],
  gapW: number,
  targetRowH: number,
): RowData[] {
  const rows: RowData[] = [];
  let current: RowData = { images: [], aspects: [], totalAspect: 0 };

  for (const img of images) {
    const aspect = img.naturalWidth / img.naturalHeight;
    current.images.push(img);
    current.aspects.push(aspect);
    current.totalAspect += aspect;

    // Row natural width at targetRowH
    const rowNaturalW = current.totalAspect * targetRowH;
    if (rowNaturalW >= gapW && current.images.length > 0) {
      rows.push(current);
      current = { images: [], aspects: [], totalAspect: 0 };
    }
  }

  // Remaining images go into the last row
  if (current.images.length > 0) {
    if (rows.length > 0 && current.images.length === 1) {
      // Single leftover image: merge into last row for better balance
      const last = rows[rows.length - 1];
      last.images.push(...current.images);
      last.aspects.push(...current.aspects);
      last.totalAspect += current.totalAspect;
    } else {
      rows.push(current);
    }
  }

  return rows;
}

/**
 * Same as packRows but for columns (vertical gap).
 */
function packColumns(
  images: CoverImage[],
  gapH: number,
  targetColW: number,
): RowData[] {
  const cols: RowData[] = [];
  let current: RowData = { images: [], aspects: [], totalAspect: 0 };

  for (const img of images) {
    const invAspect = img.naturalHeight / img.naturalWidth;
    current.images.push(img);
    current.aspects.push(invAspect);
    current.totalAspect += invAspect;

    const colNaturalH = current.totalAspect * targetColW;
    if (colNaturalH >= gapH && current.images.length > 0) {
      cols.push(current);
      current = { images: [], aspects: [], totalAspect: 0 };
    }
  }

  if (current.images.length > 0) {
    if (cols.length > 0 && current.images.length === 1) {
      const last = cols[cols.length - 1];
      last.images.push(...current.images);
      last.aspects.push(...current.aspects);
      last.totalAspect += current.totalAspect;
    } else {
      cols.push(current);
    }
  }

  return cols;
}

/**
 * Multi-row justified layout for a horizontal gap.
 *
 * 1. Estimate ideal row count from combined aspect ratios
 * 2. Greedy-pack images into rows at target height
 * 3. Justify each row to fill gap width exactly
 * 4. Cover-fit: scale all rows uniformly so total height fills gap
 */
function layoutHorizontalGap(
  gap: GapRegion,
  images: CoverImage[],
): LayoutRect[] {
  if (images.length === 0) return [];

  const aspects = images.map((img) => img.naturalWidth / img.naturalHeight);
  const totalAspect = aspects.reduce((sum, a) => sum + a, 0);

  // Ideal row count: balances row height vs density
  const idealRows = Math.max(1, Math.round(
    Math.sqrt(totalAspect * gap.height / gap.width),
  ));
  const targetRowH = gap.height / idealRows;

  // Pack into rows
  const rows = packRows(images, gap.width, targetRowH);

  // Justify each row: compute justified heights
  const justifiedHeights = rows.map((row) =>
    gap.width / row.totalAspect,
  );
  const totalJustifiedH = justifiedHeights.reduce((sum, h) => sum + h, 0);

  // Cover-fit: scale up so rows fill gap height (use max scale for no black space)
  const scale = Math.max(gap.height / totalJustifiedH, 1);
  const totalScaledH = totalJustifiedH * scale;

  // Center vertically (overflow clipped by canvas)
  const offsetY = gap.y + (gap.height - totalScaledH) / 2;

  const rects: LayoutRect[] = [];
  let y = offsetY;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowH = justifiedHeights[r] * scale;
    let x = gap.x;

    for (let i = 0; i < row.images.length; i++) {
      const w = row.aspects[i] * rowH;
      rects.push({
        imageId: row.images[i].id,
        x,
        y,
        width: w,
        height: rowH,
      });
      x += w;
    }
    y += rowH;
  }

  return rects;
}

/**
 * Multi-column justified layout for a vertical gap.
 */
function layoutVerticalGap(
  gap: GapRegion,
  images: CoverImage[],
): LayoutRect[] {
  if (images.length === 0) return [];

  const invAspects = images.map((img) => img.naturalHeight / img.naturalWidth);
  const totalInvAspect = invAspects.reduce((sum, a) => sum + a, 0);

  const idealCols = Math.max(1, Math.round(
    Math.sqrt(totalInvAspect * gap.width / gap.height),
  ));
  const targetColW = gap.width / idealCols;

  const cols = packColumns(images, gap.height, targetColW);

  const justifiedWidths = cols.map((col) =>
    gap.height / col.totalAspect,
  );
  const totalJustifiedW = justifiedWidths.reduce((sum, w) => sum + w, 0);

  const scale = Math.max(gap.width / totalJustifiedW, 1);
  const totalScaledW = totalJustifiedW * scale;

  const offsetX = gap.x + (gap.width - totalScaledW) / 2;

  const rects: LayoutRect[] = [];
  let x = offsetX;

  for (let c = 0; c < cols.length; c++) {
    const col = cols[c];
    const colW = justifiedWidths[c] * scale;
    let y = gap.y;

    for (let i = 0; i < col.images.length; i++) {
      const h = col.aspects[i] * colW;
      rects.push({
        imageId: col.images[i].id,
        x,
        y,
        width: colW,
        height: h,
      });
      y += h;
    }
    x += colW;
  }

  return rects;
}

/**
 * Main entry: compute fill layout for all gap regions.
 *
 * fillCount — exact number of images to display (controlled by slider).
 * fillSeed — shuffle seed for randomizing which images are picked.
 */
export function computeFillLayout(
  canvasSize: number,
  mainImage: CoverImage | null,
  fillPool: CoverImage[],
  fillCount: number,
  fillSeed: number,
): LayoutRect[] {
  if (!mainImage || fillPool.length === 0) return [];

  const gaps = computeGapRegions(canvasSize, mainImage.naturalWidth, mainImage.naturalHeight);
  if (gaps.length === 0) return [];

  const isVertical = mainImage.naturalWidth / mainImage.naturalHeight < 1;

  // Shuffle pool
  const seedInt = Math.floor(fillSeed * 2147483647);
  const rng = seededRng(seedInt);
  const shuffled = shuffleArray(fillPool, rng);

  // Take exactly fillCount images (clamped to pool size)
  const count = Math.max(1, Math.min(fillCount, shuffled.length));
  const selected = shuffled.slice(0, count);

  const allRects: LayoutRect[] = [];
  for (const gap of gaps) {
    if (isVertical) {
      allRects.push(...layoutVerticalGap(gap, selected));
    } else {
      allRects.push(...layoutHorizontalGap(gap, selected));
    }
  }

  return allRects;
}
