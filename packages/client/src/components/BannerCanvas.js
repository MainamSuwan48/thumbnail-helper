import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, } from "react";
import { Stage, Layer, Group, Rect, Image as KonvaImage, Line, Circle, Text as KonvaText, } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useBannerStore } from "../store/bannerStore";
import { useOverlayStore } from "../store/overlayStore";
import { OverlayLayer } from "./overlay/OverlayLayer";
// ── Global brush action refs (called by BrushPanel) ──────────────────────────
export const brushActions = {
    undo: () => { },
    redo: () => { },
    clear: () => { },
};
// ── Compositing ───────────────────────────────────────────────────────────────
function compositeResult(resultCanvas, img, imgX, imgY, imgScale, maskCanvas, filterType, blurRadius, pixelSize) {
    const w = resultCanvas.width;
    const h = resultCanvas.height;
    const ctx = resultCanvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const drawW = img.width * imgScale;
    const drawH = img.height * imgScale;
    // Build filtered canvas
    const filteredCanvas = document.createElement("canvas");
    filteredCanvas.width = w;
    filteredCanvas.height = h;
    const fCtx = filteredCanvas.getContext("2d");
    if (filterType === "blur") {
        fCtx.filter = `blur(${blurRadius}px)`;
        fCtx.drawImage(img, imgX, imgY, drawW, drawH);
        fCtx.filter = "none";
    }
    else {
        // Pixelate: draw, scale down, scale up without smoothing
        fCtx.drawImage(img, imgX, imgY, drawW, drawH);
        const tinyW = Math.max(1, Math.round(w / pixelSize));
        const tinyH = Math.max(1, Math.round(h / pixelSize));
        const tiny = document.createElement("canvas");
        tiny.width = tinyW;
        tiny.height = tinyH;
        tiny.getContext("2d").drawImage(filteredCanvas, 0, 0, tinyW, tinyH);
        fCtx.clearRect(0, 0, w, h);
        fCtx.imageSmoothingEnabled = false;
        fCtx.drawImage(tiny, 0, 0, w, h);
        fCtx.imageSmoothingEnabled = true;
    }
    // Clip to mask
    fCtx.globalCompositeOperation = "destination-in";
    fCtx.drawImage(maskCanvas, 0, 0);
    fCtx.globalCompositeOperation = "source-over";
    ctx.drawImage(filteredCanvas, 0, 0);
}
function snapshotMask(maskCanvas) {
    return maskCanvas
        .getContext("2d")
        .getImageData(0, 0, maskCanvas.width, maskCanvas.height);
}
function restoreMask(maskCanvas, snapshot) {
    maskCanvas.getContext("2d").putImageData(snapshot, 0, 0);
}
// ── Single column image layers ────────────────────────────────────────────────
function ColumnImageLayer({ column, colW, colH, resultCanvas, maskRevision, onImageLoad, onWheel, onClick, }) {
    const [img] = useImage(column.image?.url ?? "", "anonymous");
    const originalRef = useRef(null);
    const brushMode = useBannerStore((s) => s.brushMode);
    const isMascotMode = useOverlayStore((s) => s.selectedOverlayId) === "mascot";
    const updateImagePosition = useBannerStore((s) => s.updateImagePosition);
    const updateImageScale = useBannerStore((s) => s.updateImageScale);
    // Cover-fit: compute x/y/scale on first load, then persist to store
    let x = column.image?.x ?? 0;
    let y = column.image?.y ?? 0;
    let scale = column.image?.scale ?? 1;
    const needsCoverFit = img && column.image && x === 0 && y === 0 && scale === 1;
    if (needsCoverFit) {
        const imgAspect = img.width / img.height;
        const colAspect = colW / colH;
        scale = imgAspect > colAspect ? colH / img.height : colW / img.width;
        x = (colW - img.width * scale) / 2;
        y = (colH - img.height * scale) / 2;
    }
    useEffect(() => {
        if (img)
            onImageLoad(img);
    }, [img]); // eslint-disable-line react-hooks/exhaustive-deps
    // Persist computed cover-fit values so scroll-resize works from correct baseline
    useEffect(() => {
        if (needsCoverFit && column.image) {
            updateImagePosition(column.id, x, y);
            updateImageScale(column.id, scale);
        }
    }, [needsCoverFit]); // eslint-disable-line react-hooks/exhaustive-deps
    // Column-wide Konva filter (from FilterPanel)
    useEffect(() => {
        const node = originalRef.current;
        if (!node || !img)
            return;
        node.clearCache();
        const { type, blurRadius, pixelSize } = column.filter;
        if (type === "blur") {
            node.cache();
            node.filters([Konva.Filters.Blur]);
            node.blurRadius(blurRadius);
        }
        else if (type === "pixelate") {
            node.cache();
            node.filters([Konva.Filters.Pixelate]);
            node.pixelSize(pixelSize);
        }
        else {
            node.filters([]);
        }
        node.getLayer()?.batchDraw();
    }, [column.filter, img]);
    if (!img || !column.image)
        return null;
    const hasBrushResult = resultCanvas !== null && maskRevision > 0;
    return (_jsxs(_Fragment, { children: [_jsx(KonvaImage, { ref: originalRef, image: img, x: x, y: y, scaleX: scale, scaleY: scale, draggable: !brushMode && !isMascotMode, onClick: onClick, onDragEnd: (e) => {
                    updateImagePosition(column.id, e.target.x(), e.target.y());
                }, onWheel: (e) => {
                    if (brushMode)
                        return; // let stage handle brush size
                    e.evt.preventDefault();
                    onWheel(e.evt.deltaY, scale);
                } }), hasBrushResult && (_jsx(KonvaImage, { image: resultCanvas, x: 0, y: 0, width: colW, height: colH, listening: false }, `result-${maskRevision}`))] }));
}
// ── "Images" decorative letter data (rendered as Konva Text in OverlayLayer) ─
export const IMAGES_LETTERS = [
    { char: "I", rotate: -10, tx: 0, ty: -5 },
    { char: "m", rotate: 6, tx: 1, ty: 4 },
    { char: "a", rotate: -5, tx: 0, ty: -3 },
    { char: "g", rotate: 8, tx: 2, ty: 5 },
    { char: "e", rotate: -4, tx: 0, ty: -4 },
    { char: "s", rotate: 7, tx: 1, ty: 3 },
];
// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZonePlaceholder({ w, h, slantPx, }) {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.07; // circle radius, responsive
    const arm = r * 0.55;
    return (_jsxs(_Fragment, { children: [_jsx(Rect, { x: 0, y: 0, width: w + slantPx, height: h, fill: "#181818" }), _jsx(Rect, { x: 0, y: 0, width: w, height: h, fill: "transparent", stroke: "#2e2e2e", strokeWidth: 1, dash: [10, 7] }), _jsx(Circle, { x: cx, y: cy - 16, radius: r, stroke: "#3a3a3a", strokeWidth: 1.5, fill: "#202020" }), _jsx(Line, { points: [cx - arm, cy - 16, cx + arm, cy - 16], stroke: "#3a3a3a", strokeWidth: 2, lineCap: "round" }), _jsx(Line, { points: [cx, cy - 16 - arm, cx, cy - 16 + arm], stroke: "#3a3a3a", strokeWidth: 2, lineCap: "round" }), _jsx(KonvaText, { x: 0, y: cy + r + 4, width: w, text: "drop image", align: "center", fill: "#333", fontSize: Math.max(10, Math.round(h * 0.025)), fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: 1.5 })] }));
}
// ── Selection border (slant-aware, pulsing neon) ─────────────────────────────
function SelectionBorder({ colW, colH, slantPx, isFirst, }) {
    const lineRef = useRef(null);
    useEffect(() => {
        const layer = lineRef.current?.getLayer();
        if (!layer)
            return;
        const anim = new Konva.Animation((frame) => {
            if (!lineRef.current || !frame)
                return;
            const t = 0.5 + 0.5 * Math.sin(frame.time * 0.004);
            lineRef.current.opacity(0.4 + 0.6 * t);
            lineRef.current.shadowBlur(6 + 10 * t);
        }, layer);
        anim.start();
        return () => { anim.stop(); };
    }, []);
    const m = 8; // margin inset
    const topLeft = isFirst ? m : slantPx + m;
    const topRight = colW + slantPx - m;
    const bottomRight = colW - m;
    const bottomLeft = m;
    return (_jsx(Line, { ref: lineRef, name: "ui-only", points: [
            topLeft, m,
            topRight, m,
            bottomRight, colH - m,
            bottomLeft, colH - m,
        ], closed: true, stroke: "#06b6d4", strokeWidth: 2, shadowColor: "#06b6d4", shadowBlur: 10, shadowOpacity: 1, listening: false }));
}
// ── Column divider ────────────────────────────────────────────────────────────
function ColumnDivider({ x, h, leftId, rightId, slantPx, }) {
    const resizeColumns = useBannerStore((s) => s.resizeColumns);
    const startX = useRef(0);
    const lineRef = useRef(null);
    useEffect(() => {
        const layer = lineRef.current?.getLayer();
        if (!layer)
            return;
        const anim = new Konva.Animation((frame) => {
            if (!lineRef.current || !frame)
                return;
            // Pulse opacity: 0.35 → 0.85 at ~0.8Hz
            lineRef.current.opacity(0.35 + 0.5 * (0.5 + 0.5 * Math.sin(frame.time * 0.005)));
            // Marching dashes
            lineRef.current.dashOffset(-(frame.time * 0.018) % 26);
        }, layer);
        anim.start();
        return () => { anim.stop(); };
    }, []);
    return (_jsxs(Group, { name: "ui-only", children: [_jsx(Line, { ref: lineRef, points: [x + slantPx, 0, x, h], stroke: "#ff2d78", strokeWidth: 2, dash: [14, 12], lineCap: "round", opacity: 0.35, listening: false }), _jsx(Rect, { x: x - 4, y: 0, width: 8, height: h, fill: "transparent", draggable: true, dragBoundFunc: (pos) => ({ x: pos.x, y: 0 }), onMouseEnter: (e) => {
                    const c = e.target.getStage()?.container();
                    if (c)
                        c.style.cursor = "col-resize";
                }, onMouseLeave: (e) => {
                    const c = e.target.getStage()?.container();
                    if (c)
                        c.style.cursor = "default";
                }, onDragStart: (e) => {
                    startX.current = e.target.x() + 4;
                }, onDragEnd: (e) => {
                    resizeColumns(leftId, rightId, e.target.x() + 4 - startX.current);
                    e.target.x(x - 4);
                } })] }));
}
export const BannerCanvas = forwardRef(function BannerCanvas({ scale, onImagesDropped }, ref) {
    const stageRef = useRef(null);
    const { canvasWidth, canvasHeight, columns, selectedColumnId, setSelectedColumn, setColumnImage, updateImageScale, brushMode, brushTool, brushSize, slantPx, } = useBannerStore();
    const isMascotMode = useOverlayStore((s) => s.selectedOverlayId) === "mascot";
    // Per-column canvases and history
    const masksRef = useRef(new Map());
    const resultsRef = useRef(new Map());
    const historyRef = useRef(new Map());
    const loadedImagesRef = useRef(new Map());
    const [maskRevisions, setMaskRevisions] = useState({});
    const isPaintingRef = useRef(false);
    const activeToolRef = useRef("paint");
    const [brushCursor, setBrushCursor] = useState(null);
    // Track image URLs to clear masks when images change
    const prevImageUrls = useRef(new Map());
    useEffect(() => {
        for (const col of columns) {
            const currentUrl = col.image?.url ?? "";
            const prevUrl = prevImageUrls.current.get(col.id);
            if (prevUrl !== undefined && prevUrl !== currentUrl) {
                // Image changed — clear mask, result, and history
                const mask = masksRef.current.get(col.id);
                if (mask)
                    mask.getContext("2d").clearRect(0, 0, mask.width, mask.height);
                const result = resultsRef.current.get(col.id);
                if (result)
                    result.getContext("2d").clearRect(0, 0, result.width, result.height);
                historyRef.current.delete(col.id);
                bumpRevision(col.id);
            }
            prevImageUrls.current.set(col.id, currentUrl);
        }
    }, [columns]); // eslint-disable-line react-hooks/exhaustive-deps
    // Compute column x positions
    const colXPositions = [];
    let cumX = 0;
    for (const col of columns) {
        colXPositions.push(cumX);
        cumX += col.widthRatio * canvasWidth;
    }
    // Get or create canvas for a column (recreates if dimensions changed)
    function getMask(colId, colW, colH) {
        const w = Math.round(colW);
        const h = Math.round(colH);
        const existing = masksRef.current.get(colId);
        if (!existing || existing.width !== w || existing.height !== h) {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            masksRef.current.set(colId, c);
            historyRef.current.delete(colId);
        }
        return masksRef.current.get(colId);
    }
    function getResult(colId, colW, colH) {
        const w = Math.round(colW);
        const h = Math.round(colH);
        const existing = resultsRef.current.get(colId);
        if (!existing || existing.width !== w || existing.height !== h) {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            resultsRef.current.set(colId, c);
        }
        return resultsRef.current.get(colId);
    }
    function getHistory(colId) {
        if (!historyRef.current.has(colId)) {
            historyRef.current.set(colId, { undoStack: [], redoStack: [] });
        }
        return historyRef.current.get(colId);
    }
    function bumpRevision(colId) {
        setMaskRevisions((prev) => ({
            ...prev,
            [colId]: (prev[colId] ?? 0) + 1,
        }));
    }
    // Recomposite result canvas for a column
    function updateResult(colId, colW, colH) {
        const img = loadedImagesRef.current.get(colId);
        const col = useBannerStore.getState().columns.find((c) => c.id === colId);
        if (!img || !col?.image)
            return;
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
    function paintMask(colId, colX, colY, colW, colH) {
        const mask = getMask(colId, colW, colH);
        const ctx = mask.getContext("2d");
        if (activeToolRef.current === "erase") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(0,0,0,1)";
        }
        else {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(255, 30, 100, 1)";
        }
        ctx.beginPath();
        ctx.arc(colX, colY, useBannerStore.getState().brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        updateResult(colId, colW, colH);
    }
    // Undo / Redo for selected column
    function undoSelected() {
        const colId = useBannerStore.getState().selectedColumnId;
        if (!colId)
            return;
        const col = useBannerStore.getState().columns.find((c) => c.id === colId);
        if (!col)
            return;
        const colW = col.widthRatio * canvasWidth;
        const colH = canvasHeight;
        const history = getHistory(colId);
        if (history.undoStack.length === 0)
            return;
        const mask = getMask(colId, colW, colH);
        history.redoStack.push(snapshotMask(mask));
        restoreMask(mask, history.undoStack.pop());
        updateResult(colId, colW, colH);
    }
    function redoSelected() {
        const colId = useBannerStore.getState().selectedColumnId;
        if (!colId)
            return;
        const col = useBannerStore.getState().columns.find((c) => c.id === colId);
        if (!col)
            return;
        const colW = col.widthRatio * canvasWidth;
        const colH = canvasHeight;
        const history = getHistory(colId);
        if (history.redoStack.length === 0)
            return;
        const mask = getMask(colId, colW, colH);
        history.undoStack.push(snapshotMask(mask));
        restoreMask(mask, history.redoStack.pop());
        updateResult(colId, colW, colH);
    }
    function clearSelected() {
        const colId = useBannerStore.getState().selectedColumnId;
        if (!colId)
            return;
        const col = useBannerStore.getState().columns.find((c) => c.id === colId);
        if (!col)
            return;
        const colW = col.widthRatio * canvasWidth;
        const colH = canvasHeight;
        const history = getHistory(colId);
        const mask = getMask(colId, colW, colH);
        history.undoStack.push(snapshotMask(mask));
        history.redoStack = [];
        mask.getContext("2d").clearRect(0, 0, mask.width, mask.height);
        updateResult(colId, colW, colH);
    }
    // Expose via ref
    useImperativeHandle(ref, () => ({
        undo: undoSelected,
        redo: redoSelected,
        clear: clearSelected,
        exportBanner: async () => {
            const stage = stageRef.current;
            if (!stage)
                throw new Error("No stage");
            // Hide UI-only elements for export
            const uiNodes = stage.find(".ui-only");
            uiNodes.forEach((n) => n.hide());
            stage.batchDraw();
            const url = stage.toDataURL({ pixelRatio: 2 });
            uiNodes.forEach((n) => n.show());
            stage.batchDraw();
            return url;
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
        function onKey(e) {
            // Skip if user is typing in an input/textarea
            const tag = e.target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA")
                return;
            // B → toggle brush mode
            if (e.key === "b" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const s = useBannerStore.getState();
                s.setBrushMode(!s.brushMode);
                return;
            }
            // M → toggle mascot overlay
            if (e.key === "m" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const o = useOverlayStore.getState();
                const newId = o.selectedOverlayId === "mascot" ? null : "mascot";
                o.setSelectedOverlay(newId);
                if (newId)
                    useBannerStore.getState().setSelectedColumn(null);
                return;
            }
            if (!useBannerStore.getState().brushMode)
                return;
            if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
                e.preventDefault();
                undoSelected();
            }
            if ((e.key === "y" && (e.ctrlKey || e.metaKey)) ||
                (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
                e.preventDefault();
                redoSelected();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Convert pixel pointer position to canvas coordinates
    function getCanvasPointer() {
        const pos = stageRef.current?.getPointerPosition();
        if (!pos)
            return null;
        return { x: pos.x / scale, y: pos.y / scale };
    }
    // Brush mouse handlers
    function handleStageMouseMove(_e) {
        const pos = getCanvasPointer();
        if (pos)
            setBrushCursor({ x: pos.x, y: pos.y });
        if (!useBannerStore.getState().brushMode || !isPaintingRef.current)
            return;
        if (!pos)
            return;
        const colIdx = getColumnAtX(pos.x);
        if (colIdx < 0)
            return;
        const col = columns[colIdx];
        const colW = col.widthRatio * canvasWidth;
        const colX = pos.x - colXPositions[colIdx];
        paintMask(col.id, colX, pos.y, colW, canvasHeight);
    }
    function handleStageMouseDown(e) {
        if (!useBannerStore.getState().brushMode)
            return;
        const pos = getCanvasPointer();
        if (!pos)
            return;
        const colIdx = getColumnAtX(pos.x);
        if (colIdx < 0)
            return;
        const col = columns[colIdx];
        const colW = col.widthRatio * canvasWidth;
        // Right-click = erase, left-click = paint
        activeToolRef.current = e.evt.button === 2 ? "erase" : "paint";
        // Save undo snapshot BEFORE painting
        const history = getHistory(col.id);
        const mask = getMask(col.id, colW, canvasHeight);
        history.undoStack.push(snapshotMask(mask));
        if (history.undoStack.length > 20)
            history.undoStack.shift();
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
    function getColumnAtX(stageX) {
        let cumW = 0;
        for (let i = 0; i < columns.length; i++) {
            const colW = columns[i].widthRatio * canvasWidth;
            if (stageX >= cumW && stageX <= cumW + colW)
                return i;
            cumW += colW;
        }
        return -1;
    }
    // Handle OS/sidebar drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const stage = stageRef.current;
        if (!stage)
            return;
        const stageBox = stage.container().getBoundingClientRect();
        const dropX = (e.clientX - stageBox.left) / scale;
        const dropY = (e.clientY - stageBox.top) / scale;
        // Collect all dropped images
        const droppedImages = [];
        const isFromExplorer = e.dataTransfer.files.length > 0;
        if (isFromExplorer) {
            for (const file of Array.from(e.dataTransfer.files)) {
                if (!file.type.startsWith("image/"))
                    continue;
                droppedImages.push({ name: file.name, url: URL.createObjectURL(file) });
            }
        }
        else {
            const url = e.dataTransfer.getData("text/plain");
            if (url)
                droppedImages.push({ name: "", url });
        }
        if (droppedImages.length === 0)
            return;
        // If mascot overlay is selected, drop first image as mascot
        const overlay = useOverlayStore.getState();
        if (overlay.selectedOverlayId === "mascot") {
            const { url } = droppedImages[0];
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const defaultW = 200;
                overlay.updateMascot({
                    url,
                    visible: true,
                    x: dropX - defaultW / 2,
                    y: dropY - defaultW / aspect / 2,
                    width: defaultW,
                    height: defaultW / aspect,
                });
            };
            img.src = url;
            // Sync remaining images to sidebar
            if (isFromExplorer && droppedImages.length > 1)
                onImagesDropped?.(droppedImages.slice(1));
            return;
        }
        // Multi-image: auto-allocate last N images to N columns
        if (droppedImages.length > 1) {
            const colCount = columns.length;
            // Take the last colCount images (or all if fewer than colCount)
            const toPlace = droppedImages.slice(-colCount);
            toPlace.forEach((img, i) => {
                setColumnImage(columns[i].id, { path: img.name, url: img.url, x: 0, y: 0, scale: 1 });
            });
            setSelectedColumn(columns[toPlace.length - 1].id);
            // Sync all dropped images to sidebar
            if (isFromExplorer)
                onImagesDropped?.(droppedImages);
            return;
        }
        // Single image: drop into the column under cursor
        let cumW = 0;
        let targetCol;
        for (const col of columns) {
            const colW = col.widthRatio * canvasWidth;
            if (dropX >= cumW && dropX <= cumW + colW) {
                targetCol = col;
                break;
            }
            cumW += colW;
        }
        if (!targetCol)
            return;
        setColumnImage(targetCol.id, { path: droppedImages[0].name, url: droppedImages[0].url, x: 0, y: 0, scale: 1 });
        setSelectedColumn(targetCol.id);
        // Sync to sidebar
        if (isFromExplorer)
            onImagesDropped?.(droppedImages);
    }, [columns, canvasWidth, scale, setColumnImage, setSelectedColumn, onImagesDropped]);
    return (_jsx("div", { className: isMascotMode ? "mascot-mode-border" : "", style: {
            position: "relative",
            width: canvasWidth * scale,
            height: canvasHeight * scale,
        }, onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), onContextMenu: (e) => e.preventDefault(), children: _jsxs(Stage, { ref: stageRef, width: canvasWidth * scale, height: canvasHeight * scale, scaleX: scale, scaleY: scale, onMouseMove: handleStageMouseMove, onMouseDown: handleStageMouseDown, onMouseUp: handleStageMouseUp, onMouseLeave: handleStageMouseLeave, onWheel: (e) => {
                if (!brushMode)
                    return;
                e.evt.preventDefault();
                const delta = e.evt.deltaY;
                const step = Math.max(1, Math.round(brushSize * 0.1));
                useBannerStore
                    .getState()
                    .setBrushSize(Math.max(5, Math.min(200, brushSize + (delta > 0 ? -step : step))));
            }, style: { cursor: brushMode ? "none" : "default" }, onClick: (e) => {
                if (e.target === e.target.getStage()) {
                    if (!brushMode && !isMascotMode) {
                        setSelectedColumn(null);
                        useOverlayStore.getState().setSelectedOverlay(null);
                    }
                }
            }, children: [_jsxs(Layer, { children: [_jsx(Rect, { width: canvasWidth, height: canvasHeight, fill: "#000" }), columns.map((col, i) => {
                            const colX = colXPositions[i];
                            const colW = col.widthRatio * canvasWidth;
                            const isSelected = col.id === selectedColumnId;
                            const resultCanvas = resultsRef.current.get(col.id) ?? null;
                            const rev = maskRevisions[col.id] ?? 0;
                            return (_jsxs(Group, { x: colX, y: 0, 
                                // @ts-expect-error clipFunc type mismatch in react-konva typings
                                clipFunc: (ctx) => {
                                    ctx.beginPath();
                                    ctx.moveTo(i === 0 ? 0 : slantPx, 0);
                                    ctx.lineTo(colW + slantPx, 0);
                                    ctx.lineTo(colW, canvasHeight);
                                    ctx.lineTo(0, canvasHeight);
                                    ctx.closePath();
                                }, onClick: () => {
                                    if (brushMode || isMascotMode)
                                        return;
                                    setSelectedColumn(col.id);
                                    useOverlayStore.getState().setSelectedOverlay(null);
                                }, children: [col.image ? (_jsx(ColumnImageLayer, { column: col, colW: colW, colH: canvasHeight, resultCanvas: resultCanvas, maskRevision: rev, onImageLoad: (img) => loadedImagesRef.current.set(col.id, img), onWheel: (delta, currentScale) => {
                                            const scaleBy = 1.05;
                                            updateImageScale(col.id, Math.max(0.1, delta < 0
                                                ? currentScale * scaleBy
                                                : currentScale / scaleBy));
                                        }, onClick: () => {
                                            if (isMascotMode)
                                                return;
                                            setSelectedColumn(col.id);
                                            useOverlayStore.getState().setSelectedOverlay(null);
                                        } })) : (_jsx(DropZonePlaceholder, { w: colW, h: canvasHeight, slantPx: slantPx })), isSelected && (_jsx(SelectionBorder, { colW: colW, colH: canvasHeight, slantPx: slantPx, isFirst: i === 0 }))] }, col.id));
                        }), columns.slice(0, -1).map((col, i) => (_jsx(ColumnDivider, { x: colXPositions[i + 1], h: canvasHeight, leftId: columns[i].id, rightId: columns[i + 1].id, slantPx: slantPx }, `div-${col.id}`))), brushMode && brushCursor && (_jsx(Circle, { name: "ui-only", x: brushCursor.x, y: brushCursor.y, radius: brushSize / 2, stroke: brushTool === "erase" ? "#ffffff" : "#ff1e64", strokeWidth: 1.5, fill: brushTool === "erase"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(255,30,100,0.08)", listening: false }))] }), _jsx(OverlayLayer, { canvasWidth: canvasWidth })] }) }));
});
// Keep old named export for Toolbar export usage
export async function exportBanner() {
    const stage = Konva.stages[0];
    if (!stage)
        throw new Error("No stage found");
    const uiNodes = stage.find(".ui-only");
    uiNodes.forEach((n) => n.hide());
    stage.batchDraw();
    const url = stage.toDataURL({ pixelRatio: 2 });
    uiNodes.forEach((n) => n.show());
    stage.batchDraw();
    return url;
}
