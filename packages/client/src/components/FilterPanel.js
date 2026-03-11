import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBannerStore } from '../store/bannerStore';
const FILTER_TABS = [
    { label: 'None', value: 'none' },
    { label: 'Blur', value: 'blur' },
    { label: 'Pixelate', value: 'pixelate' },
];
export function FilterPanel() {
    const { columns, selectedColumnId, updateFilter } = useBannerStore();
    const col = columns.find((c) => c.id === selectedColumnId);
    if (!col)
        return null;
    const { filter } = col;
    return (_jsxs("div", { className: "border-t border-surface-border bg-surface-raised px-4 py-3 flex items-center gap-6", children: [_jsx("span", { className: "text-xs text-gray-400 font-semibold uppercase tracking-widest shrink-0", children: "Filter" }), _jsx("div", { className: "flex gap-1", children: FILTER_TABS.map((tab) => (_jsx("button", { onClick: () => updateFilter(col.id, { type: tab.value }), className: `px-3 py-1 rounded text-sm transition-colors ${filter.type === tab.value
                        ? 'bg-accent text-white'
                        : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'}`, children: tab.label }, tab.value))) }), filter.type === 'blur' && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-xs text-gray-400", children: "Radius" }), _jsx("input", { type: "range", min: 1, max: 80, value: filter.blurRadius, onChange: (e) => updateFilter(col.id, { blurRadius: Number(e.target.value) }), className: "w-40 accent-accent" }), _jsx("span", { className: "text-xs text-gray-300 w-6", children: filter.blurRadius })] })), filter.type === 'pixelate' && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-xs text-gray-400", children: "Pixel size" }), _jsx("input", { type: "range", min: 2, max: 60, value: filter.pixelSize, onChange: (e) => updateFilter(col.id, { pixelSize: Number(e.target.value) }), className: "w-40 accent-accent" }), _jsx("span", { className: "text-xs text-gray-300 w-6", children: filter.pixelSize })] })), col.image && (_jsx("button", { onClick: () => useBannerStore.getState().clearColumnImage(col.id), className: "ml-auto text-xs text-red-400 hover:text-red-300 transition-colors", children: "Clear image" }))] }));
}
