import {
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Stage, Layer, Group, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useCoverStore, coverUid } from '../../store/coverStore';
import type { CoverImage } from '../../store/coverStore';
import { computeFillLayout, computeMainImageRect, type LayoutRect } from './FillLayout';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CoverCanvasHandle {
  exportCover: () => Promise<string | null>;
}

interface CoverCanvasProps {
  scale: number;
  onImagesDropped?: (files: { name: string; url: string }[]) => void;
}

// ── Main image sub-component ─────────────────────────────────────────────────

function MainImageNode({
  image,
  canvasSize,
}: {
  image: CoverImage;
  canvasSize: number;
}) {
  const [img] = useImage(image.url);
  if (!img) return null;

  const rect = computeMainImageRect(canvasSize, image.naturalWidth, image.naturalHeight);

  return (
    <KonvaImage
      image={img}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      listening={false}
    />
  );
}

// ── Fill image sub-component ─────────────────────────────────────────────────

function FillImageNode({ rect, url }: { rect: LayoutRect; url: string }) {
  const [img] = useImage(url);
  if (!img) return null;

  return (
    <KonvaImage
      image={img}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      listening={false}
    />
  );
}

// ── Artist name overlay sub-component ────────────────────────────────────────

function ArtistNameOverlay({
  canvasSize,
  x,
  y,
  overlayScale,
  onDragEnd,
  onScaleChange,
}: {
  canvasSize: number;
  x: number;
  y: number;
  overlayScale: number;
  onDragEnd: (x: number, y: number) => void;
  onScaleChange: (s: number) => void;
}) {
  const [img] = useImage('/artist-name.png');
  if (!img) return null;

  const w = img.naturalWidth * overlayScale;
  const h = img.naturalHeight * overlayScale;
  // y === -1 means "auto bottom-left"
  const posY = y === -1 ? canvasSize - h - 20 : y;

  return (
    <KonvaImage
      image={img}
      x={x}
      y={posY}
      width={w}
      height={h}
      draggable
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onWheel={(e) => {
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
        onScaleChange(Math.max(0.02, Math.min(1, overlayScale * delta)));
      }}
    />
  );
}

// ── Cover Canvas ─────────────────────────────────────────────────────────────

export const CoverCanvas = forwardRef<CoverCanvasHandle, CoverCanvasProps>(
  function CoverCanvas({ scale, onImagesDropped }, ref) {
    const stageRef = useRef<Konva.Stage>(null);
    const {
      canvasSize,
      mainImage,
      fillPool,
      fillCount,
      fillSeed,
      artistOverlay,
      setMainImage,
      updateArtistOverlay,
      addToFillPool,
    } = useCoverStore();

    // Export — temporarily reset viewport scale to get full-resolution output
    useImperativeHandle(ref, () => ({
      exportCover: async () => {
        const stage = stageRef.current;
        if (!stage) return null;
        const prevScaleX = stage.scaleX();
        const prevScaleY = stage.scaleY();
        stage.scaleX(1);
        stage.scaleY(1);
        stage.batchDraw();
        const url = stage.toDataURL({ pixelRatio: 1 });
        stage.scaleX(prevScaleX);
        stage.scaleY(prevScaleY);
        stage.batchDraw();
        return url;
      },
    }));

    // Fill layout computation
    const fillLayout = useMemo(
      () => computeFillLayout(canvasSize, mainImage, fillPool, fillCount, fillSeed),
      [canvasSize, mainImage, fillPool, fillCount, fillSeed],
    );

    // Map imageId → url for quick lookup
    const fillUrlMap = useMemo(() => {
      const m = new Map<string, string>();
      for (const img of fillPool) m.set(img.id, img.url);
      return m;
    }, [fillPool]);

    // Load image dimensions helper
    const loadImageDimensions = useCallback((url: string, name: string): Promise<CoverImage> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: coverUid(),
            url,
            name,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          });
        };
        img.src = url;
      });
    }, []);

    // Drop handler
    const handleDrop = useCallback(
      async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedImages: { name: string; url: string }[] = [];
        const isFromExplorer = e.dataTransfer.files.length > 0;

        if (isFromExplorer) {
          for (const file of Array.from(e.dataTransfer.files)) {
            if (!file.type.startsWith('image/')) continue;
            droppedImages.push({ name: file.name, url: URL.createObjectURL(file) });
          }
        } else {
          const url = e.dataTransfer.getData('text/plain');
          if (url) droppedImages.push({ name: '', url });
        }
        if (droppedImages.length === 0) return;

        // Load dimensions for all images
        const loaded = await Promise.all(
          droppedImages.map((d) => loadImageDimensions(d.url, d.name)),
        );

        if (!mainImage) {
          // First image becomes main, rest go to fill pool
          setMainImage(loaded[0]);
          if (loaded.length > 1) addToFillPool(loaded.slice(1));
        } else {
          // All go to fill pool
          addToFillPool(loaded);
        }

        if (isFromExplorer) onImagesDropped?.(droppedImages);
      },
      [mainImage, setMainImage, addToFillPool, loadImageDimensions, onImagesDropped],
    );

    return (
      <div
        style={{
          position: 'relative',
          width: canvasSize * scale,
          height: canvasSize * scale,
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={canvasSize}
          height={canvasSize}
          scaleX={scale}
          scaleY={scale}
          style={{ background: '#000' }}
        >
          <Layer>
            <Group
              clipX={0}
              clipY={0}
              clipWidth={canvasSize}
              clipHeight={canvasSize}
            >
              {/* Background */}
              <Rect x={0} y={0} width={canvasSize} height={canvasSize} fill="#000" />

              {/* Fill images (rendered behind main image) */}
              {fillLayout.map((rect, i) => {
                const url = fillUrlMap.get(rect.imageId);
                if (!url) return null;
                return <FillImageNode key={`${rect.imageId}-${i}`} rect={rect} url={url} />;
              })}

              {/* Main image */}
              {mainImage && (
                <MainImageNode
                  image={mainImage}
                  canvasSize={canvasSize}
                />
              )}

              {/* Artist name overlay */}
              {artistOverlay.visible && (
                <ArtistNameOverlay
                  canvasSize={canvasSize}
                  x={artistOverlay.x}
                  y={artistOverlay.y}
                  overlayScale={artistOverlay.scale}
                  onDragEnd={(x, y) => updateArtistOverlay({ x, y })}
                  onScaleChange={(s) => updateArtistOverlay({ scale: s })}
                />
              )}
            </Group>
          </Layer>
        </Stage>
      </div>
    );
  },
);
