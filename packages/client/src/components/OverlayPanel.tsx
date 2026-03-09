import { useRef } from 'react';
import { useOverlayStore } from '../store/overlayStore';

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border border-surface-border bg-transparent" />
      <span className="text-xs text-gray-400 font-mono">{value}</span>
    </div>
  );
}

function Slider({ label, min, max, value, onChange, unit = '' }: {
  label: string; min: number; max: number; value: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400 w-20 shrink-0">{label}</label>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 accent-accent" />
      <span className="text-xs text-gray-300 w-10">{value}{unit}</span>
    </div>
  );
}

export function OverlayPanel() {
  const {
    selectedOverlayId,
    picCount, updatePicCount,
    mascot, updateMascot,
  } = useOverlayStore();
  const mascotInputRef = useRef<HTMLInputElement>(null);

  if (!selectedOverlayId) return null;

  return (
    <div className="border-t border-surface-border bg-surface-raised px-4 py-3 flex flex-wrap gap-x-6 gap-y-3 items-center">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest shrink-0">
        {selectedOverlayId === 'picCount' ? 'Pic Count' : 'Mascot'}
      </span>

      {/* PicCount — just the number + style */}
      {selectedOverlayId === 'picCount' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Count</label>
            <input
              className="w-20 bg-surface border border-surface-border rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-accent"
              value={picCount.count}
              onChange={(e) => updatePicCount({ count: e.target.value })}
            />
          </div>
          <Slider label="Font size" min={24} max={120} value={picCount.fontSize} onChange={(v) => updatePicCount({ fontSize: v })} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color</label>
            <ColorInput value={picCount.color} onChange={(v) => updatePicCount({ color: v })} />
          </div>
          <Slider label="Opacity" min={0} max={100} value={Math.round(picCount.opacity * 100)} onChange={(v) => updatePicCount({ opacity: v / 100 })} unit="%" />
          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={picCount.shadowEnabled} onChange={(e) => updatePicCount({ shadowEnabled: e.target.checked })} />
            Shadow
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={picCount.strokeEnabled} onChange={(e) => updatePicCount({ strokeEnabled: e.target.checked })} />
            Stroke
          </label>
          {picCount.strokeEnabled && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Stroke Color</label>
                <ColorInput value={picCount.strokeColor} onChange={(v) => updatePicCount({ strokeColor: v })} />
              </div>
              <Slider label="Stroke W" min={1} max={20} value={picCount.strokeWidth} onChange={(v) => updatePicCount({ strokeWidth: v })} />
            </>
          )}
        </>
      )}

      {/* Mascot */}
      {selectedOverlayId === 'mascot' && (
        <>
          <button
            onClick={() => mascotInputRef.current?.click()}
            className="px-3 py-1 rounded bg-surface-overlay border border-surface-border text-xs text-gray-300 hover:border-accent transition-colors"
          >
            {mascot.url ? 'Change PNG' : 'Load PNG'}
          </button>
          <input
            ref={mascotInputRef}
            type="file" accept="image/png,image/*" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              updateMascot({ url: URL.createObjectURL(file), visible: true });
              e.target.value = '';
            }}
          />
          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={mascot.outlineEnabled}
              onChange={(e) => updateMascot({ outlineEnabled: e.target.checked })} />
            Outline
          </label>
          {mascot.outlineEnabled && (
            <>
              <Slider label="Thickness" min={1} max={20} value={mascot.outlineThickness}
                onChange={(v) => updateMascot({ outlineThickness: v })} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Color</label>
                <ColorInput value={mascot.outlineColor} onChange={(v) => updateMascot({ outlineColor: v })} />
              </div>
            </>
          )}
          <span className="text-xs text-gray-500">Scroll wheel over mascot to resize proportionally</span>
        </>
      )}
    </div>
  );
}
