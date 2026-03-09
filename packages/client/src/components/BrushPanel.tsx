import { useBannerStore } from '../store/bannerStore';
import { brushActions } from './BannerCanvas';
import { Brush, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react';

export function BrushPanel() {
  const {
    brushTool, setBrushTool,
    brushSize, setBrushSize,
    brushFilterType, setBrushFilterType,
    brushBlurRadius, setBrushBlurRadius,
    brushPixelSize, setBrushPixelSize,
    selectedColumnId,
  } = useBannerStore();

  if (!selectedColumnId) {
    return (
      <div className="border-t border-surface-border bg-surface-raised px-4 py-2 text-xs text-gray-600">
        Select a column to use the brush
      </div>
    );
  }

  return (
    <div className="border-t border-surface-border bg-surface-raised px-4 py-2.5 flex flex-wrap items-center gap-4">
      {/* Paint / Erase */}
      <div className="flex gap-1">
        <button
          onClick={() => setBrushTool('paint')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            brushTool === 'paint' ? 'bg-[#ff1e64] text-white' : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
          }`}
        >
          <Brush size={12} /> Paint
        </button>
        <button
          onClick={() => setBrushTool('erase')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            brushTool === 'erase' ? 'bg-white text-black' : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
          }`}
        >
          <Eraser size={12} /> Erase
        </button>
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Brush size */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Size</label>
        <input
          type="range" min={5} max={120} value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-24 accent-[#ff1e64]"
        />
        <span className="text-xs text-gray-300 w-7">{brushSize}</span>
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Filter type */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Filter</label>
        <div className="flex gap-1">
          {(['blur', 'pixelate'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBrushFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                brushFilterType === t ? 'bg-accent text-white' : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filter intensity */}
      {brushFilterType === 'blur' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Radius</label>
          <input
            type="range" min={1} max={80} value={brushBlurRadius}
            onChange={(e) => setBrushBlurRadius(Number(e.target.value))}
            className="w-28 accent-accent"
          />
          <span className="text-xs text-gray-300 w-6">{brushBlurRadius}</span>
        </div>
      )}
      {brushFilterType === 'pixelate' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Pixel size</label>
          <input
            type="range" min={2} max={60} value={brushPixelSize}
            onChange={(e) => setBrushPixelSize(Number(e.target.value))}
            className="w-28 accent-accent"
          />
          <span className="text-xs text-gray-300 w-6">{brushPixelSize}</span>
        </div>
      )}

      <div className="w-px h-5 bg-surface-border" />

      {/* Undo / Redo / Clear */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => brushActions.undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-surface-overlay transition-colors"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => brushActions.redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-surface-overlay transition-colors"
        >
          <Redo2 size={14} />
        </button>
        <button
          onClick={() => brushActions.clear()}
          title="Clear mask"
          className="p-1.5 rounded text-red-500 hover:text-red-400 hover:bg-surface-overlay transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
