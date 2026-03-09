# Thumbnail Helper — Project Summary

> Written for Cursor/AI agent handoff. Updated: 2026-03-09.

## What this app does
A desktop tool for composing YouTube-style thumbnail banners. You drop images into columns, apply filters (blur/pixelate), paint a brush mask, add overlay elements (pic-count badge, mascot), then export a PNG saved to `~/Pictures/thumbnail-helper/`.

## Stack
| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces |
| Client | React 18 + Vite + TypeScript |
| Canvas | react-konva (Konva.js) |
| State | Zustand |
| Styling | Tailwind CSS (dark theme) |
| Server | Fastify + Sharp (export only) |

Run with `pnpm dev` from root.

## Repository layout
```
packages/
  client/src/
    components/
      BannerCanvas.tsx      ← main Konva stage, columns, brush painting
      overlay/
        OverlayLayer.tsx    ← Konva overlay nodes (PicCount, Mascot)
      OverlayPanel.tsx      ← bottom panel controls for overlays
      Toolbar.tsx           ← top bar (dimensions, columns, slant, export)
      Sidebar.tsx           ← image file list + drag-to-column
      FilterPanel.tsx       ← column-wide filter controls
      BrushPanel.tsx        ← brush mode controls
    store/
      bannerStore.ts        ← columns, canvas size, brush state
      overlayStore.ts       ← overlay element state (PicCount, Mascot)
    utils/
      font.ts               ← loads FOT-Yuruka Std from /fot-yuruka-std.ttf
      mascotOutline.ts      ← canvas outline effect for mascot PNG
    types/index.ts
  server/                   ← Fastify POST /api/export/banner
public/
  fot-yuruka-std.ttf        ← custom font (FOT-Yuruka Std)
  your-logo.png             ← logo asset
```

## Key architecture decisions

### Column rendering (BannerCanvas.tsx)
- Each column is a Konva `<Group>` with a parallelogram `clipFunc` for the slant effect.
- **First column fix**: clip starts at `(0,0)` not `(slantPx,0)` so the top-left corner is filled by the leftmost image (no black triangle).
- Two Konva image nodes per column: original image + brush-result canvas on top.
- Column widths are stored as `widthRatio` (0–1 fractions summing to 1); dividers are draggable.
- `slantPx` controls the horizontal offset of the top edge of each divider line.

### Brush mask system
- Per-column `HTMLCanvasElement` (mask) painted with 2D API; composited into a result canvas via `compositeResult()`.
- Brush undo/redo: snapshot `ImageData` stack per column (max 20), exposed via `brushActions` module object and `BannerCanvasHandle` ref.
- Filter types: `blur` (CSS filter) or `pixelate` (scale-down/scale-up trick).

### Overlay system (overlayStore + OverlayLayer)
Two overlay elements remain:
1. **PicCount** (`#` button) — large text badge showing a number. Supports: font size, color, opacity, drop shadow, **stroke** (color + width, `fillAfterStrokeEnabled` so fill renders on top of stroke).
2. **Mascot** (`M` button) — draggable/resizable PNG with optional canvas-drawn outline.

`logoBadge` (creator name) has been **removed** entirely.

### Font
`OVERLAY_FONT` = `'FOT-Yuruka Std', ...fallbacks`. Loaded via `FontFace` API in `main.tsx → preloadFont()` from `/fot-yuruka-std.ttf` (public root).

### Export
Client calls `stage.toDataURL()`, POSTs base64 to `/api/export/banner`, server decodes and writes PNG to `~/Pictures/thumbnail-helper/`.

## Recent changes (session 2026-03-09, part 2)
1. **Mascot resize via scroll wheel** — `onWheel` on the mascot KonvaImage scales width+height proportionally (aspect-ratio preserved). Width/Height sliders removed from OverlayPanel.
2. **Font loading fixed** — CSS `@font-face` in `index.css` now points to `/fot-yuruka-std.ttf` (public root), `font-display: block`. `preloadFont()` also awaits `document.fonts.ready`. `main.tsx` delays React render until font promise resolves, so Konva gets the custom font on first draw.
3. **"Images" decorative text** — HTML overlay div (`ImagesLetters` component in `BannerCanvas.tsx`). 6 independent `<span>` elements, one per letter, each with a hardcoded `rotate`/`translate` CSS transform for a playful tilt. Pastel blue (`#a8d8f0`) fill, 16px white `-webkit-text-stroke`, `paint-order: stroke fill`. Positioned absolutely at bottom-right of the default picCount location (canvas coords ~158, ~348). Scales with the canvas `scale` prop. **Not captured by Konva export** (HTML only).
4. **Logo at bottom-right** — `LogoImage` component in `OverlayLayer.tsx` renders `/your-logo.png` as a Konva Image 160px wide, proportional height, 20px margin from bottom-right corner. **Is captured in export**.
5. **Default stroke** — picCount now defaults to `strokeEnabled: true`, `strokeColor: '#ffffff'`, `strokeWidth: 16`.

## Recent changes (session 2026-03-09, part 1)
1. **Font path fixed** — `font.ts` now points to `/fot-yuruka-std.ttf` (public root).
2. **Slant black spot fixed** — first column clip starts at `(0,0)`, filling the top-left corner with the leftmost image.
3. **Creator name removed** — `logoBadge` overlay fully deleted from store, canvas layer, panel, and toolbar.
4. **Stroke added to PicCount text** — `strokeEnabled`, `strokeColor`, `strokeWidth` in store; Konva `Text` uses `fillAfterStrokeEnabled` so fill sits on top of stroke. Controls appear in OverlayPanel when stroke checkbox is on.

## TODOs / potential next features
- Logo image (`your-logo.png`) not yet wired up as a canvas overlay — could be added as a new `logoImage` overlay type.
- Drag-to-reorder columns not implemented.
- No per-column brightness/contrast/saturation controls yet.
- Export pixelRatio is hardcoded to 1 — could add 2× for retina.
