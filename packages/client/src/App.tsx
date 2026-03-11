import { useEffect, useMemo, useRef, useState } from 'react';
import { Brush } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { Sidebar, type LocalFile } from './components/Sidebar';
import { BannerCanvas, type BannerCanvasHandle } from './components/BannerCanvas';
import { FilterPanel } from './components/FilterPanel';
import { BrushPanel } from './components/BrushPanel';
import { OverlayPanel } from './components/OverlayPanel';
import { useBannerStore } from './store/bannerStore';
import { useOverlayStore } from './store/overlayStore';

export default function App() {
  const { canvasWidth, canvasHeight, selectedColumnId, brushMode, setBrushMode, columns } = useBannerStore();
  const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const bannerCanvasRef = useRef<BannerCanvasHandle>(null);
  const [scale, setScale] = useState(1);
  const [sidebarFiles, setSidebarFiles] = useState<LocalFile[]>([]);

  useEffect(() => {
    function updateScale() {
      const el = canvasAreaRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const padding = 48;
      setScale(Math.min(1, (width - padding) / canvasWidth, (height - padding) / canvasHeight));
    }
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (canvasAreaRef.current) ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, [canvasWidth, canvasHeight]);

  function addFilesToSidebar(newFiles: LocalFile[]) {
    setSidebarFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }

  function handleFilesLoaded(newFiles: LocalFile[]) {
    addFilesToSidebar(newFiles);
  }

  const usedUrls = useMemo(() => {
    const urls = new Set<string>();
    for (const col of columns) {
      if (col.image) urls.add(col.image.url);
    }
    return urls;
  }, [columns]);

  function handleClearUnused() {
    setSidebarFiles((prev) => {
      const unused = prev.filter((f) => !usedUrls.has(f.url));
      unused.forEach((f) => { if (f.url.startsWith('blob:')) URL.revokeObjectURL(f.url); });
      return prev.filter((f) => usedUrls.has(f.url));
    });
  }

  const showOverlayPanel = !!selectedOverlayId;
  const showFilterPanel = !showOverlayPanel && !brushMode && !!selectedColumnId;
  const showBrushPanel = !showOverlayPanel && brushMode;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar canvasRef={bannerCanvasRef} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={sidebarFiles}
          onFilesLoaded={handleFilesLoaded}
          hasSelectedColumn={!!selectedColumnId}
          usedUrls={usedUrls}
          onClearUnused={handleClearUnused}
          onImageClick={(file) => {
            if (!selectedColumnId) return;
            useBannerStore.getState().setColumnImage(selectedColumnId, {
              path: file.name,
              url: file.url,
              x: 0,
              y: 0,
              scale: 1,
            });
          }}
        />

        <main className="flex flex-col flex-1 overflow-hidden">
          <div
            ref={canvasAreaRef}
            className="flex-1 flex items-center justify-center bg-[#111] overflow-hidden"
          >
            <BannerCanvas
              ref={bannerCanvasRef}
              scale={scale}
              onImagesDropped={(files) => addFilesToSidebar(files.map((f) => ({ name: f.name, url: f.url })))}
            />
          </div>

          {/* Bottom panels */}
          {showOverlayPanel && <OverlayPanel />}
          {showFilterPanel && <FilterPanel />}
          {showBrushPanel && <BrushPanel />}

          {/* Brush mode toggle bar */}
          <div className="border-t border-surface-border bg-surface px-4 py-1.5 flex items-center gap-3">
            <button
              onClick={() => setBrushMode(!brushMode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                brushMode
                  ? 'bg-[#ff1e64] text-white'
                  : 'bg-surface-overlay text-gray-300 hover:bg-surface-border'
              }`}
            >
              <Brush size={12} />
              {brushMode ? 'Brush On' : 'Brush Mode'}
            </button>
            {brushMode && (
              <span className="text-xs text-gray-500">
                Select a column → paint filter onto the image
              </span>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
