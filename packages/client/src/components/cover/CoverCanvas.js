import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback, useMemo, useState, forwardRef, useImperativeHandle, } from 'react';
import { Stage, Layer, Group, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useCoverStore, coverUid } from '../../store/coverStore';
import { isVerticalMain, computeMainCell, computeFillCells, computeImageInCell, computeSelectedFill, } from './FillLayout';
// ── CellImage: clipped, draggable, zoomable image in a cell ─────────────────
function CellImage({ cell, imageUrl, naturalW, naturalH, panX, panY, zoom, selected, onPanChange, onZoomChange, onClick, }) {
    const [img] = useImage(imageUrl);
    const dragStart = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);
    const imgRect = useMemo(() => computeImageInCell(cell, naturalW, naturalH, panX, panY, zoom), [cell, naturalW, naturalH, panX, panY, zoom]);
    if (!img)
        return null;
    return (_jsxs(Group, { clipX: cell.x, clipY: cell.y, clipWidth: cell.width, clipHeight: cell.height, children: [_jsx(KonvaImage, { image: img, x: imgRect.x, y: imgRect.y, width: imgRect.width, height: imgRect.height, draggable: true, onDragStart: (e) => {
                    didDrag.current = false;
                    dragStart.current = { x: e.target.x(), y: e.target.y() };
                }, onDragMove: () => {
                    didDrag.current = true;
                }, onDragEnd: (e) => {
                    const dx = e.target.x() - dragStart.current.x;
                    const dy = e.target.y() - dragStart.current.y;
                    // Reset node position (we track pan in state, not node position)
                    e.target.x(imgRect.x);
                    e.target.y(imgRect.y);
                    onPanChange(panX + dx, panY + dy);
                }, onWheel: (e) => {
                    e.evt.preventDefault();
                    const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
                    const newZoom = Math.max(1, Math.min(5, zoom * delta));
                    onZoomChange(newZoom);
                }, onClick: () => {
                    if (!didDrag.current)
                        onClick?.();
                }, onTap: () => onClick?.() }), selected && (_jsxs(_Fragment, { children: [_jsx(Rect, { x: cell.x, y: cell.y, width: cell.width, height: cell.height, stroke: "#ff1e64", strokeWidth: 6, listening: false, shadowColor: "#ff1e64", shadowBlur: 16, shadowOpacity: 0.8 }), _jsx(Rect, { x: cell.x + 3, y: cell.y + 3, width: cell.width - 6, height: cell.height - 6, stroke: "#ff6b9d", strokeWidth: 2, listening: false })] }))] }));
}
// ── Empty cell placeholder (clickable) ──────────────────────────────────────
function EmptyCell({ cell, selected, onClick, }) {
    return (_jsxs(Group, { children: [_jsx(Rect, { x: cell.x, y: cell.y, width: cell.width, height: cell.height, fill: "#141414", onClick: () => onClick?.(), onTap: () => onClick?.() }), _jsx(Rect, { x: cell.x + 4, y: cell.y + 4, width: cell.width - 8, height: cell.height - 8, stroke: "#333", strokeWidth: 1, dash: [6, 4], listening: false }), selected && (_jsxs(_Fragment, { children: [_jsx(Rect, { x: cell.x, y: cell.y, width: cell.width, height: cell.height, stroke: "#ff1e64", strokeWidth: 6, listening: false, shadowColor: "#ff1e64", shadowBlur: 16, shadowOpacity: 0.8 }), _jsx(Rect, { x: cell.x + 3, y: cell.y + 3, width: cell.width - 6, height: cell.height - 6, stroke: "#ff6b9d", strokeWidth: 2, listening: false })] }))] }));
}
// ── DividerHandle: draggable border between cells ───────────────────────────
// Uses refs + imperative Konva updates only — NO React state during drag.
const DIVIDER_THICKNESS = 4;
const DIVIDER_COLOR_IDLE = 'rgba(255,255,255,0.15)';
const DIVIDER_COLOR_ACTIVE = 'rgba(255,255,255,0.6)';
function DividerHandle({ x, y, width, height, axis, areaStart, areaSize, minPos, maxPos, scale, onDrag, hideForExport, }) {
    const rafId = useRef(null);
    if (hideForExport)
        return null;
    const scaledStart = areaStart * scale;
    const scaledSize = areaSize * scale;
    return (_jsx(Rect, { x: x, y: y, width: width, height: height, fill: DIVIDER_COLOR_IDLE, hitStrokeWidth: 16, draggable: true, dragBoundFunc: (pos) => {
            if (axis === 'x') {
                const raw = (pos.x - scaledStart) / scaledSize;
                const clamped = Math.max(minPos, Math.min(maxPos, raw));
                return { x: scaledStart + clamped * scaledSize, y: y * scale };
            }
            else {
                const raw = (pos.y - scaledStart) / scaledSize;
                const clamped = Math.max(minPos, Math.min(maxPos, raw));
                return { x: x * scale, y: scaledStart + clamped * scaledSize };
            }
        }, onDragStart: (e) => {
            e.target.fill(DIVIDER_COLOR_ACTIVE);
            e.target.getLayer()?.batchDraw();
        }, onDragMove: (e) => {
            if (rafId.current)
                return;
            rafId.current = requestAnimationFrame(() => {
                rafId.current = null;
                const absPos = e.target.getAbsolutePosition();
                if (axis === 'x') {
                    const raw = (absPos.x - scaledStart) / scaledSize;
                    onDrag(Math.max(minPos, Math.min(maxPos, raw)));
                }
                else {
                    const raw = (absPos.y - scaledStart) / scaledSize;
                    onDrag(Math.max(minPos, Math.min(maxPos, raw)));
                }
            });
        }, onDragEnd: (e) => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            e.target.fill(DIVIDER_COLOR_IDLE);
            const absPos = e.target.getAbsolutePosition();
            if (axis === 'x') {
                const raw = (absPos.x - scaledStart) / scaledSize;
                onDrag(Math.max(minPos, Math.min(maxPos, raw)));
            }
            else {
                const raw = (absPos.y - scaledStart) / scaledSize;
                onDrag(Math.max(minPos, Math.min(maxPos, raw)));
            }
        }, onMouseEnter: (e) => {
            e.target.fill(DIVIDER_COLOR_ACTIVE);
            e.target.getLayer()?.batchDraw();
            const stage = e.target.getStage();
            if (stage) {
                stage.container().style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
            }
        }, onMouseLeave: (e) => {
            e.target.fill(DIVIDER_COLOR_IDLE);
            e.target.getLayer()?.batchDraw();
            const stage = e.target.getStage();
            if (stage) {
                stage.container().style.cursor = 'default';
            }
        } }));
}
// ── Artist name overlay ─────────────────────────────────────────────────────
function ArtistNameOverlay({ canvasSize, x, y, overlayScale, onDragEnd, onScaleChange, }) {
    const [img] = useImage('/artist-name.png');
    if (!img)
        return null;
    const w = img.naturalWidth * overlayScale;
    const h = img.naturalHeight * overlayScale;
    const posY = y === -1 ? canvasSize - h - 20 : y;
    return (_jsx(KonvaImage, { image: img, x: x, y: posY, width: w, height: h, draggable: true, onDragEnd: (e) => onDragEnd(e.target.x(), e.target.y()), onWheel: (e) => {
            e.evt.preventDefault();
            const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
            onScaleChange(Math.max(0.02, Math.min(1, overlayScale * delta)));
        } }));
}
// ── Cover Canvas ─────────────────────────────────────────────────────────────
export const CoverCanvas = forwardRef(function CoverCanvas({ scale, onImagesDropped }, ref) {
    const stageRef = useRef(null);
    const exportingRef = useRef(false);
    const [isExporting, setIsExporting] = useState(false);
    const { canvasSize, mainImage, mainImageOverride, fillPool, fillCount, fillSeed, mainDividerPos, fillDividers, cellOverrides, cellAssignments, selectedCellId, artistOverlay, setMainImage, updateMainImageOverride, addToFillPool, setMainDividerPos, setFillDividers, updateCellOverride, setSelectedCellId, updateArtistOverlay, } = useCoverStore();
    // Determine layout orientation
    const vertical = mainImage ? isVerticalMain(mainImage.naturalWidth, mainImage.naturalHeight) : false;
    // Compute cell rects
    const mainCell = useMemo(() => mainImage ? computeMainCell(canvasSize, mainDividerPos, vertical) : null, [canvasSize, mainDividerPos, vertical, mainImage]);
    const fillCells = useMemo(() => computeFillCells(canvasSize, mainDividerPos, fillDividers, fillCount, vertical), [canvasSize, mainDividerPos, fillDividers, fillCount, vertical]);
    // Select fill images (respects cellAssignments + seeded shuffle)
    const selectedFill = useMemo(() => computeSelectedFill(fillPool, fillCount, fillSeed, cellAssignments), [fillPool, fillCount, fillSeed, cellAssignments]);
    // Export
    useImperativeHandle(ref, () => ({
        exportCover: async () => {
            const stage = stageRef.current;
            if (!stage)
                return null;
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
    const loadImageDimensions = useCallback((url, name) => {
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
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        const droppedImages = [];
        const isFromExplorer = e.dataTransfer.files.length > 0;
        if (isFromExplorer) {
            for (const file of Array.from(e.dataTransfer.files)) {
                if (!file.type.startsWith('image/'))
                    continue;
                droppedImages.push({ name: file.name, url: URL.createObjectURL(file) });
            }
        }
        else {
            const url = e.dataTransfer.getData('text/plain');
            if (url)
                droppedImages.push({ name: '', url });
        }
        if (droppedImages.length === 0)
            return;
        const loaded = await Promise.all(droppedImages.map((d) => loadImageDimensions(d.url, d.name)));
        if (!mainImage) {
            setMainImage(loaded[0]);
            if (loaded.length > 1)
                addToFillPool(loaded.slice(1));
        }
        else {
            addToFillPool(loaded);
        }
        if (isFromExplorer)
            onImagesDropped?.(droppedImages);
    }, [mainImage, setMainImage, addToFillPool, loadImageDimensions, onImagesDropped]);
    // ── Divider drag helpers ──────────────────────────────────────────────
    const handleMainDividerDrag = useCallback((newPos) => setMainDividerPos(newPos), [setMainDividerPos]);
    const handleFillDividerDrag = useCallback((index, newPos) => {
        const next = [...useCoverStore.getState().fillDividers];
        next[index] = newPos;
        setFillDividers(next);
    }, [setFillDividers]);
    // ── Divider min/max bounds ────────────────────────────────────────────
    const MIN_CELL_RATIO = 0.08;
    const fillDividerBounds = useMemo(() => {
        const count = Math.min(fillCount, selectedFill.length || fillCount);
        const divCount = Math.min(fillDividers.length, count - 1);
        const bounds = [];
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
    const handleStageClick = useCallback((e) => {
        if (e.target === e.target.getStage() || e.target.attrs?.fill === '#000') {
            setSelectedCellId(null);
        }
    }, [setSelectedCellId]);
    return (_jsxs("div", { style: {
            position: 'relative',
            width: canvasSize * scale,
            height: canvasSize * scale,
        }, onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), children: [_jsx(Stage, { ref: stageRef, width: canvasSize, height: canvasSize, scaleX: scale, scaleY: scale, style: { background: '#000' }, onClick: handleStageClick, children: _jsx(Layer, { children: _jsxs(Group, { clipX: 0, clipY: 0, clipWidth: canvasSize, clipHeight: canvasSize, children: [_jsx(Rect, { x: 0, y: 0, width: canvasSize, height: canvasSize, fill: "#000" }), mainImage && fillCells.map((cell, i) => {
                                const img = selectedFill[i];
                                if (!img) {
                                    return (_jsx(EmptyCell, { cell: cell, selected: selectedCellId === i, onClick: () => setSelectedCellId(selectedCellId === i ? null : i) }, `empty-${i}`));
                                }
                                const override = cellOverrides[img.id] ?? { panX: 0, panY: 0, zoom: 1 };
                                return (_jsx(CellImage, { cell: cell, imageUrl: img.url, naturalW: img.naturalWidth, naturalH: img.naturalHeight, panX: override.panX, panY: override.panY, zoom: override.zoom, selected: selectedCellId === i, onPanChange: (px, py) => updateCellOverride(img.id, { panX: px, panY: py }), onZoomChange: (z) => updateCellOverride(img.id, { zoom: z }), onClick: () => setSelectedCellId(selectedCellId === i ? null : i) }, img.id));
                            }), mainImage && mainCell && (_jsx(CellImage, { cell: mainCell, imageUrl: mainImage.url, naturalW: mainImage.naturalWidth, naturalH: mainImage.naturalHeight, panX: mainImageOverride.panX, panY: mainImageOverride.panY, zoom: mainImageOverride.zoom, selected: selectedCellId === 'main', onPanChange: (px, py) => updateMainImageOverride({ panX: px, panY: py }), onZoomChange: (z) => updateMainImageOverride({ zoom: z }), onClick: () => setSelectedCellId(selectedCellId === 'main' ? null : 'main') })), mainImage && (vertical ? (_jsx(DividerHandle, { x: canvasSize * (1 - mainDividerPos) - DIVIDER_THICKNESS / 2, y: 0, width: DIVIDER_THICKNESS, height: canvasSize, axis: "x", areaStart: 0, areaSize: canvasSize, minPos: 1 - 0.85, maxPos: 1 - 0.2, scale: scale, onDrag: (raw) => handleMainDividerDrag(1 - raw), hideForExport: isExporting })) : (_jsx(DividerHandle, { x: 0, y: canvasSize * mainDividerPos - DIVIDER_THICKNESS / 2, width: canvasSize, height: DIVIDER_THICKNESS, axis: "y", areaStart: 0, areaSize: canvasSize, minPos: 0.2, maxPos: 0.85, scale: scale, onDrag: handleMainDividerDrag, hideForExport: isExporting }))), mainImage && fillDividerBounds.map((bounds, i) => {
                                if (vertical) {
                                    const fillH = canvasSize;
                                    const fillW = canvasSize * (1 - mainDividerPos);
                                    const divY = fillDividers[i] * fillH;
                                    return (_jsx(DividerHandle, { x: 0, y: divY - DIVIDER_THICKNESS / 2, width: fillW, height: DIVIDER_THICKNESS, axis: "y", areaStart: 0, areaSize: fillH, minPos: bounds.min, maxPos: bounds.max, scale: scale, onDrag: (p) => handleFillDividerDrag(i, p), hideForExport: isExporting }, `fd-${i}`));
                                }
                                else {
                                    const fillY = canvasSize * mainDividerPos;
                                    const fillW = canvasSize;
                                    const fillH = canvasSize - fillY;
                                    const divX = fillDividers[i] * fillW;
                                    return (_jsx(DividerHandle, { x: divX - DIVIDER_THICKNESS / 2, y: fillY, width: DIVIDER_THICKNESS, height: fillH, axis: "x", areaStart: 0, areaSize: fillW, minPos: bounds.min, maxPos: bounds.max, scale: scale, onDrag: (p) => handleFillDividerDrag(i, p), hideForExport: isExporting }, `fd-${i}`));
                                }
                            }), artistOverlay.visible && (_jsx(ArtistNameOverlay, { canvasSize: canvasSize, x: artistOverlay.x, y: artistOverlay.y, overlayScale: artistOverlay.scale, onDragEnd: (x, y) => updateArtistOverlay({ x, y }), onScaleChange: (s) => updateArtistOverlay({ scale: s }) }))] }) }) }), !mainImage && (_jsxs("div", { style: {
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    gap: 8,
                }, children: [_jsx("div", { style: { fontSize: 36, opacity: 0.25 }, children: "+" }), _jsxs("div", { style: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.5 }, children: ["Drop an image here", _jsx("br", {}), "or add from sidebar"] })] }))] }));
});
