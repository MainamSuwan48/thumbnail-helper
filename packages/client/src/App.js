import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Brush } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { BannerCanvas } from './components/BannerCanvas';
import { FilterPanel } from './components/FilterPanel';
import { BrushPanel } from './components/BrushPanel';
import { OverlayPanel } from './components/OverlayPanel';
import { useBannerStore } from './store/bannerStore';
import { useOverlayStore } from './store/overlayStore';
export default function App() {
    const { canvasWidth, canvasHeight, selectedColumnId, brushMode, setBrushMode, columns } = useBannerStore();
    const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
    const canvasAreaRef = useRef(null);
    const bannerCanvasRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [sidebarFiles, setSidebarFiles] = useState([]);
    useEffect(() => {
        function updateScale() {
            const el = canvasAreaRef.current;
            if (!el)
                return;
            const { width, height } = el.getBoundingClientRect();
            const padding = 48;
            setScale(Math.min(1, (width - padding) / canvasWidth, (height - padding) / canvasHeight));
        }
        updateScale();
        const ro = new ResizeObserver(updateScale);
        if (canvasAreaRef.current)
            ro.observe(canvasAreaRef.current);
        return () => ro.disconnect();
    }, [canvasWidth, canvasHeight]);
    function addFilesToSidebar(newFiles) {
        setSidebarFiles((prev) => {
            const existingNames = new Set(prev.map((f) => f.name));
            const unique = newFiles.filter((f) => !existingNames.has(f.name));
            return [...prev, ...unique];
        });
    }
    function handleFilesLoaded(newFiles) {
        addFilesToSidebar(newFiles);
    }
    const usedUrls = useMemo(() => {
        const urls = new Set();
        for (const col of columns) {
            if (col.image)
                urls.add(col.image.url);
        }
        return urls;
    }, [columns]);
    function handleClearUnused() {
        setSidebarFiles((prev) => {
            const unused = prev.filter((f) => !usedUrls.has(f.url));
            unused.forEach((f) => { if (f.url.startsWith('blob:'))
                URL.revokeObjectURL(f.url); });
            return prev.filter((f) => usedUrls.has(f.url));
        });
    }
    const showOverlayPanel = !!selectedOverlayId;
    const showFilterPanel = !showOverlayPanel && !brushMode && !!selectedColumnId;
    const showBrushPanel = !showOverlayPanel && brushMode;
    return (_jsxs("div", { className: "flex flex-col h-screen overflow-hidden", children: [_jsx(Toolbar, { canvasRef: bannerCanvasRef }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, { files: sidebarFiles, onFilesLoaded: handleFilesLoaded, hasSelectedColumn: !!selectedColumnId, usedUrls: usedUrls, onClearUnused: handleClearUnused, onImageClick: (file) => {
                            if (!selectedColumnId)
                                return;
                            useBannerStore.getState().setColumnImage(selectedColumnId, {
                                path: file.name,
                                url: file.url,
                                x: 0,
                                y: 0,
                                scale: 1,
                            });
                        } }), _jsxs("main", { className: "flex flex-col flex-1 overflow-hidden", children: [_jsx("div", { ref: canvasAreaRef, className: "flex-1 flex items-center justify-center bg-[#111] overflow-hidden", children: _jsx(BannerCanvas, { ref: bannerCanvasRef, scale: scale, onImagesDropped: (files) => addFilesToSidebar(files.map((f) => ({ name: f.name, url: f.url }))) }) }), showOverlayPanel && _jsx(OverlayPanel, {}), showFilterPanel && _jsx(FilterPanel, {}), showBrushPanel && _jsx(BrushPanel, {}), _jsxs("div", { className: "border-t border-surface-border bg-surface px-4 py-1.5 flex items-center gap-3", children: [_jsxs("button", { onClick: () => setBrushMode(!brushMode), className: `flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${brushMode
                                            ? 'bg-[#ff1e64] text-white'
                                            : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'}`, children: [_jsx(Brush, { size: 12 }), brushMode ? 'Brush On' : 'Brush Mode'] }), brushMode && (_jsx("span", { className: "text-xs text-gray-500", children: "Select a column \u2192 paint filter onto the image" }))] })] })] })] }));
}
