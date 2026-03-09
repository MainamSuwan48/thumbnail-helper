import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Group, Rect, Image as KonvaImage, Line, Circle } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useBannerStore } from '../store/bannerStore';
import type { ColumnState } from '../types';
import { OverlayLayer } from './overlay/OverlayLayer';

// ── Global brush action refs (called by BrushPanel) ──────────────────────────
export const brushActions = {
  undo: () => {},
  redo: () => {},
  clear: () => {},
};

// ── Compositing ───────────────────────────────────────────────────────────────

function compositeResult(
  resultCanvas: HTMLCanvasElement,
  img: HTMLImageElement,
  imgX: number,
  imgY: number,
  imgScale: number,
  maskCanvas: HTMLCanvasElement,
  filterType: 'blur' | 'pixelate',
  blurRadius: number,
  pixelSize: number,
) {
  const w = resultCanvas.width;
  const h = resultCanvas.height;
  const ctx = resultCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const drawW = img.width * imgScale;
  const drawH = img.height * imgScale;

  // Build filtered canvas
  const filteredCanvas = document.createElement('canvas');
  filteredCanvas.width = w;
  filteredCanvas.height = h;
  const fCtx = filteredCanvas.getContext('2d')!;

  if (filterType === 'blur') {
    fCtx.filter = `blur(${blurRadius}px)`;
    fCtx.drawImage(img, imgX, imgY, drawW, drawH);
    fCtx.filter = 'none';
  } else {
    // Pixelate: draw, scale down, scale up without smoothing
    fCtx.drawImage(img, imgX, imgY, drawW, drawH);
    const tinyW = Math.max(1, Math.round(w / pixelSize));
    const tinyH = Math.max(1, Math.round(h / pixelSize));
    const tiny = document.createElement('canvas');
    tiny.width = tinyW;
    tiny.height = tinyH;
    tiny.getContext('2d')!.drawImage(filteredCanvas, 0, 0, tinyW, tinyH);
    fCtx.clearRect(0, 0, w, h);
    fCtx.imageSmoothingEnabled = false;
    fCtx.drawImage(tiny, 0, 0, w, h);
    fCtx.imageSmoothingEnabled = true;
  }

  // Clip to mask
  fCtx.globalCompositeOperation = 'destination-in';
  fCtx.drawImage(maskCanvas, 0, 0);
  fCtx.globalCompositeOperation = 'source-over';

  ctx.drawImage(filteredCanvas, 0, 0);
}

// ── History helpers ───────────────────────────────────────────────────────────

interface ColumnHistory {
  undoStack: ImageData[];
  redoStack: ImageData[];
}

function snapshotMask(maskCanvas: HTMLCanvasElement): ImageData {
  return maskCanvas.getContext('2d')!.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
}

function restoreMask(maskCanvas: HTMLCanvasElement, snapshot: ImageData) {
  maskCanvas.getContext('2d')!.putImageData(snapshot, 0, 0);
}

// ── Single column image layers ────────────────────────────────────────────────

