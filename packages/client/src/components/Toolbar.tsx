import { useState } from 'react';
import { Download, Settings } from 'lucide-react';
import { useBannerStore } from '../store/bannerStore';
import type { BannerCanvasHandle } from './BannerCanvas';
import { useOverlayStore } from '../store/overlayStore';
import type { OverlayId } from '../store/overlayStore';

const COLUMN_OPTIONS = [2, 3, 4, 5];

const PRESETS = [
  { label: '16:9 HD', w: 1280, h: 720 },
  { label: '16:6 Wide', w: 1280, h: 480 },
  { label: '4:3', w: 1280, h: 960 },
  { label: '1:1', w: 1080, h: 1080 },
];

export function Toolbar({ canvasRef }: { canvasRef: React.RefObject<BannerCanvasHandle> }) {
  const { canvasWidth, canvasHeight, columnCount, setColumnCount, setDimensions, slantPx, setSlantPx } =
    useBannerStore();
  const [showDimensions, setShowDimensions] = useState(false);
  const [wInput, setWInput] = useState(String(canvasWidth));
  const [hInput, setHInput] = useState(String(canvasHeight));
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  function applyDimensions() {
    const w = parseInt(wInput, 10);
    const h = parseInt(hInput, 10);
    if (w > 0 && h > 0) {
      setDimensions(w, h);
      setShowDimensions(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportMsg('');
    try {
      const dataUrl = await canvasRef.current?.exportBanner();
      if (!dataUrl) throw new Error('Export failed: no canvas');

      // Try server-side save first, fall back to browser download
      try {
        const res = await fetch('/api/export/banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        });
        const data = await res.json() as { path?: string; error?: string };
        if (!res.ok) throw new Error(data.error);
        setExportMsg(`Saved to ${data.path}`);
      } catch {
        // Server unavailable — download via browser
        const link = document.createElement('a');
        link.download = `banner-${Date.now()}.png`;
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

  return (
    <header className="h-12 shrink-0 bg-surface-raised border-b border-surface-border flex items-center gap-4 px-4">
      <span className="text-sm font-semibold text-gray-200">Thumbnail Helper</span>

      <div className="w-px h-5 bg-surface-border" />

      {/* Canvas size */}
      <div className="relative">
        <button
          onClick={() => setShowDimensions((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-gray-100 transition-colors"
        >
          <Settings size={13} />
          {canvasWidth} × {canvasHeight}
        </button>

        {showDimensions && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-surface-overlay border border-surface-border rounded-lg p-3 shadow-xl w-64">
            {/* Presets */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setDimensions(p.w, p.h);
                    setWInput(String(p.w));
                    setHInput(String(p.h));
                    setShowDimensions(false);
                  }}
                  className="text-xs px-2 py-1 rounded bg-surface hover:bg-surface-border text-gray-300 transition-colors"
                >
                  {p.label} ({p.w}×{p.h})
                </button>
              ))}
            </div>

            {/* Custom */}
            <div className="flex gap-2 items-center">
              <input
                className="w-20 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent"
                value={wInput}
                onChange={(e) => setWInput(e.target.value)}
                placeholder="W"
              />
              <span className="text-gray-500 text-xs">×</span>
              <input
                className="w-20 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent"
                value={hInput}
                onChange={(e) => setHInput(e.target.value)}
                placeholder="H"
              />
              <button
                onClick={applyDimensions}
                className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent-hover text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Column count */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Columns</span>
        <div className="flex gap-1">
          {COLUMN_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setColumnCount(n)}
              className={`w-7 h-6 rounded text-xs transition-colors ${
                columnCount === n
                  ? 'bg-accent text-white'
                  : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Slant */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Slant</label>
        <input
          type="range" min={0} max={35} value={slantPx}
          onChange={(e) => setSlantPx(Number(e.target.value))}
          className="w-24 accent-accent"
        />
        <span className="text-xs text-gray-300 w-5">{slantPx}</span>
      </div>

      <div className="w-px h-5 bg-surface-border" />

      {/* Overlay toggles */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Overlay</span>
        <div className="flex gap-1">
          {([ ['picCount','#'], ['mascot','M'], ['logo','L'] ] as [OverlayId, string][]).map(([id, icon]) => (
            <button
              key={id}
              onClick={() => {
                const o = useOverlayStore.getState();
                const newId = o.selectedOverlayId === id ? null : id;
                o.setSelectedOverlay(newId);
                if (newId) {
                  useBannerStore.getState().setSelectedColumn(null);
                  useBannerStore.getState().setBrushMode(false);
                }
              }}
              title={id}
              className="w-7 h-6 rounded text-xs bg-surface-overlay text-gray-300 hover:bg-surface-border hover:text-gray-100 transition-colors"
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export status */}
      {exportMsg && (
        <span className="text-xs text-green-400 max-w-xs truncate" title={exportMsg}>
          {exportMsg}
        </span>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors"
      >
        <Download size={13} />
        {exporting ? 'Exporting…' : 'Export PNG'}
      </button>
    </header>
  );
}
