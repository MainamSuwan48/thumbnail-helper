import { useState } from 'react';
import { Download, RotateCcw, Shuffle, Trash2, User } from 'lucide-react';
import { useCoverStore } from '../../store/coverStore';
import type { CoverCanvasHandle } from './CoverCanvas';
import { Tooltip } from '../Tooltip';

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
    resetDividers,
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

  const maxFill = Math.min(Math.max(fillPool.length, 1), 5);

  return (
    <div className="h-11 shrink-0 bg-surface-raised border-b border-surface-border flex items-center gap-3 px-4">
      {/* Canvas size */}
      <div className="flex items-center gap-1">
        {SIZE_PRESETS.map((p) => (
          <Tooltip key={p.size} label={`${p.size}×${p.size} canvas`}>
            <button
              onClick={() => setCanvasSize(p.size)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                canvasSize === p.size
                  ? 'bg-accent text-white'
                  : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Image count slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cells</span>
        <input
          type="range"
          min={1}
          max={maxFill}
          step={1}
          value={Math.min(fillCount, maxFill)}
          onChange={(e) => setFillCount(Number(e.target.value))}
          className="w-24 accent-accent"
          disabled={fillPool.length === 0}
        />
        <span className="text-xs text-gray-400 w-5">
          {fillPool.length === 0 ? 0 : Math.min(fillCount, fillPool.length)}
        </span>
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Reset layout */}
      <Tooltip label="Reset layout">
        <button
          onClick={resetDividers}
          disabled={!mainImage}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border disabled:opacity-40 transition-colors"
        >
          <RotateCcw size={13} />
        </button>
      </Tooltip>

      {/* Shuffle */}
      <Tooltip label="Shuffle fill images">
        <button
          onClick={shuffle}
          disabled={fillPool.length < 2}
          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border disabled:opacity-40 transition-colors"
        >
          <Shuffle size={13} />
        </button>
      </Tooltip>

      {/* Artist name toggle */}
      <Tooltip label="Artist name overlay">
        <button
          onClick={() => updateArtistOverlay({ visible: !artistOverlay.visible })}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            artistOverlay.visible
              ? 'bg-accent text-white'
              : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
          }`}
        >
          <User size={13} />
        </button>
      </Tooltip>

      {/* Clear */}
      {(mainImage || fillPool.length > 0) && (
        <Tooltip label="Clear all cover images">
          <button
            onClick={handleClear}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 bg-surface-overlay hover:bg-surface-border transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </Tooltip>
      )}

      <div className="flex-1" />

      <span className="text-xs text-gray-600">
        {fillPool.length} fill image{fillPool.length !== 1 ? 's' : ''}
      </span>

      {exportMsg && (
        <span className="text-xs text-green-400 max-w-xs truncate" title={exportMsg}>
          {exportMsg}
        </span>
      )}

      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors"
      >
        <Download size={13} />
        {exporting ? 'Exporting…' : 'Export'}
      </button>
    </div>
  );
}
