import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { Hash, Smile, ImageIcon, SlidersHorizontal, Paintbrush, Settings2, Brush, Eraser, Undo2, Redo2, Trash2, } from 'lucide-react';
import { useOverlayStore } from '../store/overlayStore';
import { useBannerStore } from '../store/bannerStore';
import { brushActions } from './BannerCanvas';
// ── Shared sub-components ──────────────────────────────────────────────────────
function ColorInput({ value, onChange }) {
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: value, onChange: (e) => onChange(e.target.value), className: "w-7 h-7 rounded cursor-pointer border border-surface-border bg-transparent shrink-0" }), _jsx("span", { className: "text-xs text-gray-500 font-mono", children: value })] }));
}
function Slider({ label, min, max, step, value, onChange, unit = '', }) {
    return (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-xs text-gray-500", children: label }), _jsxs("span", { className: "text-xs text-gray-300 tabular-nums", children: [typeof step === 'number' && step < 1 ? value.toFixed(1) : value, unit] })] }), _jsx("input", { type: "range", min: min, max: max, step: step ?? 1, value: value, onChange: (e) => onChange(Number(e.target.value)), className: "w-full accent-accent" })] }));
}
function PanelHeader({ icon, label }) {
    return (_jsxs("div", { className: "px-3 py-2 border-b border-surface-border flex items-center gap-2 shrink-0", children: [_jsx("span", { className: "text-gray-500", children: icon }), _jsx("span", { className: "text-xs font-semibold text-gray-300 tracking-wide", children: label })] }));
}
function Row({ children }) {
    return _jsx("div", { className: "flex items-center justify-between gap-2", children: children });
}
// ── Overlay panel sections ─────────────────────────────────────────────────────
function PicCountSection() {
    const { picCount, updatePicCount } = useOverlayStore();
    return (_jsxs("div", { className: "flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1", children: [_jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Count" }), _jsx("input", { className: "w-24 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent text-right", value: picCount.count, onChange: (e) => updatePicCount({ count: e.target.value }) })] }), _jsx(Slider, { label: "Font size", min: 24, max: 120, value: picCount.fontSize, onChange: (v) => updatePicCount({ fontSize: v }), unit: "px" }), _jsx(Slider, { label: "Scale", min: 0.5, max: 3, step: 0.1, value: picCount.scale, onChange: (v) => updatePicCount({ scale: v }), unit: "\u00D7" }), _jsx(Slider, { label: "Opacity", min: 0, max: 100, value: Math.round(picCount.opacity * 100), onChange: (v) => updatePicCount({ opacity: v / 100 }), unit: "%" }), _jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Color" }), _jsx(ColorInput, { value: picCount.color, onChange: (v) => updatePicCount({ color: v }) })] }), _jsx("div", { className: "h-px bg-surface-border" }), _jsxs(Row, { children: [_jsxs("label", { className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: picCount.shadowEnabled, onChange: (e) => updatePicCount({ shadowEnabled: e.target.checked }) }), "Shadow"] }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: picCount.strokeEnabled, onChange: (e) => updatePicCount({ strokeEnabled: e.target.checked }) }), "Stroke"] })] }), picCount.strokeEnabled && (_jsxs(_Fragment, { children: [_jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Stroke color" }), _jsx(ColorInput, { value: picCount.strokeColor, onChange: (v) => updatePicCount({ strokeColor: v }) })] }), _jsx(Slider, { label: "Stroke width", min: 1, max: 20, value: picCount.strokeWidth, onChange: (v) => updatePicCount({ strokeWidth: v }) })] })), _jsx("div", { className: "h-px bg-surface-border" }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: picCount.extrasEnabled, onChange: (e) => updatePicCount({ extrasEnabled: e.target.checked }) }), "Show extras"] }), picCount.extrasEnabled && (_jsxs(_Fragment, { children: [_jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Extras count" }), _jsx("input", { className: "w-24 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent text-right", value: picCount.extras, onChange: (e) => updatePicCount({ extras: e.target.value }) })] }), _jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Extras color" }), _jsx(ColorInput, { value: picCount.extrasColor, onChange: (v) => updatePicCount({ extrasColor: v }) })] })] }))] }));
}
function LogoSection() {
    const { logo, updateLogo } = useOverlayStore();
    return (_jsx("div", { className: "flex flex-col gap-3 px-3 py-3", children: _jsx(Slider, { label: "Scale", min: 0.3, max: 3, step: 0.1, value: logo.scale, onChange: (v) => updateLogo({ scale: v }), unit: "\u00D7" }) }));
}
function MascotSection() {
    const { mascot, updateMascot } = useOverlayStore();
    const mascotInputRef = useRef(null);
    return (_jsxs("div", { className: "flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1", children: [_jsx("button", { onClick: () => mascotInputRef.current?.click(), className: "w-full px-3 py-1.5 rounded-md bg-surface-overlay border border-surface-border text-xs text-gray-300 hover:border-accent hover:text-gray-100 transition-colors", children: mascot.url ? 'Change PNG' : 'Load PNG' }), _jsx("input", { ref: mascotInputRef, type: "file", accept: "image/png,image/*", className: "hidden", onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (!file)
                        return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        const aspect = img.width / img.height;
                        const w = mascot.width;
                        updateMascot({ url, visible: true, width: w, height: w / aspect });
                    };
                    img.src = url;
                    e.target.value = '';
                } }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: mascot.outlineEnabled, onChange: (e) => updateMascot({ outlineEnabled: e.target.checked }) }), "Outline"] }), mascot.outlineEnabled && (_jsxs(_Fragment, { children: [_jsx(Slider, { label: "Thickness", min: 1, max: 20, value: mascot.outlineThickness, onChange: (v) => updateMascot({ outlineThickness: v }) }), _jsxs(Row, { children: [_jsx("span", { className: "text-xs text-gray-500", children: "Color" }), _jsx(ColorInput, { value: mascot.outlineColor, onChange: (v) => updateMascot({ outlineColor: v }) })] })] })), _jsx("p", { className: "text-[11px] text-gray-600 leading-relaxed", children: "Scroll wheel over mascot to resize" })] }));
}
// ── Brush panel ────────────────────────────────────────────────────────────────
function BrushSection() {
    const { brushTool, setBrushTool, brushSize, setBrushSize, brushFilterType, setBrushFilterType, brushBlurRadius, setBrushBlurRadius, brushPixelSize, setBrushPixelSize, selectedColumnId, } = useBannerStore();
    if (!selectedColumnId) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center flex-1 gap-2 text-gray-600 select-none px-3", children: [_jsx(Paintbrush, { size: 20, strokeWidth: 1.5 }), _jsxs("p", { className: "text-xs text-center leading-relaxed", children: ["Select a column", _jsx("br", {}), "to start painting"] })] }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1", children: [_jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [_jsxs("button", { onClick: () => setBrushTool('paint'), className: `flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${brushTool === 'paint'
                            ? 'bg-accent text-white'
                            : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: [_jsx(Brush, { size: 12 }), " Paint"] }), _jsxs("button", { onClick: () => setBrushTool('erase'), className: `flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${brushTool === 'erase'
                            ? 'bg-white text-black'
                            : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: [_jsx(Eraser, { size: 12 }), " Erase"] })] }), _jsx(Slider, { label: "Brush size", min: 5, max: 120, value: brushSize, onChange: setBrushSize }), _jsx("div", { className: "h-px bg-surface-border" }), _jsx("span", { className: "text-xs text-gray-500", children: "Filter" }), _jsx("div", { className: "grid grid-cols-2 gap-1.5", children: ['blur', 'pixelate'].map((t) => (_jsx("button", { onClick: () => setBrushFilterType(t), className: `py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${brushFilterType === t
                        ? 'bg-accent text-white'
                        : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: t }, t))) }), brushFilterType === 'blur' && (_jsx(Slider, { label: "Blur radius", min: 1, max: 80, value: brushBlurRadius, onChange: setBrushBlurRadius })), brushFilterType === 'pixelate' && (_jsx(Slider, { label: "Pixel size", min: 2, max: 60, value: brushPixelSize, onChange: setBrushPixelSize })), _jsx("div", { className: "h-px bg-surface-border" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("button", { onClick: () => brushActions.undo(), title: "Undo (Ctrl+Z)", className: "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border transition-colors", children: [_jsx(Undo2, { size: 13 }), " Undo"] }), _jsxs("button", { onClick: () => brushActions.redo(), title: "Redo (Ctrl+Y)", className: "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border transition-colors", children: [_jsx(Redo2, { size: 13 }), " Redo"] }), _jsxs("button", { onClick: () => brushActions.clear(), title: "Clear mask", className: "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-red-500 hover:text-red-400 bg-surface-overlay hover:bg-surface-border transition-colors", children: [_jsx(Trash2, { size: 13 }), " Clear"] })] })] }));
}
// ── Filter panel ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
    { label: 'None', value: 'none' },
    { label: 'Blur', value: 'blur' },
    { label: 'Pixelate', value: 'pixelate' },
];
function FilterSection() {
    const { columns, selectedColumnId, updateFilter } = useBannerStore();
    const col = columns.find((c) => c.id === selectedColumnId);
    if (!col)
        return null;
    const { filter } = col;
    return (_jsxs("div", { className: "flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1", children: [_jsx("div", { className: "flex gap-1", children: FILTER_TABS.map((tab) => (_jsx("button", { onClick: () => updateFilter(col.id, { type: tab.value }), className: `flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${filter.type === tab.value
                        ? 'bg-accent text-white'
                        : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'}`, children: tab.label }, tab.value))) }), filter.type === 'blur' && (_jsx(Slider, { label: "Blur radius", min: 1, max: 80, value: filter.blurRadius, onChange: (v) => updateFilter(col.id, { blurRadius: v }) })), filter.type === 'pixelate' && (_jsx(Slider, { label: "Pixel size", min: 2, max: 60, value: filter.pixelSize, onChange: (v) => updateFilter(col.id, { pixelSize: v }) })), col.image && (_jsx("button", { onClick: () => useBannerStore.getState().clearColumnImage(col.id), className: "mt-auto text-xs text-red-400 hover:text-red-300 transition-colors text-left", children: "Clear image" }))] }));
}
// ── Root panel ────────────────────────────────────────────────────────────────
const OVERLAY_HEADERS = {
    picCount: { icon: _jsx(Hash, { size: 14 }), label: 'Image Count' },
    mascot: { icon: _jsx(Smile, { size: 14 }), label: 'Mascot' },
    logo: { icon: _jsx(ImageIcon, { size: 14 }), label: 'Logo' },
};
export function RightPanel() {
    const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
    const brushMode = useBannerStore((s) => s.brushMode);
    const selectedColumnId = useBannerStore((s) => s.selectedColumnId);
    const showOverlay = !!selectedOverlayId;
    const showBrush = !showOverlay && brushMode;
    const showFilter = !showOverlay && !brushMode && !!selectedColumnId;
    const showIdle = !showOverlay && !showBrush && !showFilter;
    return (_jsxs("aside", { className: "w-60 shrink-0 bg-surface-raised border-l border-surface-border flex flex-col overflow-hidden", children: [showOverlay && selectedOverlayId && (_jsx(PanelHeader, { icon: OVERLAY_HEADERS[selectedOverlayId]?.icon, label: OVERLAY_HEADERS[selectedOverlayId]?.label ?? selectedOverlayId })), showBrush && _jsx(PanelHeader, { icon: _jsx(Paintbrush, { size: 14 }), label: "Brush" }), showFilter && _jsx(PanelHeader, { icon: _jsx(SlidersHorizontal, { size: 14 }), label: "Column Filter" }), showIdle && (_jsxs("div", { className: "flex flex-col items-center justify-center flex-1 gap-3 text-gray-700 select-none px-4", children: [_jsx(Settings2, { size: 22, strokeWidth: 1.5 }), _jsxs("p", { className: "text-xs text-center leading-relaxed text-gray-600", children: ["Select an overlay", _jsx("br", {}), "or enable brush mode"] })] })), showOverlay && selectedOverlayId === 'picCount' && _jsx(PicCountSection, {}), showOverlay && selectedOverlayId === 'logo' && _jsx(LogoSection, {}), showOverlay && selectedOverlayId === 'mascot' && _jsx(MascotSection, {}), showBrush && _jsx(BrushSection, {}), showFilter && _jsx(FilterSection, {})] }));
}
