import {
  useRef,
  useCallback,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Stage, Layer, Group, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useCoverStore, coverUid } from '../../store/coverStore';
import type { CoverImage } from '../../store/coverStore';
import {
  isVerticalMain,
  computeMainCell,
  computeFillCells,
  computeImageInCell,
  computeSelectedFill,
  type CellRect,
} from './FillLayout';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CoverCanvasHandle {
  exportCover: () => Promise<string | null>;
}

interface CoverCanvasProps {
  scale: number;
  onImagesDropped?: (files: { name: string; url: string }[]) => void;
}

// ── CellImage: clipped, draggable, zoomable image in a cell ─────────────────

function CellImage({
  cell,
  imageUrl,
  naturalW,
  naturalH,
  panX,
  panY,
  zoom,
  selected,
  onPanChange,
  onZoomChange,
  onClick,
}: {
  cell: CellRect;
  imageUrl: string;
  naturalW: number;
  naturalH: number;
  panX: number;
  panY: number;
  zoom: number;
  selected?: boolean;
  onPanChange: (x: number, y: number) => void;
  onZoomChange: (z: number) => void;
  onClick?: () => void;
}) {
  const [img] = useImage(imageUrl);
  const dragStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const imgRect = useMemo(
    () => computeImageInCell(cell, naturalW, naturalH, panX, panY, zoom),
    [cell, naturalW, naturalH, panX, panY, zoom],
  );

  if (!img) return null;

  return (
    <Group
      clipX={cell.x}
      clipY={cell.y}
      clipWidth={cell.width}
      clipHeight={cell.height}
    >
      <KonvaImage
        image={img}
        x={imgRect.x}
        y={imgRect.y}
        width={imgRect.width}
        height={imgRect.height}
        draggable
        onDragStart={(e) => {
          didDrag.current = false;
          dragStart.current = { x: e.target.x(), y: e.target.y() };
        }}
        onDragMove={() => {
          didDrag.current = true;
        }}
        onDragEnd={(e) => {
          const dx = e.target.x() - dragStart.current.x;
          const dy = e.target.y() - dragStart.current.y;
          // Reset node position (we track pan in state, not node position)
          e.target.x(imgRect.x);
          e.target.y(imgRect.y);
          onPanChange(panX + dx, panY + dy);
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
          const newZoom = Math.max(1, Math.min(5, zoom * delta));
          onZoomChange(newZoom);
        }}
        onClick={() => {
          if (!didDrag.current) onClick?.();
        }}
        onTap={() => onClick?.()}
      />
      {/* Selection outline — neon glow */}
      {selected && (
        <>
          <Rect
            x={cell.x}
            y={cell.y}
            width={cell.width}
            height={cell.height}
            stroke="#ff1e64"
            strokeWidth={6}
            listening={false}
            shadowColor="#ff1e64"
            shadowBlur={16}
            shadowOpacity={0.8}
          />
          <Rect
            x={cell.x + 3}
            y={cell.y + 3}
            width={cell.width - 6}
            height={cell.height - 6}
            stroke="#ff6b9d"
            strokeWidth={2}
            listening={false}
          />
        </>
      )}
    </Group>
  );
}

// ── Empty cell placeholder (clickable) ──────────────────────────────────────

function EmptyCell({
  cell,
  selected,
  onClick,
}: {
  cell: CellRect;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Group>
      <Rect
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        fill="#141414"
        onClick={() => onClick?.()}
        onTap={() => onClick?.()}
      />
      {/* Dashed border hint */}
      <Rect
        x={cell.x + 4}
        y={cell.y + 4}
        width={cell.width - 8}
        height={cell.height - 8}
        stroke="#333"
        strokeWidth={1}
        dash={[6, 4]}
        listening={false}
      />
      {selected && (
        <>
          <Rect
            x={cell.x}
            y={cell.y}
            width={cell.width}
            height={cell.height}
            stroke="#ff1e64"
            strokeWidth={6}
            listening={false}
            shadowColor="#ff1e64"
            shadowBlur={16}
            shadowOpacity={0.8}
          />
          <Rect
            x={cell.x + 3}
            y={cell.y + 3}
            width={cell.width - 6}
            height={cell.height - 6}
            stroke="#ff6b9d"
            strokeWidth={2}
            listening={false}
          />
        </>
      )}
    </Group>
  );
}

