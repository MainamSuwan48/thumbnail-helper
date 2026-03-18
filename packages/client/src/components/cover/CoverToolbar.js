import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Download, RotateCcw, Shuffle, Trash2, User } from 'lucide-react';
import { useCoverStore } from '../../store/coverStore';
const SIZE_PRESETS = [
    { label: '1080', size: 1080 },
    { label: '1200', size: 1200 },
    { label: '2048', size: 2048 },
];
export function CoverToolbar({ canvasRef }) {
    const { canvasSize, setCanvasSize, fillCount, setFillCount, fillPool, mainImage, setMainImage, clearFillPool, shuffle, resetDividers, artistOverlay, updateArtistOverlay, } = useCoverStore();
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState('');
    async function handleExport() {
        setExporting(true);
        setExportMsg('');
        try {
            const dataUrl = await canvasRef.current?.exportCover();
            if (!dataUrl)
                throw new Error('Export failed: no canvas');
            try {
                const res = await fetch('/api/export/banner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataUrl }),
                });
                const data = (await res.json());
                if (!res.ok)
                    throw new Error(data.error);
                setExportMsg(`Saved to ${data.path}`);
            }
            catch {
                const link = document.createElement('a');
                link.download = `cover-${Date.now()}.png`;
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
    function handleClear() {
        setMainImage(null);
        clearFillPool();
    }
    const maxFill = Math.min(Math.max(fillPool.length, 1), 5);
    return (_jsxs("div", { className: "h-10 shrink-0 bg-surface border-b border-surface-border flex items-center gap-3 px-4", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Size" }), SIZE_PRESETS.map((p) => (_jsx("button", { onClick: () => setCanvasSize(p.size), className: `px-2 py-0.5 rounded text-xs transition-colors ${canvasSize === p.size
                            ? 'bg-accent text-white'
                            : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'}`, children: p.label }, p.size)))] }), _jsx("div", { className: "w-px h-4 bg-surface-border" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-xs text-gray-400", children: "Cells" }), _jsx("input", { type: "range", min: 1, max: maxFill, step: 1, value: Math.min(fillCount, maxFill), onChange: (e) => setFillCount(Number(e.target.value)), className: "w-28 accent-accent", disabled: fillPool.length === 0 }), _jsx("span", { className: "text-xs text-gray-300 w-5", children: fillPool.length === 0 ? 0 : Math.min(fillCount, fillPool.length) })] }), _jsx("div", { className: "w-px h-4 bg-surface-border" }), _jsxs("button", { onClick: resetDividers, disabled: !mainImage, title: "Reset layout to default", className: "flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface-overlay text-gray-300 hover:bg-surface-border hover:text-gray-100 disabled:opacity-40 transition-colors", children: [_jsx(RotateCcw, { size: 12 }), "Reset"] }), _jsxs("button", { onClick: shuffle, disabled: fillPool.length < 2, title: "Shuffle fill images", className: "flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface-overlay text-gray-300 hover:bg-surface-border hover:text-gray-100 disabled:opacity-40 transition-colors", children: [_jsx(Shuffle, { size: 12 }), "Shuffle"] }), _jsxs("button", { onClick: () => updateArtistOverlay({ visible: !artistOverlay.visible }), title: "Toggle artist name overlay", className: `flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${artistOverlay.visible
                    ? 'bg-accent text-white'
                    : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'}`, children: [_jsx(User, { size: 12 }), "Artist"] }), (mainImage || fillPool.length > 0) && (_jsxs("button", { onClick: handleClear, title: "Clear all cover images", className: "flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface-overlay text-gray-400 hover:text-red-400 hover:bg-surface-border transition-colors", children: [_jsx(Trash2, { size: 12 }), "Clear"] })), _jsx("div", { className: "flex-1" }), _jsxs("span", { className: "text-xs text-gray-500", children: [fillPool.length, " fill image", fillPool.length !== 1 ? 's' : ''] }), exportMsg && (_jsx("span", { className: "text-xs text-green-400 max-w-xs truncate", title: exportMsg, children: exportMsg })), _jsxs("button", { onClick: handleExport, disabled: exporting, className: "flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors", children: [_jsx(Download, { size: 13 }), exporting ? 'Exporting…' : 'Export PNG'] })] }));
}
