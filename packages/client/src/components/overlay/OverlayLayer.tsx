import { useRef, useEffect, useState } from "react";
import {
  Layer,
  Group,
  Text,
  Rect,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useOverlayStore } from "../../store/overlayStore";
import { useBannerStore } from "../../store/bannerStore";
import { OVERLAY_FONT } from "../../utils/font";
import { createOutlinedCanvas } from "../../utils/mascotOutline";

// ── Pic count (fixed position, no drag) ───────────────────────────────────────

function PicCountBadge() {
  const { picCount, selectedOverlayId, setSelectedOverlay } = useOverlayStore();
  if (!picCount.visible) return null;
  const isSelected = selectedOverlayId === "picCount";
  const shadow = picCount.shadowEnabled
    ? {
        shadowColor: "rgba(0,0,0,0.6)",
        shadowBlur: 8,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
      }
    : {};

  return (
    <Group
      x={picCount.x}
      y={picCount.y}
      opacity={picCount.opacity}
      rotation={-8}
      onClick={() => setSelectedOverlay("picCount")}
    >
      <Text
        text={picCount.count}
        fontFamily={OVERLAY_FONT}
        fontStyle="bold"
        fontSize={picCount.fontSize}
        fill={picCount.color}
        stroke={picCount.strokeEnabled ? picCount.strokeColor : undefined}
        strokeWidth={picCount.strokeEnabled ? picCount.strokeWidth : undefined}
        fillAfterStrokeEnabled={picCount.strokeEnabled}
        {...shadow}
      />
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={picCount.count.length * picCount.fontSize * 0.62 + 8}
          height={picCount.fontSize + 8}
          fill="transparent"
          stroke="#7c3aed"
          strokeWidth={1.5}
          dash={[4, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}

// ── Mascot (draggable, scroll to resize, Delete key to clear) ─────────────────

function MascotNode() {
  const { mascot, selectedOverlayId, setSelectedOverlay, updateMascot } =
    useOverlayStore();
  const imgRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [outlinedCanvas, setOutlinedCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [rawImg] = useImage(mascot.url ?? "");

  useEffect(() => {
    if (!rawImg) {
      setOutlinedCanvas(null);
      return;
    }
    if (mascot.outlineEnabled && mascot.outlineThickness > 0) {
      setOutlinedCanvas(
        createOutlinedCanvas(
          rawImg as unknown as HTMLImageElement,
          mascot.outlineThickness,
          mascot.outlineColor,
        ),
      );
    } else {
      setOutlinedCanvas(null);
    }
  }, [
    rawImg,
    mascot.outlineEnabled,
    mascot.outlineThickness,
    mascot.outlineColor,
  ]);

  useEffect(() => {
    if (selectedOverlayId === "mascot" && imgRef.current && trRef.current) {
      trRef.current.nodes([imgRef.current]);
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
    trRef.current?.getLayer()?.batchDraw();
  }, [selectedOverlayId]);

  // Delete key clears the mascot so a new one can be loaded
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const state = useOverlayStore.getState();
      if (state.selectedOverlayId === "mascot") {
        e.preventDefault();
        state.updateMascot({ url: null, visible: false });
        state.setSelectedOverlay(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mascot.visible || !mascot.url) return null;

  const pad = mascot.outlineEnabled ? mascot.outlineThickness : 0;
  const aspectRatio = mascot.width / Math.max(1, mascot.height);

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={
          outlinedCanvas ?? (rawImg as unknown as HTMLImageElement) ?? undefined
        }
        x={mascot.x - pad}
        y={mascot.y - pad}
        width={mascot.width + pad * 2}
        height={mascot.height + pad * 2}
        rotation={mascot.rotation}
        draggable
        onClick={() => setSelectedOverlay("mascot")}
        onDragEnd={(e) => {
          updateMascot({ x: e.target.x() + pad, y: e.target.y() + pad });
          e.target.position({ x: mascot.x - pad, y: mascot.y - pad });
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          const factor = e.evt.deltaY < 0 ? 1.06 : 0.94;
          const newW = Math.max(20, mascot.width * factor);
          updateMascot({
            width: newW,
            height: Math.max(20, newW / aspectRatio),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          updateMascot({
            x: node.x() + pad,
            y: node.y() + pad,
            width: Math.max(20, node.width() * node.scaleX() - pad * 2),
            height: Math.max(20, node.height() * node.scaleY() - pad * 2),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      <Transformer
        ref={trRef}
        rotateEnabled
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) =>
          newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
        }
      />
    </>
  );
}

// ── Logo (bottom-right, on top of everything) ────────────────────────────────

function LogoImage({
  canvasWidth,
  canvasHeight,
}: {
  canvasWidth: number;
  canvasHeight: number;
}) {
  const [htmlImg, setHtmlImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = new Image();
    el.onload = () => setHtmlImg(el);
    el.onerror = () => console.warn("Logo failed to load: /your-logo.png");
    el.src = "/your-logo.png";
  }, []);

  if (!htmlImg) return null;

  const logoW = 500;
  const logoH = Math.round(
    (htmlImg.naturalHeight / htmlImg.naturalWidth) * logoW,
  );
  const margin = 20;

  return (
    <KonvaImage
      image={htmlImg}
      x={canvasWidth - logoW - margin + 100}
      y={canvasHeight - logoH - margin + 160}
      width={logoW}
      height={logoH}
      listening={false}
    />
  );
}

// ── Layer ─────────────────────────────────────────────────────────────────────

export function OverlayLayer({ canvasWidth }: { canvasWidth: number }) {
  const canvasHeight = useBannerStore((s) => s.canvasHeight);
  const setSelectedOverlay = useOverlayStore((s) => s.setSelectedOverlay);
  const layerRef = useRef<Konva.Layer>(null);

  // Force redraw after fonts settle so custom font appears in Konva text
  useEffect(() => {
    document.fonts.ready.then(() => {
      layerRef.current?.batchDraw();
    });
  }, []);

  return (
    <Layer
      ref={layerRef}
      onClick={(e) => {
        if (e.target instanceof Konva.Layer) setSelectedOverlay(null);
      }}
    >
      <PicCountBadge />
      <MascotNode />
      {/* Logo rendered last = on top of mascot */}
      <LogoImage canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
    </Layer>
  );
}