// ── DividerHandle: draggable border between cells ───────────────────────────
// Uses refs + imperative Konva updates only — NO React state during drag.

const DIVIDER_THICKNESS = 4;
const DIVIDER_COLOR_IDLE = 'rgba(255,255,255,0.15)';
const DIVIDER_COLOR_ACTIVE = 'rgba(255,255,255,0.6)';

function DividerHandle({
  x,
  y,
  width,
  height,
  axis,
  areaStart,
  areaSize,
  minPos,
  maxPos,
  scale,
  onDrag,
  hideForExport,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  axis: 'x' | 'y';
  areaStart: number;
  areaSize: number;
  minPos: number;
  maxPos: number;
  scale: number;
  onDrag: (newPos: number) => void;
  hideForExport: boolean;
}) {
  const rafId = useRef<number | null>(null);

  if (hideForExport) return null;

  const scaledStart = areaStart * scale;
  const scaledSize = areaSize * scale;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={DIVIDER_COLOR_IDLE}
      hitStrokeWidth={16}
      draggable
      dragBoundFunc={(pos) => {
        if (axis === 'x') {
          const raw = (pos.x - scaledStart) / scaledSize;
          const clamped = Math.max(minPos, Math.min(maxPos, raw));
          return { x: scaledStart + clamped * scaledSize, y: y * scale };
        } else {
          const raw = (pos.y - scaledStart) / scaledSize;
          const clamped = Math.max(minPos, Math.min(maxPos, raw));
          return { x: x * scale, y: scaledStart + clamped * scaledSize };
        }
      }}
      onDragStart={(e) => {
        (e.target as Konva.Rect).fill(DIVIDER_COLOR_ACTIVE);
        e.target.getLayer()?.batchDraw();
      }}
      onDragMove={(e) => {
        if (rafId.current) return;
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          const absPos = e.target.getAbsolutePosition();
          if (axis === 'x') {
            const raw = (absPos.x - scaledStart) / scaledSize;
            onDrag(Math.max(minPos, Math.min(maxPos, raw)));
          } else {
            const raw = (absPos.y - scaledStart) / scaledSize;
            onDrag(Math.max(minPos, Math.min(maxPos, raw)));
          }
        });
      }}
      onDragEnd={(e) => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        (e.target as Konva.Rect).fill(DIVIDER_COLOR_IDLE);
        const absPos = e.target.getAbsolutePosition();
        if (axis === 'x') {
          const raw = (absPos.x - scaledStart) / scaledSize;
          onDrag(Math.max(minPos, Math.min(maxPos, raw)));
        } else {
          const raw = (absPos.y - scaledStart) / scaledSize;
          onDrag(Math.max(minPos, Math.min(maxPos, raw)));
        }
      }}
      onMouseEnter={(e) => {
        (e.target as Konva.Rect).fill(DIVIDER_COLOR_ACTIVE);
        e.target.getLayer()?.batchDraw();
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
        }
      }}
      onMouseLeave={(e) => {
        (e.target as Konva.Rect).fill(DIVIDER_COLOR_IDLE);
        e.target.getLayer()?.batchDraw();
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
      }}
    />
  );
}

// ── Artist name overlay ─────────────────────────────────────────────────────

