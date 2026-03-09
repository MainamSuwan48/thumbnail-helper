import { useBannerStore } from '../store/bannerStore';
import type { FilterType } from '../types';

const FILTER_TABS: { label: string; value: FilterType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Blur', value: 'blur' },
  { label: 'Pixelate', value: 'pixelate' },
];

export function FilterPanel() {
  const { columns, selectedColumnId, updateFilter } = useBannerStore();
  const col = columns.find((c) => c.id === selectedColumnId);

  if (!col) return null;

  const { filter } = col;

  return (
    <div className="border-t border-surface-border bg-surface-raised px-4 py-3 flex items-center gap-6">
      <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest shrink-0">
        Filter
      </span>

      {/* Type tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateFilter(col.id, { type: tab.value })}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filter.type === tab.value
                ? 'bg-accent text-white'
                : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Blur controls */}
      {filter.type === 'blur' && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Radius</label>
          <input
            type="range"
            min={1}
            max={80}
            value={filter.blurRadius}
            onChange={(e) => updateFilter(col.id, { blurRadius: Number(e.target.value) })}
            className="w-40 accent-accent"
          />
          <span className="text-xs text-gray-300 w-6">{filter.blurRadius}</span>
        </div>
      )}

      {/* Pixelate controls */}
      {filter.type === 'pixelate' && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Pixel size</label>
          <input
            type="range"
            min={2}
            max={60}
            value={filter.pixelSize}
            onChange={(e) => updateFilter(col.id, { pixelSize: Number(e.target.value) })}
            className="w-40 accent-accent"
          />
          <span className="text-xs text-gray-300 w-6">{filter.pixelSize}</span>
        </div>
      )}

      {/* Clear image button */}
      {col.image && (
        <button
          onClick={() => useBannerStore.getState().clearColumnImage(col.id)}
          className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear image
        </button>
      )}
    </div>
  );
}
