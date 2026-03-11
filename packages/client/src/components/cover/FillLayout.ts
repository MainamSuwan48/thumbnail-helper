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

/**
 * Single-row (horizontal gap) or single-column (vertical gap) layout.
 *
 * Cover-fit the row as a unit: scale up to fill BOTH dimensions of the gap,
 * center, and let the canvas clip group trim overflow. Images keep their
 * natural aspect ratio — they just lose a tiny bit of edge.
 */
function layoutSingleLine(
  gap: GapRegion,
  images: CoverImage[],
  isVertical: boolean,
): LayoutRect[] {
  if (images.length === 0) return [];
  const rects: LayoutRect[] = [];

  if (!isVertical) {
    // Horizontal gap: single row
    // 1. Natural widths at gap.height
    const naturalWidths = images.map((img) =>
      gap.height * (img.naturalWidth / img.naturalHeight),
    );
    const totalNaturalW = naturalWidths.reduce((sum, w) => sum + w, 0);

    // 2. Cover-fit: use the LARGER scale so both dimensions are filled
    const scaleW = gap.width / totalNaturalW;  // scale to fill width
    const scaleH = 1;                          // already at gap.height
    const scale = Math.max(scaleW, scaleH);    // pick larger → no black space

    const rowH = gap.height * scale;
    const totalW = totalNaturalW * scale;

    // 3. Center in gap (overflow clipped)
    const offsetX = gap.x + (gap.width - totalW) / 2;
    const offsetY = gap.y + (gap.height - rowH) / 2;

    let x = offsetX;
    for (let i = 0; i < images.length; i++) {
      const w = naturalWidths[i] * scale;
      rects.push({
        imageId: images[i].id,
        x,
        y: offsetY,
        width: w,
        height: rowH,
      });
      x += w;
    }
  } else {
    // Vertical gap: single column
    // 1. Natural heights at gap.width
    const naturalHeights = images.map((img) =>
      gap.width / (img.naturalWidth / img.naturalHeight),
    );
    const totalNaturalH = naturalHeights.reduce((sum, h) => sum + h, 0);

    // 2. Cover-fit: use the LARGER scale
    const scaleH = gap.height / totalNaturalH;
    const scaleW = 1;
    const scale = Math.max(scaleH, scaleW);

    const colW = gap.width * scale;
    const totalH = totalNaturalH * scale;

    // 3. Center in gap (overflow clipped)
    const offsetX = gap.x + (gap.width - colW) / 2;
    const offsetY = gap.y + (gap.height - totalH) / 2;

    let y = offsetY;
    for (let i = 0; i < images.length; i++) {
      const h = naturalHeights[i] * scale;
      rects.push({
        imageId: images[i].id,
        x: offsetX,
        y,
        width: colW,
        height: h,
      });
      y += h;
    }
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
    allRects.push(...layoutSingleLine(gap, selected, isVertical));
  }

  return allRects;
}
