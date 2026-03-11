import { jsx as _jsx } from "react/jsx-runtime";
const TABS = [
    { id: 'banner', label: 'Banner Maker' },
    { id: 'cover', label: 'Cover Maker' },
];
export function TabBar({ activeTab, onTabChange }) {
    return (_jsx("div", { className: "flex items-center gap-1 px-4 pt-2 bg-surface-raised border-b border-surface-border", children: TABS.map((tab) => (_jsx("button", { onClick: () => onTabChange(tab.id), className: `px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${activeTab === tab.id
                ? 'bg-surface text-gray-100 border border-surface-border border-b-surface'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'}`, style: activeTab === tab.id ? { marginBottom: -1 } : undefined, children: tab.label }, tab.id))) }));
}
