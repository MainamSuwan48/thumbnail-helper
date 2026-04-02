import { useRef } from 'react';
import {
  Hash, Smile, ImageIcon, SlidersHorizontal, Paintbrush,
  Settings2, Brush, Eraser, Undo2, Redo2, Trash2,
} from 'lucide-react';
import { useOverlayStore } from '../store/overlayStore';
import { useBannerStore } from '../store/bannerStore';
import { brushActions } from './BannerCanvas';
import type { FilterType } from '../types';

// ── Shared sub-components ──────────────────────────────────────────────────────

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border border-surface-border bg-transparent shrink-0"
      />
      <span className="text-xs text-gray-500 font-mono">{value}</span>
    </div>
  );
}

function Slider({
  label, min, max, step, value, onChange, unit = '',
}: {
  label: string; min: number; max: number; step?: number; value: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs text-gray-300 tabular-nums">
          {typeof step === 'number' && step < 1 ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step ?? 1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

function PanelHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="px-3 py-2 border-b border-surface-border flex items-center gap-2 shrink-0">
      <span className="text-gray-500">{icon}</span>
      <span className="text-xs font-semibold text-gray-300 tracking-wide">{label}</span>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2">{children}</div>;
}

// ── Overlay panel sections ─────────────────────────────────────────────────────

function PicCountSection() {
  const { picCount, updatePicCount } = useOverlayStore();
  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1">
      <Row>
        <span className="text-xs text-gray-500">Count</span>
        <input
          className="w-24 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent text-right"
          value={picCount.count}
          onChange={(e) => updatePicCount({ count: e.target.value })}
        />
      </Row>
      <Slider label="Font size" min={24} max={120} value={picCount.fontSize} onChange={(v) => updatePicCount({ fontSize: v })} unit="px" />
      <Slider label="Scale" min={0.5} max={3} step={0.1} value={picCount.scale} onChange={(v) => updatePicCount({ scale: v })} unit="×" />
      <Slider label="Opacity" min={0} max={100} value={Math.round(picCount.opacity * 100)} onChange={(v) => updatePicCount({ opacity: v / 100 })} unit="%" />
      <Row>
        <span className="text-xs text-gray-500">Color</span>
        <ColorInput value={picCount.color} onChange={(v) => updatePicCount({ color: v })} />
      </Row>
      <div className="h-px bg-surface-border" />
      <Row>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" checked={picCount.shadowEnabled} onChange={(e) => updatePicCount({ shadowEnabled: e.target.checked })} />
          Shadow
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" checked={picCount.strokeEnabled} onChange={(e) => updatePicCount({ strokeEnabled: e.target.checked })} />
          Stroke
        </label>
      </Row>
      {picCount.strokeEnabled && (
        <>
          <Row>
            <span className="text-xs text-gray-500">Stroke color</span>
            <ColorInput value={picCount.strokeColor} onChange={(v) => updatePicCount({ strokeColor: v })} />
          </Row>
          <Slider label="Stroke width" min={1} max={20} value={picCount.strokeWidth} onChange={(v) => updatePicCount({ strokeWidth: v })} />
        </>
      )}
      <div className="h-px bg-surface-border" />
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input type="checkbox" checked={picCount.extrasEnabled} onChange={(e) => updatePicCount({ extrasEnabled: e.target.checked })} />
        Show extras
      </label>
      {picCount.extrasEnabled && (
        <>
          <Row>
            <span className="text-xs text-gray-500">Extras count</span>
            <input
              className="w-24 bg-surface border border-surface-border rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-accent text-right"
              value={picCount.extras}
              onChange={(e) => updatePicCount({ extras: e.target.value })}
            />
          </Row>
          <Row>
            <span className="text-xs text-gray-500">Extras color</span>
            <ColorInput value={picCount.extrasColor} onChange={(v) => updatePicCount({ extrasColor: v })} />
          </Row>
        </>
      )}
    </div>
  );
}

function LogoSection() {
  const { logo, updateLogo } = useOverlayStore();
  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Slider label="Scale" min={0.3} max={3} step={0.1} value={logo.scale} onChange={(v) => updateLogo({ scale: v })} unit="×" />
    </div>
  );
}

function MascotSection() {
  const { mascot, updateMascot } = useOverlayStore();
  const mascotInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1">
      <button
        onClick={() => mascotInputRef.current?.click()}
        className="w-full px-3 py-1.5 rounded-md bg-surface-overlay border border-surface-border text-xs text-gray-300 hover:border-accent hover:text-gray-100 transition-colors"
      >
        {mascot.url ? 'Change PNG' : 'Load PNG'}
      </button>
      <input
        ref={mascotInputRef}
        type="file" accept="image/png,image/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            const aspect = img.width / img.height;
            const w = mascot.width;
            updateMascot({ url, visible: true, width: w, height: w / aspect });
          };
          img.src = url;
          e.target.value = '';
        }}
      />
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input type="checkbox" checked={mascot.outlineEnabled}
          onChange={(e) => updateMascot({ outlineEnabled: e.target.checked })} />
        Outline
      </label>
      {mascot.outlineEnabled && (
        <>
          <Slider label="Thickness" min={1} max={20} value={mascot.outlineThickness}
            onChange={(v) => updateMascot({ outlineThickness: v })} />
          <Row>
            <span className="text-xs text-gray-500">Color</span>
            <ColorInput value={mascot.outlineColor} onChange={(v) => updateMascot({ outlineColor: v })} />
          </Row>
        </>
      )}
      <p className="text-[11px] text-gray-600 leading-relaxed">
        Scroll wheel over mascot to resize
      </p>
    </div>
  );
}

