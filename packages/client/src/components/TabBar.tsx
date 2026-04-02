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
    <div className="h-9 shrink-0 flex items-center px-4 bg-surface-raised border-b border-surface-border">
      <div className="flex items-center gap-0.5 bg-surface-overlay rounded-full p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-1 text-xs font-medium rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
