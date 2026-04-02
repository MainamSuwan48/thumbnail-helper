import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Download, LayoutTemplate, Hash, Smile, ImageIcon, Sliders, Brush, ChevronDown } from 'lucide-react';
import { useBannerStore } from '../store/bannerStore';
import { useOverlayStore } from '../store/overlayStore';
import { Tooltip } from './Tooltip';
const COLUMN_OPTIONS = [2, 3, 4, 5];
const PRESETS = [
    { label: '16:9 HD', w: 1280, h: 720 },
    { label: '16:6 Wide', w: 1280, h: 480 },
    { label: '4:3', w: 1280, h: 960 },
    { label: '1:1', w: 1080, h: 1080 },
];
const OVERLAY_ITEMS = [
    { id: 'picCount', icon: _jsx(Hash, { size: 13 }), label: 'Image count' },
    { id: 'mascot', icon: _jsx(Smile, { size: 13 }), label: 'Mascot overlay' },
    { id: 'logo', icon: _jsx(ImageIcon, { size: 13 }), label: 'Logo overlay' },
];
export function Toolbar({ canvasRef }) {
    const { canvasWidth, canvasHeight, columnCount, setColumnCount, setDimensions, slantPx, setSlantPx, brushMode, setBrushMode } = useBannerStore();
    const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
    const [showDimensions, setShowDimensions] = useState(false);
    const [wInput, setWInput] = useState(String(canvasWidth));
    const [hInput, setHInput] = useState(String(canvasHeight));
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState('');
    function applyDimensions() {
        const w = parseInt(wInput, 10);
        const h = parseInt(hInput, 10);
        if (w > 0 && h > 0) {
            setDimensions(w, h);
            setShowDimensions(false);
        }
    }
    async function handleExport() {
        setExporting(true);
        setExportMsg('');
        try {
            const dataUrl = await canvasRef.current?.exportBanner();
            if (!dataUrl)
                throw new Error('Export failed: no canvas');
            try {
                const res = await fetch('/api/export/banner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataUrl }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error);
                setExportMsg(`Saved to ${data.path}`);
            }
            catch {
                const link = document.createElement('a');
                link.download = `banner-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
                setExportMsg('Downloaded!');
            }
        }
        catch (e) {
            setExportMsg(e instanceof Error ? e.message : 'Export failed');
        }
        finally {
            setExporting(false);
            setTimeout(() => setExportMsg(''), 5000);
        }
    }
    function handleOverlayToggle(id) {
        const o = useOverlayStore.getState();
        const newId = o.selectedOverlayId === id ? null : id;
        o.setSelectedOverlay(newId);
        if (newId) {
            useBannerStore.getState().setSelectedColumn(null);
            useBannerStore.getState().setBrushMode(false);
        }
    }
    function handleBrushToggle() {
        const next = !brushMode;
        setBrushMode(next);
        if (next)
            useOverlayStore.getState().setSelectedOverlay(null);
    }
    return (_jsxs("header", { className: "h-11 shrink-0 bg-surface-raised border-b border-surface-border flex items-center gap-3 px-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Tooltip, { label: `Canvas: ${canvasWidth} × ${canvasHeight}`, children: _jsxs("button", { onClick: () => setShowDimensions((v) => !v), className: "flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-300 hover:text-gray-100 hover:bg-surface-overlay transition-colors", children: [_jsx(LayoutTemplate, { size: 13 }), _jsxs("span", { className: "text-gray-500", children: [canvasWidth, "\u00D7", canvasHeight] }), _jsx(ChevronDown, { size: 11, className: "text-gray-600" })] }) }), showDimensions && (_jsxs("div", { className: "absolute top-full left-0 mt-1 z-50 bg-surface-overlay border border-surface-border rounded-lg p-3 shadow-xl w-64", children: [_jsx("div", { className: "grid grid-cols-2 gap-1 mb-3", children: PRESETS.map((p) => (_jsxs("button", { onClick: () => {
                                        setDimensions(p.w, p.h);
                                        setWInput(String(p.w));
                                        setHInput(String(p.h));
                                        setShowDimensions(false);
                                    }, className: "text-xs px-2 py-1 rounded bg-surface hover:bg-surface-border text-gray-300 transition-colors", children: [p.label, " (", p.w, "\u00D7", p.h, ")"] }, p.label))) }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("input", { className: "w-20 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent", value: wInput, onChange: (e) => setWInput(e.target.value), placeholder: "W" }), _jsx("span", { className: "text-gray-500 text-xs", children: "\u00D7" }), _jsx("input", { className: "w-20 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent", value: hInput, onChange: (e) => setHInput(e.target.value), placeholder: "H" }), _jsx("button", { onClick: applyDimensions, className: "text-xs px-2 py-1 rounded bg-accent hover:bg-accent-hover text-white transition-colors", children: "Apply" })] })] }))] }), _jsx("div", { className: "w-px h-5 bg-surface-border" }), _jsx("div", { className: "flex items-center gap-1", children: COLUMN_OPTIONS.map((n) => (_jsx(Tooltip, { label: `${n} columns`, children: _jsx("button", { onClick: () => setColumnCount(n), className: `w-7 h-6 rounded text-xs font-medium transition-colors ${columnCount === n
                            ? 'bg-accent text-white'
                            : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: n }) }, n))) }), _jsx("div", { className: "w-px h-5 bg-surface-border" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Tooltip, { label: "Column slant", children: _jsx(Sliders, { size: 13, className: "text-gray-500" }) }), _jsx("input", { type: "range", min: 0, max: 35, value: slantPx, onChange: (e) => setSlantPx(Number(e.target.value)), className: "w-20 accent-accent" }), _jsx("span", { className: "text-xs text-gray-500 w-4", children: slantPx })] }), _jsx("div", { className: "w-px h-5 bg-surface-border" }), _jsx("div", { className: "flex items-center gap-1", children: OVERLAY_ITEMS.map(({ id, icon, label }) => (_jsx(Tooltip, { label: label, children: _jsx("button", { onClick: () => handleOverlayToggle(id), className: `w-7 h-7 rounded flex items-center justify-center transition-colors ${selectedOverlayId === id
                            ? 'bg-accent text-white'
                            : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: icon }) }, id))) }), _jsx("div", { className: "w-px h-5 bg-surface-border" }), _jsx(Tooltip, { label: "Brush mode", children: _jsx("button", { onClick: handleBrushToggle, className: `w-7 h-7 rounded flex items-center justify-center transition-colors ${brushMode
                        ? 'bg-accent text-white'
                        : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: _jsx(Brush, { size: 13 }) }) }), _jsx("div", { className: "flex-1" }), exportMsg && (_jsx("span", { className: "text-xs text-green-400 max-w-xs truncate", title: exportMsg, children: exportMsg })), _jsxs("button", { onClick: handleExport, disabled: exporting, className: "flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors", children: [_jsx(Download, { size: 13 }), exporting ? 'Exporting…' : 'Export'] })] }));
}