// ── Brush panel ────────────────────────────────────────────────────────────────

function BrushSection() {
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
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-600 select-none px-3">
        <Paintbrush size={20} strokeWidth={1.5} />
        <p className="text-xs text-center leading-relaxed">Select a column<br />to start painting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1">
      {/* Paint / Erase */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setBrushTool('paint')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            brushTool === 'paint'
              ? 'bg-accent text-white'
              : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
          }`}
        >
          <Brush size={12} /> Paint
        </button>
        <button
          onClick={() => setBrushTool('erase')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            brushTool === 'erase'
              ? 'bg-white text-black'
              : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
          }`}
        >
          <Eraser size={12} /> Erase
        </button>
      </div>

      <Slider label="Brush size" min={5} max={120} value={brushSize} onChange={setBrushSize} />

      <div className="h-px bg-surface-border" />

      {/* Filter type */}
      <span className="text-xs text-gray-500">Filter</span>
      <div className="grid grid-cols-2 gap-1.5">
        {(['blur', 'pixelate'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setBrushFilterType(t)}
            className={`py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              brushFilterType === t
                ? 'bg-accent text-white'
                : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {brushFilterType === 'blur' && (
        <Slider label="Blur radius" min={1} max={80} value={brushBlurRadius} onChange={setBrushBlurRadius} />
      )}
      {brushFilterType === 'pixelate' && (
        <Slider label="Pixel size" min={2} max={60} value={brushPixelSize} onChange={setBrushPixelSize} />
      )}

      <div className="h-px bg-surface-border" />

      {/* Undo / Redo / Clear */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => brushActions.undo()}
          title="Undo (Ctrl+Z)"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border transition-colors"
        >
          <Undo2 size={13} /> Undo
        </button>
        <button
          onClick={() => brushActions.redo()}
          title="Redo (Ctrl+Y)"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 bg-surface-overlay hover:bg-surface-border transition-colors"
        >
          <Redo2 size={13} /> Redo
        </button>
        <button
          onClick={() => brushActions.clear()}
          title="Clear mask"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs text-red-500 hover:text-red-400 bg-surface-overlay hover:bg-surface-border transition-colors"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>
    </div>
  );
}

// ── Filter panel ───────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: FilterType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Blur', value: 'blur' },
  { label: 'Pixelate', value: 'pixelate' },
];

function FilterSection() {
  const { columns, selectedColumnId, updateFilter } = useBannerStore();
  const col = columns.find((c) => c.id === selectedColumnId);
  if (!col) return null;

  const { filter } = col;
  return (
    <div className="flex flex-col gap-3 px-3 py-3 overflow-y-auto flex-1">
      <div className="flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateFilter(col.id, { type: tab.value })}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter.type === tab.value
                ? 'bg-accent text-white'
                : 'bg-surface-overlay text-gray-400 hover:bg-surface-border hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filter.type === 'blur' && (
        <Slider label="Blur radius" min={1} max={80} value={filter.blurRadius}
          onChange={(v) => updateFilter(col.id, { blurRadius: v })} />
      )}
      {filter.type === 'pixelate' && (
        <Slider label="Pixel size" min={2} max={60} value={filter.pixelSize}
          onChange={(v) => updateFilter(col.id, { pixelSize: v })} />
      )}

      {col.image && (
        <button
          onClick={() => useBannerStore.getState().clearColumnImage(col.id)}
          className="mt-auto text-xs text-red-400 hover:text-red-300 transition-colors text-left"
        >
          Clear image
        </button>
      )}
    </div>
  );
}

// ── Root panel ────────────────────────────────────────────────────────────────

const OVERLAY_HEADERS: Record<string, { icon: React.ReactNode; label: string }> = {
  picCount: { icon: <Hash size={14} />, label: 'Image Count' },
  mascot:   { icon: <Smile size={14} />, label: 'Mascot' },
  logo:     { icon: <ImageIcon size={14} />, label: 'Logo' },
};

export function RightPanel() {
  const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
  const brushMode = useBannerStore((s) => s.brushMode);
  const selectedColumnId = useBannerStore((s) => s.selectedColumnId);

  const showOverlay = !!selectedOverlayId;
  const showBrush = !showOverlay && brushMode;
  const showFilter = !showOverlay && !brushMode && !!selectedColumnId;
  const showIdle = !showOverlay && !showBrush && !showFilter;

  return (
    <aside className="w-60 shrink-0 bg-surface-raised border-l border-surface-border flex flex-col overflow-hidden">
      {/* Panel header */}
      {showOverlay && selectedOverlayId && (
        <PanelHeader
          icon={OVERLAY_HEADERS[selectedOverlayId]?.icon}
          label={OVERLAY_HEADERS[selectedOverlayId]?.label ?? selectedOverlayId}
        />
      )}
      {showBrush && <PanelHeader icon={<Paintbrush size={14} />} label="Brush" />}
      {showFilter && <PanelHeader icon={<SlidersHorizontal size={14} />} label="Column Filter" />}

      {/* Content */}
      {showIdle && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-700 select-none px-4">
          <Settings2 size={22} strokeWidth={1.5} />
          <p className="text-xs text-center leading-relaxed text-gray-600">
            Select an overlay<br />or enable brush mode
          </p>
        </div>
      )}

      {showOverlay && selectedOverlayId === 'picCount' && <PicCountSection />}
      {showOverlay && selectedOverlayId === 'logo' && <LogoSection />}
      {showOverlay && selectedOverlayId === 'mascot' && <MascotSection />}
      {showBrush && <BrushSection />}
      {showFilter && <FilterSection />}
    </aside>
  );
}