function ArtistNameOverlay({
  canvasSize,
  x,
  y,
  overlayScale,
  onDragEnd,
  onScaleChange,
}: {
  canvasSize: number;
  x: number;
  y: number;
  overlayScale: number;
  onDragEnd: (x: number, y: number) => void;
  onScaleChange: (s: number) => void;
}) {
  const [img] = useImage('/artist-name.png');
  if (!img) return null;

  const w = img.naturalWidth * overlayScale;
  const h = img.naturalHeight * overlayScale;
  const posY = y === -1 ? canvasSize - h - 20 : y;

  return (
    <KonvaImage
      image={img}
      x={x}
      y={posY}
      width={w}
      height={h}
      draggable
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onWheel={(e) => {
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
        onScaleChange(Math.max(0.02, Math.min(1, overlayScale * delta)));
      }}
    />
  );
}

// ── Cover Canvas ─────────────────────────────────────────────────────────────

export const CoverCanvas = forwardRef<CoverCanvasHandle, CoverCanvasProps>(
  function CoverCanvas({ scale, onImagesDropped }, ref) {
    const stageRef = useRef<Konva.Stage>(null);
    const exportingRef = useRef(false);
    const [isExporting, setIsExporting] = useState(false);

    const {
      canvasSize,
      mainImage,
      mainImageOverride,
      fillPool,
      fillCount,
      fillSeed,
      mainDividerPos,
      fillDividers,
      cellOverrides,
      cellAssignments,
      selectedCellId,
      artistOverlay,
      setMainImage,
      updateMainImageOverride,
      addToFillPool,
      setMainDividerPos,
      setFillDividers,
      updateCellOverride,
      setSelectedCellId,
      updateArtistOverlay,
    } = useCoverStore();

    // Determine layout orientation
    const vertical = mainImage ? isVerticalMain(mainImage.naturalWidth, mainImage.naturalHeight) : false;

    // Compute cell rects
    const mainCell = useMemo(
      () => mainImage ? computeMainCell(canvasSize, mainDividerPos, vertical) : null,
      [canvasSize, mainDividerPos, vertical, mainImage],
    );

    const fillCells = useMemo(
      () => computeFillCells(canvasSize, mainDividerPos, fillDividers, fillCount, vertical),
      [canvasSize, mainDividerPos, fillDividers, fillCount, vertical],
    );

    // Select fill images (respects cellAssignments + seeded shuffle)
    const selectedFill = useMemo(
      () => computeSelectedFill(fillPool, fillCount, fillSeed, cellAssignments),
      [fillPool, fillCount, fillSeed, cellAssignments],
    );

    // Export
    useImperativeHandle(ref, () => ({
      exportCover: async () => {
        const stage = stageRef.current;
        if (!stage) return null;
        exportingRef.current = true;
        setIsExporting(true);
        // Deselect during export
        const prevSelected = useCoverStore.getState().selectedCellId;
        useCoverStore.getState().setSelectedCellId(null);
        await new Promise((r) => setTimeout(r, 50));
        const prevScaleX = stage.scaleX();
        const prevScaleY = stage.scaleY();
        stage.scaleX(1);
        stage.scaleY(1);
        stage.batchDraw();
        const url = stage.toDataURL({ pixelRatio: 1 });
        stage.scaleX(prevScaleX);
        stage.scaleY(prevScaleY);
        stage.batchDraw();
        exportingRef.current = false;
        setIsExporting(false);
        useCoverStore.getState().setSelectedCellId(prevSelected);
        return url;
      },
    }));

    // Load image dimensions helper
    const loadImageDimensions = useCallback((url: string, name: string): Promise<CoverImage> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: coverUid(),
            url,
            name,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
        };
        img.src = url;
      });
    }, []);

    // Drop handler
    const handleDrop = useCallback(
      async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedImages: { name: string; url: string }[] = [];
        const isFromExplorer = e.dataTransfer.files.length > 0;

        if (isFromExplorer) {
          for (const file of Array.from(e.dataTransfer.files)) {
            if (!file.type.startsWith('image/')) continue;
            droppedImages.push({ name: file.name, url: URL.createObjectURL(file) });
          }
        } else {
          const url = e.dataTransfer.getData('text/plain');
          if (url) droppedImages.push({ name: '', url });
        }
        if (droppedImages.length === 0) return;

        const loaded = await Promise.all(
          droppedImages.map((d) => loadImageDimensions(d.url, d.name)),
        );

        if (!mainImage) {
          setMainImage(loaded[0]);
          if (loaded.length > 1) addToFillPool(loaded.slice(1));
        } else {
          addToFillPool(loaded);
        }

        if (isFromExplorer) onImagesDropped?.(droppedImages);
      },
      [mainImage, setMainImage, addToFillPool, loadImageDimensions, onImagesDropped],
    );

    // ── Divider drag helpers ──────────────────────────────────────────────

    const handleMainDividerDrag = useCallback(
      (newPos: number) => setMainDividerPos(newPos),
      [setMainDividerPos],
    );

    const handleFillDividerDrag = useCallback(
      (index: number, newPos: number) => {
        const next = [...useCoverStore.getState().fillDividers];
        next[index] = newPos;
        setFillDividers(next);
      },
      [setFillDividers],
    );

    // ── Divider min/max bounds ────────────────────────────────────────────

    const MIN_CELL_RATIO = 0.08;

    const fillDividerBounds = useMemo(() => {
      const count = Math.min(fillCount, selectedFill.length || fillCount);
      const divCount = Math.min(fillDividers.length, count - 1);
      const bounds: { min: number; max: number }[] = [];
      for (let i = 0; i < divCount; i++) {
        const prev = i === 0 ? 0 : fillDividers[i - 1];
        const next = i === divCount - 1 ? 1 : fillDividers[i + 1];
        bounds.push({
          min: prev + MIN_CELL_RATIO,
          max: next - MIN_CELL_RATIO,
        });
      }
      return bounds;
    }, [fillDividers, fillCount, selectedFill.length]);

    // Click on stage background → deselect
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() || e.target.attrs?.fill === '#000') {
        setSelectedCellId(null);
      }
    }, [setSelectedCellId]);

    return (
      <div
        style={{
          position: 'relative',
          width: canvasSize * scale,
          height: canvasSize * scale,
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={canvasSize}
          height={canvasSize}
          scaleX={scale}
          scaleY={scale}
          style={{ background: '#000' }}
          onClick={handleStageClick}
        >
          <Layer>
            <Group
              clipX={0}
              clipY={0}
              clipWidth={canvasSize}
              clipHeight={canvasSize}
            >
              {/* Background */}
              <Rect x={0} y={0} width={canvasSize} height={canvasSize} fill="#000" />

              {/* Fill image cells — only when main image exists */}
              {mainImage && fillCells.map((cell, i) => {
                const img = selectedFill[i];
                if (!img) {
                  return (
                    <EmptyCell
                      key={`empty-${i}`}
                      cell={cell}
                      selected={selectedCellId === i}
                      onClick={() => setSelectedCellId(selectedCellId === i ? null : i)}
                    />
                  );
                }
                const override = cellOverrides[img.id] ?? { panX: 0, panY: 0, zoom: 1 };
                return (
                  <CellImage
                    key={img.id}
                    cell={cell}
                    imageUrl={img.url}
                    naturalW={img.naturalWidth}
                    naturalH={img.naturalHeight}
                    panX={override.panX}
                    panY={override.panY}
                    zoom={override.zoom}
                    selected={selectedCellId === i}
                    onPanChange={(px, py) => updateCellOverride(img.id, { panX: px, panY: py })}
                    onZoomChange={(z) => updateCellOverride(img.id, { zoom: z })}
                    onClick={() => setSelectedCellId(selectedCellId === i ? null : i)}
                  />
                );
              })}

              {/* Main image cell */}
              {mainImage && mainCell && (
                <CellImage
                  cell={mainCell}
                  imageUrl={mainImage.url}
                  naturalW={mainImage.naturalWidth}
                  naturalH={mainImage.naturalHeight}
                  panX={mainImageOverride.panX}
                  panY={mainImageOverride.panY}
                  zoom={mainImageOverride.zoom}
                  selected={selectedCellId === 'main'}
                  onPanChange={(px, py) => updateMainImageOverride({ panX: px, panY: py })}
                  onZoomChange={(z) => updateMainImageOverride({ zoom: z })}
                  onClick={() => setSelectedCellId(selectedCellId === 'main' ? null : 'main')}
                />
              )}

              {/* ── Divider handles ── */}

              {/* Main divider */}
              {mainImage && (
                vertical ? (
                  <DividerHandle
                    x={canvasSize * (1 - mainDividerPos) - DIVIDER_THICKNESS / 2}
                    y={0}
                    width={DIVIDER_THICKNESS}
                    height={canvasSize}
                    axis="x"
                    areaStart={0}
                    areaSize={canvasSize}
                    minPos={1 - 0.85}
                    maxPos={1 - 0.2}
                    scale={scale}
                    onDrag={(raw) => handleMainDividerDrag(1 - raw)}
                    hideForExport={isExporting}
                  />
                ) : (
                  <DividerHandle
                    x={0}
                    y={canvasSize * mainDividerPos - DIVIDER_THICKNESS / 2}
                    width={canvasSize}
                    height={DIVIDER_THICKNESS}
                    axis="y"
                    areaStart={0}
                    areaSize={canvasSize}
                    minPos={0.2}
                    maxPos={0.85}
                    scale={scale}
                    onDrag={handleMainDividerDrag}
                    hideForExport={isExporting}
                  />
                )
              )}

              {/* Fill sub-dividers */}
              {mainImage && fillDividerBounds.map((bounds, i) => {
                if (vertical) {
                  const fillH = canvasSize;
                  const fillW = canvasSize * (1 - mainDividerPos);
                  const divY = fillDividers[i] * fillH;
                  return (
                    <DividerHandle
                      key={`fd-${i}`}
                      x={0}
                      y={divY - DIVIDER_THICKNESS / 2}
                      width={fillW}
                      height={DIVIDER_THICKNESS}
                      axis="y"
                      areaStart={0}
                      areaSize={fillH}
                      minPos={bounds.min}
                      maxPos={bounds.max}
                      scale={scale}
                      onDrag={(p) => handleFillDividerDrag(i, p)}
                      hideForExport={isExporting}
                    />
                  );
                } else {
                  const fillY = canvasSize * mainDividerPos;
                  const fillW = canvasSize;
                  const fillH = canvasSize - fillY;
                  const divX = fillDividers[i] * fillW;
                  return (
                    <DividerHandle
                      key={`fd-${i}`}
                      x={divX - DIVIDER_THICKNESS / 2}
                      y={fillY}
                      width={DIVIDER_THICKNESS}
                      height={fillH}
                      axis="x"
                      areaStart={0}
                      areaSize={fillW}
                      minPos={bounds.min}
                      maxPos={bounds.max}
                      scale={scale}
                      onDrag={(p) => handleFillDividerDrag(i, p)}
                      hideForExport={isExporting}
                    />
                  );
                }
              })}

              {/* Artist name overlay */}
              {artistOverlay.visible && (
                <ArtistNameOverlay
                  canvasSize={canvasSize}
                  x={artistOverlay.x}
                  y={artistOverlay.y}
                  overlayScale={artistOverlay.scale}
                  onDragEnd={(x, y) => updateArtistOverlay({ x, y })}
                  onScaleChange={(s) => updateArtistOverlay({ scale: s })}
                />
              )}
            </Group>
          </Layer>
        </Stage>

        {/* Empty state hint */}
        {!mainImage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 36, opacity: 0.25 }}>+</div>
            <div style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.5 }}>
              Drop an image here<br />or add from sidebar
            </div>
          </div>
        )}
      </div>
    );
  },
);
