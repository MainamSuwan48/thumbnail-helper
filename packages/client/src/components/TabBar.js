import { jsx as _jsx } from "react/jsx-runtime";
const TABS = [
    { id: 'banner', label: 'Banner Maker' },
    { id: 'cover', label: 'Cover Maker' },
];
export function TabBar({ activeTab, onTabChange }) {
    return (_jsx("div", { className: "h-9 shrink-0 flex items-center px-4 bg-surface-raised border-b border-surface-border", children: _jsx("div", { className: "flex items-center gap-0.5 bg-surface-overlay rounded-full p-0.5", children: TABS.map((tab) => (_jsx("button", { onClick: () => onTabChange(tab.id), className: `px-4 py-1 text-xs font-medium rounded-full transition-colors ${activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:text-gray-200'}`, children: tab.label }, tab.id))) }) }));
}
