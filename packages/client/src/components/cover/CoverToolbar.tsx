import { useState } from 'react';
import { Download, Shuffle, Trash2, User } from 'lucide-react';
import { useCoverStore } from '../../store/coverStore';
import type { CoverCanvasHandle } from './CoverCanvas';

const SIZE_PRESETS = [
  { label: '1080', size: 1080 },
  { label: '1200', size: 1200 },
  { label: '2048', size: 2048 },
];

export function CoverToolbar({ canvasRef }: { canvasRef: React.RefObject<CoverCanvasHandle> }) {
  const {
    canvasSize,
    setCanvasSize,
    fillCount,
    setFillCount,
    fillPool,
    mainImage,
    setMainImage,
    clearFillPool,
    shuffle,
    artistOverlay,
    updateArtistOverlay,
  } = useCoverStore();
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  async function handleExport() {
    setExporting(true);
    setExportMsg('');
    try {
      const dataUrl = await canvasRef.current?.exportCover();
      if (!dataUrl) throw new Error('Export failed: no canvas');

      try {
        const res = await fetch('/api/export/banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        });
        const data = (await res.json()) as { path?: string; error?: string };
        if (!res.ok) throw new Error(data.error);
        setExportMsg(`Saved to ${data.path}`);
      } catch {
        const link = document.createElement('a');
        link.download = `cover-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setExportMsg('Downloaded!');
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 5000);
    }
  }

  function handleClear() {
    setMainImage(null);
    clearFillPool();
  }

  return (
    <div className="h-10 shrink-0 bg-surface border-b border-surface-border flex items-center gap-3 px-4">
      {/* Canvas size */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400">Size</span>
        {SIZE_PRESETS.map((p) => (
          <button
            key={p.size}
            onClick={() => setCanvasSize(p.size)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              canvasSize === p.size
                ? 'bg-accent text-white'
                : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-surface-border" />

      {/* Image count slider */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Images</label>
        <input
          type="range"
          min={1}
          max={Math.max(fillPool.length, 1)}
          step={1}
          value={Math.min(fillCount, fillPool.length || 1)}
          onChange={(e) => setFillCount(Number(e.target.value))}
          className="w-28 accent-accent"
          disabled={fillPool.length === 0}
        />
        <span className="text-xs text-gray-300 w-5">
          {fillPool.length === 0 ? 0 : Math.min(fillCount, fillPool.length)}
        </span>
      </div>

      <div className="w-px h-4 bg-surface-border" />

      {/* Shuffle */}
      <button
        onClick={shuffle}
        disabled={fillPool.length === 0}
        title="Shuffle fill images"
        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface-overlay text-gray-300 hover:bg-surface-border hover:text-gray-100 disabled:opacity-40 transition-colors"
      >
        <Shuffle size={12} />
        Shuffle
      </button>

      {/* Artist name toggle */}
      <button
        onClick={() => updateArtistOverlay({ visible: !artistOverlay.visible })}
        title="Toggle artist name overlay"
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          artistOverlay.visible
            ? 'bg-accent text-white'
            : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
        }`}
      >
        <User size={12} />
        Artist
      </button>

      {/* Clear */}
      {(mainImage || fillPool.length > 0) && (
        <button
          onClick={handleClear}
          title="Clear all cover images"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-surface-overlay text-gray-400 hover:text-red-400 hover:bg-surface-border transition-colors"
        >
          <Trash2 size={12} />
          Clear
        </button>
      )}

      <div className="flex-1" />

      {/* Fill pool count */}
      <span className="text-xs text-gray-500">
        {fillPool.length} fill image{fillPool.length !== 1 ? 's' : ''}
      </span>

      {/* Export status */}
      {exportMsg && (
        <span className="text-xs text-green-400 max-w-xs truncate" title={exportMsg}>
          {exportMsg}
        </span>
      )}

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors"
      >
        <Download size={13} />
        {exporting ? 'Exporting…' : 'Export PNG'}
      </button>
    </div>
  );
}
