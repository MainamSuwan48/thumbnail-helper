export type AppTab = 'banner' | 'cover';

interface TabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'banner', label: 'Banner Maker' },
  { id: 'cover', label: 'Cover Maker' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 pt-2 bg-surface-raised border-b border-surface-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === tab.id
              ? 'bg-surface text-gray-100 border border-surface-border border-b-surface'
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
          style={activeTab === tab.id ? { marginBottom: -1 } : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