function ColumnImageLayer({
  column,
  colW,
  colH,
  resultCanvas,
  maskRevision,
  onImageLoad,
  onDragEnd,
  onWheel,
  onClick,
}: {
  column: ColumnState;
  colW: number;
  colH: number;
  resultCanvas: HTMLCanvasElement | null;
  maskRevision: number;
  onImageLoad: (img: HTMLImageElement) => void;
  onDragEnd: (x: number, y: number) => void;
  onWheel: (delta: number, currentScale: number) => void;
  onClick: () => void;
}) {
  const [img] = useImage(column.image?.url ?? '', 'anonymous');
  const originalRef = useRef<Konva.Image>(null);
  const brushMode = useBannerStore((s) => s.brushMode);

  // Cover-fit: compute x/y/scale on first load
  let x = column.image?.x ?? 0;
  let y = column.image?.y ?? 0;
  let scale = column.image?.scale ?? 1;
  if (img && column.image && x === 0 && y === 0 && scale === 1) {
    const imgAspect = img.width / img.height;
    const colAspect = colW / colH;
    scale = imgAspect > colAspect ? colH / img.height : colW / img.width;
    x = (colW - img.width * scale) / 2;
    y = (colH - img.height * scale) / 2;
  }

  useEffect(() => {
    if (img) onImageLoad(img as unknown as HTMLImageElement);
  }, [img]); // eslint-disable-line react-hooks/exhaustive-deps

  // Column-wide Konva filter (from FilterPanel)
  useEffect(() => {
    const node = originalRef.current;
    if (!node || !img) return;
    node.clearCache();
    const { type, blurRadius, pixelSize } = column.filter;
    if (type === 'blur') {
      node.cache();
      node.filters([Konva.Filters.Blur]);
      node.blurRadius(blurRadius);
    } else if (type === 'pixelate') {
      node.cache();
      node.filters([Konva.Filters.Pixelate]);
      node.pixelSize(pixelSize);
    } else {
      node.filters([]);
    }
    node.getLayer()?.batchDraw();
  }, [column.filter, img]);

  if (!img || !column.image) return null;

  const hasBrushResult = resultCanvas !== null && maskRevision > 0;

  return (
    <>
      <KonvaImage
        ref={originalRef}
        image={img}
        x={x}
        y={y}
        scaleX={scale}
        scaleY={scale}
        draggable={!brushMode}
        onClick={onClick}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
        onWheel={(e) => {
          e.evt.preventDefault();
          onWheel(e.evt.deltaY, scale);
        }}
      />
      {hasBrushResult && (
        <KonvaImage
          image={resultCanvas}
          x={0}
          y={0}
          width={colW}
          height={colH}
          listening={false}
          // Force Konva to re-read the canvas on revision change
          key={`result-${maskRevision}`}
        />
      )}
    </>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

function DropZonePlaceholder({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect width={w} height={h} fill="#2a2a2a" stroke="#444" strokeWidth={1} dash={[8, 4]} />
      <Line points={[w * 0.3, h / 2, w * 0.7, h / 2]} stroke="#555" strokeWidth={2} lineCap="round" />
      <Line points={[w / 2, h * 0.3, w / 2, h * 0.7]} stroke="#555" strokeWidth={2} lineCap="round" />
    </>
  );
}

// ── Column divider ────────────────────────────────────────────────────────────

function ColumnDivider({ x, h, leftId, rightId, slantPx }: { x: number; h: number; leftId: string; rightId: string; slantPx: number }) {
  const resizeColumns = useBannerStore((s) => s.resizeColumns);
  const startX = useRef(0);
  return (
    <>
      <Line
        points={[x + slantPx, 0, x, h]}
        stroke="#7c3aed"
        strokeWidth={2}
        opacity={0.6}
        listening={false}
      />
      <Rect
        x={x - 4} y={0} width={8} height={h}
        fill="transparent"
        draggable
        dragBoundFunc={(pos) => ({ x: pos.x, y: 0 })}
        onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'col-resize'; }}
        onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'default'; }}
        onDragStart={(e) => { startX.current = e.target.x() + 4; }}
        onDragEnd={(e) => {
          resizeColumns(leftId, rightId, (e.target.x() + 4) - startX.current);
          e.target.x(x - 4);
        }}
      />
    </>
  );
}

// ── Main BannerCanvas ─────────────────────────────────────────────────────────

export interface BannerCanvasHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  exportBanner: () => Promise<string>;
}

