import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useCallback, useMemo, forwardRef, useImperativeHandle, } from 'react';
import { Stage, Layer, Group, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useCoverStore, coverUid } from '../../store/coverStore';
import { computeFillLayout, computeMainImageRect } from './FillLayout';
// ── Main image sub-component ─────────────────────────────────────────────────
function MainImageNode({ image, canvasSize, }) {
    const [img] = useImage(image.url);
    if (!img)
        return null;
    const rect = computeMainImageRect(canvasSize, image.naturalWidth, image.naturalHeight);
    return (_jsx(KonvaImage, { image: img, x: rect.x, y: rect.y, width: rect.width, height: rect.height, listening: false }));
}
// ── Fill image sub-component ─────────────────────────────────────────────────
function FillImageNode({ rect, url }) {
    const [img] = useImage(url);
    if (!img)
        return null;
    return (_jsx(KonvaImage, { image: img, x: rect.x, y: rect.y, width: rect.width, height: rect.height, listening: false }));
}
// ── Artist name overlay sub-component ────────────────────────────────────────
function ArtistNameOverlay({ canvasSize, x, y, overlayScale, onDragEnd, onScaleChange, }) {
    const [img] = useImage('/artist-name.png');
    if (!img)
        return null;
    const w = img.naturalWidth * overlayScale;
    const h = img.naturalHeight * overlayScale;
    // y === -1 means "auto bottom-left"
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
    const { canvasSize, mainImage, fillPool, fillCount, fillSeed, artistOverlay, setMainImage, updateArtistOverlay, addToFillPool, } = useCoverStore();
    // Export — temporarily reset viewport scale to get full-resolution output
    useImperativeHandle(ref, () => ({
        exportCover: async () => {
            const stage = stageRef.current;
            if (!stage)
                return null;
            const prevScaleX = stage.scaleX();
            const prevScaleY = stage.scaleY();
            stage.scaleX(1);
            stage.scaleY(1);
            stage.batchDraw();
            const url = stage.toDataURL({ pixelRatio: 1 });
            stage.scaleX(prevScaleX);
            stage.scaleY(prevScaleY);
            stage.batchDraw();
            return url;
        },
    }));
    // Fill layout computation
    const fillLayout = useMemo(() => computeFillLayout(canvasSize, mainImage, fillPool, fillCount, fillSeed), [canvasSize, mainImage, fillPool, fillCount, fillSeed]);
    // Map imageId → url for quick lookup
    const fillUrlMap = useMemo(() => {
        const m = new Map();
        for (const img of fillPool)
            m.set(img.id, img.url);
        return m;
    }, [fillPool]);
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
        // Load dimensions for all images
        const loaded = await Promise.all(droppedImages.map((d) => loadImageDimensions(d.url, d.name)));
        if (!mainImage) {
            // First image becomes main, rest go to fill pool
            setMainImage(loaded[0]);
            if (loaded.length > 1)
                addToFillPool(loaded.slice(1));
        }
        else {
            // All go to fill pool
            addToFillPool(loaded);
        }
        if (isFromExplorer)
            onImagesDropped?.(droppedImages);
    }, [mainImage, setMainImage, addToFillPool, loadImageDimensions, onImagesDropped]);
    return (_jsx("div", { style: {
            position: 'relative',
            width: canvasSize * scale,
            height: canvasSize * scale,
        }, onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), children: _jsx(Stage, { ref: stageRef, width: canvasSize, height: canvasSize, scaleX: scale, scaleY: scale, style: { background: '#000' }, children: _jsx(Layer, { children: _jsxs(Group, { clipX: 0, clipY: 0, clipWidth: canvasSize, clipHeight: canvasSize, children: [_jsx(Rect, { x: 0, y: 0, width: canvasSize, height: canvasSize, fill: "#000" }), fillLayout.map((rect, i) => {
                            const url = fillUrlMap.get(rect.imageId);
                            if (!url)
                                return null;
                            return _jsx(FillImageNode, { rect: rect, url: url }, `${rect.imageId}-${i}`);
                        }), mainImage && (_jsx(MainImageNode, { image: mainImage, canvasSize: canvasSize })), artistOverlay.visible && (_jsx(ArtistNameOverlay, { canvasSize: canvasSize, x: artistOverlay.x, y: artistOverlay.y, overlayScale: artistOverlay.scale, onDragEnd: (x, y) => updateArtistOverlay({ x, y }), onScaleChange: (s) => updateArtistOverlay({ scale: s }) }))] }) }) }) }));
});
