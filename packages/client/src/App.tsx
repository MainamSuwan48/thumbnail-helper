import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useOverlayStore } from './store/overlayStore';
import { TabBar, type AppTab } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { Sidebar, type LocalFile } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { BannerCanvas, type BannerCanvasHandle } from './components/BannerCanvas';
import { CoverCanvas, type CoverCanvasHandle } from './components/cover/CoverCanvas';
import { CoverToolbar } from './components/cover/CoverToolbar';
import { useBannerStore } from './store/bannerStore';
import { useCoverStore, coverUid } from './store/coverStore';
import { computeSelectedFill } from './components/cover/FillLayout';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('banner');

  // Global hotkeys — B: brush mode, M: mascot overlay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const s = useBannerStore.getState();
        const next = !s.brushMode;
        s.setBrushMode(next);
        if (next) useOverlayStore.getState().setSelectedOverlay(null);
      }

      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const o = useOverlayStore.getState();
        const newId = o.selectedOverlayId === 'mascot' ? null : 'mascot';
        o.setSelectedOverlay(newId);
        if (newId) {
          useBannerStore.getState().setSelectedColumn(null);
          useBannerStore.getState().setBrushMode(false);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Banner state
  const { canvasWidth, canvasHeight, selectedColumnId, columns } = useBannerStore();
  const bannerCanvasAreaRef = useRef<HTMLDivElement>(null);
  const bannerCanvasRef = useRef<BannerCanvasHandle>(null);
  const [bannerScale, setBannerScale] = useState(1);

  // Cover state
  const coverCanvasSize = useCoverStore((s) => s.canvasSize);
  const coverMainImage = useCoverStore((s) => s.mainImage);
  const coverFillPool = useCoverStore((s) => s.fillPool);
  const coverFillCount = useCoverStore((s) => s.fillCount);
  const coverFillSeed = useCoverStore((s) => s.fillSeed);
  const coverCellAssignments = useCoverStore((s) => s.cellAssignments);
  const coverCanvasAreaRef = useRef<HTMLDivElement>(null);
  const coverCanvasRef = useRef<CoverCanvasHandle>(null);
  const [coverScale, setCoverScale] = useState(1);

  // Separate sidebar pools
  const [bannerFiles, setBannerFiles] = useState<LocalFile[]>([]);
  const [coverFiles, setCoverFiles] = useState<LocalFile[]>([]);

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

  function addFilesToSidebar(newFiles: LocalFile[]) {
    setSidebarFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }

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

  const coverCellLabels = useMemo(() => {
    const labels = new Map<string, string>();
    if (!coverMainImage) return labels;
    labels.set(coverMainImage.url, 'MAIN');
    const selected = computeSelectedFill(coverFillPool, coverFillCount, coverFillSeed, coverCellAssignments);
    for (let i = 0; i < selected.length; i++) {
      const img = selected[i];
      if (img) labels.set(img.url, String(i + 1));
    }
    return labels;
  }, [coverMainImage, coverFillPool, coverFillCount, coverFillSeed, coverCellAssignments]);

  function handleClearUnused() {
    setSidebarFiles((prev) => {
      const unused = prev.filter((f) => !usedUrls.has(f.url));
      unused.forEach((f) => { if (f.url.startsWith('blob:')) URL.revokeObjectURL(f.url); });
      return prev.filter((f) => usedUrls.has(f.url));
    });
  }

  function handleClearAll() {
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
    setSidebarFiles((prev) => prev.filter((f) => f.url !== file.url));

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
        const sel = store.selectedCellId;

        if (sel === 'main') {
          const oldMain = store.mainImage;
          const existing = store.fillPool.find((f) => f.url === file.url);
          if (existing) store.removeFromFillPool(existing.id);
          store.setMainImage(coverImage);
          if (oldMain) store.addToFillPool([oldMain]);
        } else if (typeof sel === 'number') {
          store.addToFillPool([coverImage]);
          store.assignCell(sel, coverImage.id);
        } else {
          if (!store.mainImage) {
            store.setMainImage(coverImage);
          } else {
            store.addToFillPool([coverImage]);
          }
        }
      }
    },
    [activeTab, selectedColumnId],
  );

  const handleSetAsMain = useCallback(
    async (file: LocalFile) => {
      const store = useCoverStore.getState();
      const oldMain = store.mainImage;
      const coverImage = await loadAsCoverImage(file);
      const existing = store.fillPool.find((f) => f.url === file.url);
      if (existing) store.removeFromFillPool(existing.id);
      store.setMainImage(coverImage);
      if (oldMain) store.addToFillPool([oldMain]);
    },
    [],
  );

  const coverSelectedCell = useCoverStore((s) => s.selectedCellId);
  const sidebarHint = activeTab === 'banner'
    ? !!selectedColumnId
    : coverSelectedCell != null || !coverMainImage;

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
          cellLabels={activeTab === 'cover' ? coverCellLabels : undefined}
        />

        <main className="flex flex-1 overflow-hidden">
          {/* Banner — always mounted, hidden via CSS to preserve brush masks */}
          <div className={`flex flex-col flex-1 overflow-hidden ${activeTab !== 'banner' ? 'hidden' : ''}`}>
            <div
              ref={bannerCanvasAreaRef}
              className="flex-1 flex items-center justify-center bg-[#0f0f11] overflow-hidden"
            >
              <BannerCanvas
                ref={bannerCanvasRef}
                scale={bannerScale}
                onImagesDropped={(files) => addBannerFiles(files.map((f) => ({ name: f.name, url: f.url })))}
              />
            </div>
          </div>

          {/* Cover */}
          <div
            ref={coverCanvasAreaRef}
            className={`flex-1 flex items-center justify-center bg-[#0f0f11] overflow-hidden ${activeTab !== 'cover' ? 'hidden' : ''}`}
          >
            <CoverCanvas
              ref={coverCanvasRef}
              scale={coverScale}
              onImagesDropped={(files) => addCoverFiles(files.map((f) => ({ name: f.name, url: f.url })))}
            />
          </div>
        </main>

        {/* Right context panel — banner mode only */}
        {activeTab === 'banner' && <RightPanel />}
      </div>
    </div>
  );
}