export const BannerCanvas = forwardRef<BannerCanvasHandle, { scale: number }>(
  function BannerCanvas({ scale }, ref) {
    const stageRef = useRef<Konva.Stage>(null);
    const {
      canvasWidth, canvasHeight, columns, selectedColumnId,
      setSelectedColumn, setColumnImage, updateImagePosition, updateImageScale,
      brushMode, brushTool, brushSize, slantPx,
    } = useBannerStore();

    // Per-column canvases and history
    const masksRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
    const resultsRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
    const historyRef = useRef<Map<string, ColumnHistory>>(new Map());
    const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const [maskRevisions, setMaskRevisions] = useState<Record<string, number>>({});
    const isPaintingRef = useRef(false);
    const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

    // Compute column x positions
    const colXPositions: number[] = [];
    let cumX = 0;
    for (const col of columns) {
      colXPositions.push(cumX);
      cumX += col.widthRatio * canvasWidth;
    }

    // Get or create canvas for a column
    function getMask(colId: string, colW: number, colH: number) {
      if (!masksRef.current.has(colId)) {
        const c = document.createElement('canvas');
        c.width = Math.round(colW);
        c.height = Math.round(colH);
        masksRef.current.set(colId, c);
      }
      return masksRef.current.get(colId)!;
    }

    function getResult(colId: string, colW: number, colH: number) {
      if (!resultsRef.current.has(colId)) {
        const c = document.createElement('canvas');
        c.width = Math.round(colW);
        c.height = Math.round(colH);
        resultsRef.current.set(colId, c);
      }
      return resultsRef.current.get(colId)!;
    }

    function getHistory(colId: string): ColumnHistory {
      if (!historyRef.current.has(colId)) {
        historyRef.current.set(colId, { undoStack: [], redoStack: [] });
      }
      return historyRef.current.get(colId)!;
    }

    function bumpRevision(colId: string) {
      setMaskRevisions((prev) => ({ ...prev, [colId]: (prev[colId] ?? 0) + 1 }));
    }

    // Recomposite result canvas for a column
    function updateResult(colId: string, colW: number, colH: number) {
      const img = loadedImagesRef.current.get(colId);
      const col = useBannerStore.getState().columns.find((c) => c.id === colId);
      if (!img || !col?.image) return;

      const mask = getMask(colId, colW, colH);
      const result = getResult(colId, colW, colH);

      let x = col.image.x;
      let y = col.image.y;
      let s = col.image.scale;
      if (x === 0 && y === 0 && s === 1) {
        const imgAspect = img.width / img.height;
        const colAspect = colW / colH;
        s = imgAspect > colAspect ? colH / img.height : colW / img.width;
        x = (colW - img.width * s) / 2;
        y = (colH - img.height * s) / 2;
      }

      const state = useBannerStore.getState();
      compositeResult(result, img, x, y, s, mask, state.brushFilterType, state.brushBlurRadius, state.brushPixelSize);
      bumpRevision(colId);
    }

    // Paint or erase on mask
    function paintMask(colId: string, colX: number, colY: number, colW: number, colH: number) {
      const mask = getMask(colId, colW, colH);
      const ctx = mask.getContext('2d')!;
      const state = useBannerStore.getState();
      if (state.brushTool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(255, 30, 100, 1)';
      }
      ctx.beginPath();
      ctx.arc(colX, colY, state.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      updateResult(colId, colW, colH);
    }

    // Undo / Redo for selected column
    function undoSelected() {
      const colId = useBannerStore.getState().selectedColumnId;
      if (!colId) return;
      const col = useBannerStore.getState().columns.find((c) => c.id === colId);
      if (!col) return;
      const colW = col.widthRatio * canvasWidth;
      const colH = canvasHeight;
      const history = getHistory(colId);
      if (history.undoStack.length === 0) return;
      const mask = getMask(colId, colW, colH);
      history.redoStack.push(snapshotMask(mask));
      restoreMask(mask, history.undoStack.pop()!);
      updateResult(colId, colW, colH);
    }

    function redoSelected() {
      const colId = useBannerStore.getState().selectedColumnId;
      if (!colId) return;
      const col = useBannerStore.getState().columns.find((c) => c.id === colId);
      if (!col) return;
      const colW = col.widthRatio * canvasWidth;
      const colH = canvasHeight;
      const history = getHistory(colId);
      if (history.redoStack.length === 0) return;
      const mask = getMask(colId, colW, colH);
      history.undoStack.push(snapshotMask(mask));
      restoreMask(mask, history.redoStack.pop()!);
      updateResult(colId, colW, colH);
    }

    function clearSelected() {
      const colId = useBannerStore.getState().selectedColumnId;
      if (!colId) return;
      const col = useBannerStore.getState().columns.find((c) => c.id === colId);
      if (!col) return;
      const colW = col.widthRatio * canvasWidth;
      const colH = canvasHeight;
      const history = getHistory(colId);
      const mask = getMask(colId, colW, colH);
      history.undoStack.push(snapshotMask(mask));
      history.redoStack = [];
      mask.getContext('2d')!.clearRect(0, 0, mask.width, mask.height);
      updateResult(colId, colW, colH);
    }

    // Expose via ref
    useImperativeHandle(ref, () => ({
      undo: undoSelected,
      redo: redoSelected,
      clear: clearSelected,
      exportBanner: async () => {
        const stage = stageRef.current;
        if (!stage) throw new Error('No stage');
        return stage.toDataURL({ pixelRatio: 1 });
      },
    }));

    // Also expose globally for BrushPanel buttons
    useEffect(() => {
      brushActions.undo = undoSelected;
      brushActions.redo = redoSelected;
      brushActions.clear = clearSelected;
    });

    // Keyboard shortcuts
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (!useBannerStore.getState().brushMode) return;
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault();
          undoSelected();
        }
        if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
          e.preventDefault();
          redoSelected();
        }
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Brush mouse handlers
    function handleStageMouseMove(_e: Konva.KonvaEventObject<MouseEvent>) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) setBrushCursor({ x: pos.x, y: pos.y });

      if (!useBannerStore.getState().brushMode || !isPaintingRef.current) return;
      const colIdx = getColumnAtX(pos?.x ?? 0);
      if (colIdx < 0) return;
      const col = columns[colIdx];
      const colW = col.widthRatio * canvasWidth;
      const colX = (pos?.x ?? 0) - colXPositions[colIdx];
      paintMask(col.id, colX, pos?.y ?? 0, colW, canvasHeight);
    }

    function handleStageMouseDown(_e: Konva.KonvaEventObject<MouseEvent>) {
      if (!useBannerStore.getState().brushMode) return;
      const pos = stageRef.current?.getPointerPosition();
      if (!pos) return;
      const colIdx = getColumnAtX(pos.x);
      if (colIdx < 0) return;
      const col = columns[colIdx];
      const colW = col.widthRatio * canvasWidth;

      // Save undo snapshot BEFORE painting
      const history = getHistory(col.id);
      const mask = getMask(col.id, colW, canvasHeight);
      history.undoStack.push(snapshotMask(mask));
      if (history.undoStack.length > 20) history.undoStack.shift();
      history.redoStack = []; // clear redo on new stroke

      isPaintingRef.current = true;
      const colX = pos.x - colXPositions[colIdx];
      paintMask(col.id, colX, pos.y, colW, canvasHeight);
    }

    function handleStageMouseUp() {
      isPaintingRef.current = false;
    }

    function handleStageMouseLeave() {
      setBrushCursor(null);
      isPaintingRef.current = false;
    }

    function getColumnAtX(stageX: number): number {
      let cumW = 0;
      for (let i = 0; i < columns.length; i++) {
        const colW = columns[i].widthRatio * canvasWidth;
        if (stageX >= cumW && stageX <= cumW + colW) return i;
        cumW += colW;
      }
      return -1;
    }

    // Handle OS/sidebar drop
    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const stageBox = stage.container().getBoundingClientRect();
        const dropX = (e.clientX - stageBox.left) / scale;

        let cumW = 0;
        let targetCol: ColumnState | undefined;
        for (const col of columns) {
          const colW = col.widthRatio * canvasWidth;
          if (dropX >= cumW && dropX <= cumW + colW) { targetCol = col; break; }
          cumW += colW;
        }
        if (!targetCol) return;

        let url = '';
        let name = '';
        if (e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (!file.type.startsWith('image/')) return;
          url = URL.createObjectURL(file);
          name = file.name;
        } else {
          url = e.dataTransfer.getData('text/plain');
        }
        if (!url) return;

        setColumnImage(targetCol.id, { path: name, url, x: 0, y: 0, scale: 1 });
        setSelectedColumn(targetCol.id);
      },
      [columns, canvasWidth, scale, setColumnImage, setSelectedColumn],
    );

    return (
      <div
        style={{ width: canvasWidth * scale, height: canvasHeight * scale }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth * scale}
          height={canvasHeight * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseMove={handleStageMouseMove}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseLeave}
          style={{ cursor: brushMode ? 'none' : 'default' }}
          onClick={(e) => { if (e.target === e.target.getStage()) setSelectedColumn(null); }}
        >
          <Layer>
            <Rect width={canvasWidth} height={canvasHeight} fill="#000" />

            {columns.map((col, i) => {
              const colX = colXPositions[i];
              const colW = col.widthRatio * canvasWidth;
              const isSelected = col.id === selectedColumnId;
              const resultCanvas = resultsRef.current.get(col.id) ?? null;
              const rev = maskRevisions[col.id] ?? 0;

              return (
                <Group
                  key={col.id}
                  x={colX}
                  y={0}
                  // @ts-expect-error clipFunc type mismatch in react-konva typings
                  clipFunc={(ctx: CanvasRenderingContext2D) => {
                    ctx.beginPath();
                    ctx.moveTo(slantPx, 0);
                    ctx.lineTo(colW + slantPx, 0);
                    ctx.lineTo(colW, canvasHeight);
                    ctx.lineTo(0, canvasHeight);
                    ctx.closePath();
                  }}
                  onClick={() => !brushMode && setSelectedColumn(col.id)}
                >
                  {col.image ? (
                    <ColumnImageLayer
                      column={col}
                      colW={colW}
                      colH={canvasHeight}
                      resultCanvas={resultCanvas}
                      maskRevision={rev}
                      onImageLoad={(img) => loadedImagesRef.current.set(col.id, img)}
                      onDragEnd={(x, y) => updateImagePosition(col.id, x, y)}
                      onWheel={(delta, currentScale) => {
                        const scaleBy = 1.05;
                        updateImageScale(col.id, Math.max(0.1, delta < 0 ? currentScale * scaleBy : currentScale / scaleBy));
                      }}
                      onClick={() => setSelectedColumn(col.id)}
                    />
                  ) : (
                    <DropZonePlaceholder w={colW} h={canvasHeight} />
                  )}

                  {isSelected && (
                    <Rect
                      width={colW} height={canvasHeight}
                      fill="transparent" stroke="#7c3aed" strokeWidth={2}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}

            {/* Column dividers */}
            {columns.slice(0, -1).map((col, i) => (
              <ColumnDivider
                key={`div-${col.id}`}
                x={colXPositions[i + 1]}
                h={canvasHeight}
                leftId={columns[i].id}
                rightId={columns[i + 1].id}
                slantPx={slantPx}
              />
            ))}

            {/* Brush cursor */}
            {brushMode && brushCursor && (
              <Circle
                x={brushCursor.x}
                y={brushCursor.y}
                radius={brushSize / 2}
                stroke={brushTool === 'erase' ? '#ffffff' : '#ff1e64'}
                strokeWidth={1.5}
                fill={brushTool === 'erase' ? 'rgba(255,255,255,0.05)' : 'rgba(255,30,100,0.08)'}
                listening={false}
              />
            )}
          </Layer>
          <OverlayLayer canvasWidth={canvasWidth} />
        </Stage>
      </div>
    );
  },
);

// Keep old named export for Toolbar export usage
export async function exportBanner(): Promise<string> {
  const stage = Konva.stages[0];
  if (!stage) throw new Error('No stage found');
  return stage.toDataURL({ pixelRatio: 1 });
}
