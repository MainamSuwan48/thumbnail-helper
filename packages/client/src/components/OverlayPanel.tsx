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
    logoBadge, updateLogoBadge,
    mascot, updateMascot,
  } = useOverlayStore();
  const mascotInputRef = useRef<HTMLInputElement>(null);

  if (!selectedOverlayId) return null;

  return (
    <div className="border-t border-surface-border bg-surface-raised px-4 py-3 flex flex-wrap gap-x-6 gap-y-3 items-center">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest shrink-0">
        {selectedOverlayId === 'picCount' ? 'Pic Count' : selectedOverlayId === 'logoBadge' ? 'Logo Badge' : 'Mascot'}
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
        </>
      )}

      {/* LogoBadge */}
      {selectedOverlayId === 'logoBadge' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Text</label>
            <input
              className="w-36 bg-surface border border-surface-border rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-accent"
              value={logoBadge.text}
              onChange={(e) => updateLogoBadge({ text: e.target.value })}
            />
          </div>
          <Slider label="Font size" min={14} max={72} value={logoBadge.fontSize} onChange={(v) => updateLogoBadge({ fontSize: v })} />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Text</label>
              <ColorInput value={logoBadge.textColor} onChange={(v) => updateLogoBadge({ textColor: v })} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Badge</label>
              <ColorInput value={logoBadge.bgColor} onChange={(v) => updateLogoBadge({ bgColor: v })} />
            </div>
          </div>
          <Slider label="Opacity" min={0} max={100} value={Math.round(logoBadge.bgOpacity * 100)} onChange={(v) => updateLogoBadge({ bgOpacity: v / 100 })} unit="%" />
          <Slider label="Radius" min={0} max={40} value={logoBadge.borderRadius} onChange={(v) => updateLogoBadge({ borderRadius: v })} />
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
          <Slider label="Width" min={40} max={400} value={mascot.width} onChange={(v) => updateMascot({ width: v })} />
          <Slider label="Height" min={40} max={400} value={mascot.height} onChange={(v) => updateMascot({ height: v })} />
        </>
      )}
    </div>
  );
}
