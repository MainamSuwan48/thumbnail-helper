import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Brush } from 'lucide-react';
import { TabBar, type AppTab } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { Sidebar, type LocalFile } from './components/Sidebar';
import { BannerCanvas, type BannerCanvasHandle } from './components/BannerCanvas';
import { FilterPanel } from './components/FilterPanel';
import { BrushPanel } from './components/BrushPanel';
import { OverlayPanel } from './components/OverlayPanel';
import { CoverCanvas, type CoverCanvasHandle } from './components/cover/CoverCanvas';
import { CoverToolbar } from './components/cover/CoverToolbar';
import { useBannerStore } from './store/bannerStore';
import { useCoverStore, coverUid } from './store/coverStore';
import { useOverlayStore } from './store/overlayStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('banner');

  // Banner state
  const { canvasWidth, canvasHeight, selectedColumnId, brushMode, setBrushMode, columns } = useBannerStore();
  const selectedOverlayId = useOverlayStore((s) => s.selectedOverlayId);
  const bannerCanvasAreaRef = useRef<HTMLDivElement>(null);
  const bannerCanvasRef = useRef<BannerCanvasHandle>(null);
  const [bannerScale, setBannerScale] = useState(1);

  // Cover state
  const coverCanvasSize = useCoverStore((s) => s.canvasSize);
  const coverMainImage = useCoverStore((s) => s.mainImage);
  const coverFillPool = useCoverStore((s) => s.fillPool);
  const coverCanvasAreaRef = useRef<HTMLDivElement>(null);
  const coverCanvasRef = useRef<CoverCanvasHandle>(null);
  const [coverScale, setCoverScale] = useState(1);

  // Separate sidebar pools
  const [bannerFiles, setBannerFiles] = useState<LocalFile[]>([]);
  const [coverFiles, setCoverFiles] = useState<LocalFile[]>([]);

  // Active sidebar files based on tab
  const sidebarFiles = activeTab === 'banner' ? bannerFiles : coverFiles;
  const setSidebarFiles = activeTab === 'banner' ? setBannerFiles : setCoverFiles;

  // Banner auto-scale
  useEffect(() => {
    if (activeTab !== 'banner') return;
    function updateScale() {
      const el = bannerCanvasAreaRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const padding = 48;
      setBannerScale(Math.min(1, (width - padding) / canvasWidth, (height - padding) / canvasHeight));
    }
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (bannerCanvasAreaRef.current) ro.observe(bannerCanvasAreaRef.current);
    return () => ro.disconnect();
  }, [canvasWidth, canvasHeight, activeTab]);

  // Cover auto-scale
  useEffect(() => {
    if (activeTab !== 'cover') return;
    function updateScale() {
      const el = coverCanvasAreaRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const padding = 48;
      setCoverScale(Math.min(1, (width - padding) / coverCanvasSize, (height - padding) / coverCanvasSize));
    }
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (coverCanvasAreaRef.current) ro.observe(coverCanvasAreaRef.current);
    return () => ro.disconnect();
  }, [coverCanvasSize, activeTab]);

  // Sidebar helpers — always operate on the active tab's pool
  function addFilesToSidebar(newFiles: LocalFile[]) {
    setSidebarFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }

  // Dedicated adders for canvas drop callbacks (they fire regardless of activeTab)
  function addBannerFiles(newFiles: LocalFile[]) {
    setBannerFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }

  function addCoverFiles(newFiles: LocalFile[]) {
    setCoverFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }

  function handleFilesLoaded(newFiles: LocalFile[]) {
    addFilesToSidebar(newFiles);
  }

  // Used URLs — scoped to active tab
  const bannerUsedUrls = useMemo(() => {
    const urls = new Set<string>();
    for (const col of columns) {
      if (col.image) urls.add(col.image.url);
    }
    return urls;
  }, [columns]);

  const coverUsedUrls = useMemo(() => {
    const urls = new Set<string>();
    if (coverMainImage) urls.add(coverMainImage.url);
    for (const img of coverFillPool) urls.add(img.url);
    return urls;
  }, [coverMainImage, coverFillPool]);

  const usedUrls = activeTab === 'banner' ? bannerUsedUrls : coverUsedUrls;

  function handleClearUnused() {
    setSidebarFiles((prev) => {
      const unused = prev.filter((f) => !usedUrls.has(f.url));
      unused.forEach((f) => { if (f.url.startsWith('blob:')) URL.revokeObjectURL(f.url); });
      return prev.filter((f) => usedUrls.has(f.url));
    });
  }

  function handleClearAll() {
    // Revoke current tab's sidebar blob URLs
    sidebarFiles.forEach((f) => { if (f.url.startsWith('blob:')) URL.revokeObjectURL(f.url); });
    setSidebarFiles([]);

    if (activeTab === 'banner') {
      const bannerState = useBannerStore.getState();
      for (const col of bannerState.columns) {
        if (col.image) bannerState.clearColumnImage(col.id);
      }
    } else {
      const coverState = useCoverStore.getState();
      coverState.setMainImage(null);
      coverState.clearFillPool();
    }
  }

  function handleRemoveFile(file: LocalFile) {
    // Remove from sidebar
    setSidebarFiles((prev) => prev.filter((f) => f.url !== file.url));

    // Also remove from canvas if in use
    if (activeTab === 'banner') {
      const bannerState = useBannerStore.getState();
      for (const col of bannerState.columns) {
        if (col.image?.url === file.url) bannerState.clearColumnImage(col.id);
      }
    } else {
      const coverState = useCoverStore.getState();
      if (coverState.mainImage?.url === file.url) coverState.setMainImage(null);
      const fillMatch = coverState.fillPool.find((f) => f.url === file.url);
      if (fillMatch) coverState.removeFromFillPool(fillMatch.id);
    }

    if (file.url.startsWith('blob:')) URL.revokeObjectURL(file.url);
  }

  // Helper: load image dimensions and create CoverImage
  function loadAsCoverImage(file: LocalFile): Promise<import('./store/coverStore').CoverImage> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          id: coverUid(),
          url: file.url,
          name: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
      };
      img.src = file.url;
    });
  }

  // Sidebar click handler — mode-aware
  const handleImageClick = useCallback(
    async (file: LocalFile) => {
      if (activeTab === 'banner') {
        if (!selectedColumnId) return;
        useBannerStore.getState().setColumnImage(selectedColumnId, {
          path: file.name,
          url: file.url,
          x: 0,
          y: 0,
          scale: 1,
        });
      } else {
        const store = useCoverStore.getState();
        const coverImage = await loadAsCoverImage(file);
        if (!store.mainImage) {
          store.setMainImage(coverImage);
        } else {
          store.addToFillPool([coverImage]);
        }
      }
    },
    [activeTab, selectedColumnId],
  );

  // Cover mode: set a different image as main
  const handleSetAsMain = useCallback(
    async (file: LocalFile) => {
      const store = useCoverStore.getState();
      const oldMain = store.mainImage;
      const coverImage = await loadAsCoverImage(file);
      // Remove from fill pool if it was there
      const existing = store.fillPool.find((f) => f.url === file.url);
      if (existing) store.removeFromFillPool(existing.id);
      // Set new main
      store.setMainImage(coverImage);
      // Move old main to fill pool
      if (oldMain) store.addToFillPool([oldMain]);
    },
    [],
  );

  const showOverlayPanel = !!selectedOverlayId;
  const showFilterPanel = !showOverlayPanel && !brushMode && !!selectedColumnId;
  const showBrushPanel = !showOverlayPanel && brushMode;

  const sidebarHint = activeTab === 'banner'
    ? !!selectedColumnId
    : !useCoverStore.getState().mainImage;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'banner' && <Toolbar canvasRef={bannerCanvasRef} />}
      {activeTab === 'cover' && <CoverToolbar canvasRef={coverCanvasRef} />}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          files={sidebarFiles}
          onFilesLoaded={handleFilesLoaded}
          hasSelectedColumn={sidebarHint}
          usedUrls={usedUrls}
          onClearUnused={handleClearUnused}
          onImageClick={handleImageClick}
          mode={activeTab}
          mainImageUrl={coverMainImage?.url ?? null}
          onSetAsMain={handleSetAsMain}
          onClearAll={handleClearAll}
          onRemoveFile={handleRemoveFile}
        />

        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Banner — always mounted, hidden via CSS to preserve brush masks */}
          <div className={`flex flex-col flex-1 overflow-hidden ${activeTab !== 'banner' ? 'hidden' : ''}`}>
            <div
              ref={bannerCanvasAreaRef}
              className="flex-1 flex items-center justify-center bg-[#111] overflow-hidden"
            >
              <BannerCanvas
                ref={bannerCanvasRef}
                scale={bannerScale}
                onImagesDropped={(files) => addBannerFiles(files.map((f) => ({ name: f.name, url: f.url })))}
              />
            </div>

            {showOverlayPanel && <OverlayPanel />}
            {showFilterPanel && <FilterPanel />}
            {showBrushPanel && <BrushPanel />}

            <div className="border-t border-surface-border bg-surface px-4 py-1.5 flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !brushMode;
                  setBrushMode(next);
                  if (next) useOverlayStore.getState().setSelectedOverlay(null);
                }}
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
          </div>

          {/* Cover */}
          <div
            ref={coverCanvasAreaRef}
            className={`flex-1 flex items-center justify-center bg-[#111] overflow-hidden ${activeTab !== 'cover' ? 'hidden' : ''}`}
          >
            <CoverCanvas
              ref={coverCanvasRef}
              scale={coverScale}
              onImagesDropped={(files) => addCoverFiles(files.map((f) => ({ name: f.name, url: f.url })))}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
