import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Tooltip({ label, children }) {
    return (_jsxs("div", { className: "relative group/tip", children: [children, _jsxs("div", { className: "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-overlay border border-surface-border rounded text-[11px] text-gray-200 whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50", children: [label, _jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-overlay" })] })] }));
}
