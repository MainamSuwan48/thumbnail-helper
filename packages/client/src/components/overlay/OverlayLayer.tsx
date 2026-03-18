import { useRef, useEffect, useState } from "react";
import {
  Layer,
  Group,
  Text,
  Line,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useOverlayStore } from "../../store/overlayStore";
import { useBannerStore } from "../../store/bannerStore";
import { OVERLAY_FONT } from "../../utils/font";
import { createOutlinedCanvas } from "../../utils/mascotOutline";
import { IMAGES_LETTERS } from "../BannerCanvas";

// ── Blinking selection border (reusable) ─────────────────────────────────────

function BlinkingBorder({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const lineRef = useRef<Konva.Line>(null);

  useEffect(() => {
    const layer = lineRef.current?.getLayer();
    if (!layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!lineRef.current || !frame) return;
      const t = 0.5 + 0.5 * Math.sin(frame.time * 0.005);
      lineRef.current.opacity(0.3 + 0.7 * t);
      lineRef.current.shadowBlur(4 + 8 * t);
    }, layer);
    anim.start();
    return () => { anim.stop(); };
  }, []);

  return (
    <Line
      ref={lineRef}
      name="ui-only"
      points={[x, y, x + width, y, x + width, y + height, x, y + height]}
      closed
      stroke="#7c3aed"
      strokeWidth={1.5}
      shadowColor="#7c3aed"
      shadowBlur={8}
      shadowOpacity={1}
      dash={[6, 4]}
      listening={false}
    />
  );
}

// ── Text group (pic count + "Images" letters) ────────────────────────────────

function TextGroup({ canvasHeight }: { canvasHeight: number }) {
  const { picCount, selectedOverlayId, setSelectedOverlay } = useOverlayStore();
  const brushMode = useBannerStore((s) => s.brushMode);
  const [imagesCanvas, setImagesCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const imagesRef = useRef<Konva.Image>(null);

  useEffect(() => {
    document.fonts.ready.then(() =>
      setImagesCanvas(buildImagesCanvas(picCount.fontSize)),
    );
  }, [picCount.fontSize]);

  // Keep "Images" node above picCount text
  useEffect(() => {
    if (imagesRef.current) {
      imagesRef.current.setZIndex(1);
      imagesRef.current.getLayer()?.batchDraw();
    }
  }, [imagesCanvas]);

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

  const groupY = canvasHeight - picCount.bottomOffset;

  // "Images" position relative to count text
  const countTextW = picCount.count.length * picCount.fontSize * 0.6;
  const imgX = countTextW + 10;
  const imgY = imagesCanvas
    ? picCount.fontSize - imagesCanvas.height + 35
    : 0;

  // Bounding box for selection border (approximate)
  const totalW =
    countTextW + (imagesCanvas ? imagesCanvas.width + 10 : 0) + 8;
  const totalH = picCount.fontSize + 8;

  return (
    <Group
      x={picCount.x}
      y={groupY}
      opacity={picCount.opacity}
      rotation={-8}
      scaleX={picCount.scale}
      scaleY={picCount.scale}
      onClick={() => {
        if (brushMode || selectedOverlayId === "mascot") return;
        setSelectedOverlay("picCount");
        useBannerStore.getState().setSelectedColumn(null);
      }}
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
      {imagesCanvas && (
        <KonvaImage
          ref={imagesRef}
          image={imagesCanvas}
          x={imgX}
          y={imgY}
          width={imagesCanvas.width}
          height={imagesCanvas.height}
          rotation={-5}
          listening={false}
        />
      )}
      {isSelected && (
        <BlinkingBorder x={-4} y={-4} width={totalW} height={totalH} />
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

  const rawPad = mascot.outlineEnabled ? mascot.outlineThickness : 0;
  const aspectRatio = mascot.width / Math.max(1, mascot.height);

  // Scale the outline padding from raw-image pixel space to screen space
  const imgW = rawImg?.width ?? 1;
  const imgH = rawImg?.height ?? 1;
  const padX = rawPad * (mascot.width / imgW);
  const padY = rawPad * (mascot.height / imgH);

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={
          outlinedCanvas ?? (rawImg as unknown as HTMLImageElement) ?? undefined
        }
        x={mascot.x - padX}
        y={mascot.y - padY}
        width={mascot.width + padX * 2}
        height={mascot.height + padY * 2}
        rotation={mascot.rotation}
        draggable={!useBannerStore.getState().brushMode}
        onClick={() => {
          if (useBannerStore.getState().brushMode) return;
          setSelectedOverlay("mascot");
          useBannerStore.getState().setSelectedColumn(null);
        }}
        onDragEnd={(e) => {
          updateMascot({ x: e.target.x() + padX, y: e.target.y() + padY });
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
          const totalW = node.width() * node.scaleX();
          const totalH = node.height() * node.scaleY();
          const contentW = Math.max(20, totalW * (imgW / (imgW + rawPad * 2)));
          const contentH = Math.max(20, totalH * (imgH / (imgH + rawPad * 2)));
          const newPadX = rawPad * (contentW / imgW);
          const newPadY = rawPad * (contentH / imgH);
          updateMascot({
            x: node.x() + newPadX,
            y: node.y() + newPadY,
            width: contentW,
            height: contentH,
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      <Transformer
        ref={trRef}
        name="ui-only"
        rotateEnabled
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) =>
          newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
        }
      />
    </>
  );
}

// ── Logo (bottom-right, clickable + scalable) ─────────────────────────────────

const LOGO_STROKE_WIDTH = 8;

function LogoImage({
  canvasWidth,
  canvasHeight,
}: {
  canvasWidth: number;
  canvasHeight: number;
}) {
  const { logo, selectedOverlayId, setSelectedOverlay } = useOverlayStore();
  const brushMode = useBannerStore((s) => s.brushMode);
  const [htmlImg, setHtmlImg] = useState<HTMLImageElement | null>(null);
  const [outlinedCanvas, setOutlinedCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

  useEffect(() => {
    const el = new Image();
    el.onload = () => setHtmlImg(el);
    el.onerror = () => console.warn("Logo failed to load: /user-assets/your-logo.png");
    el.src = "/user-assets/your-logo.png";
  }, []);

  useEffect(() => {
    if (!htmlImg) {
      setOutlinedCanvas(null);
      return;
    }
    setOutlinedCanvas(
      createOutlinedCanvas(htmlImg, LOGO_STROKE_WIDTH, "#ffffff"),
    );
  }, [htmlImg]);

  if (!outlinedCanvas) return null;

  const baseW = 500;
  const baseH = Math.round(
    (htmlImg!.naturalHeight / htmlImg!.naturalWidth) * baseW,
  );
  const logoW = baseW * logo.scale;
  const logoH = baseH * logo.scale;
  const margin = 20;
  const imgScale = baseW / htmlImg!.naturalWidth;
  const pad = Math.ceil(LOGO_STROKE_WIDTH);
  const padScale = pad * imgScale * logo.scale;
  const x = canvasWidth - logoW - margin;
  const y = canvasHeight - logoH - margin;

  const isSelected = selectedOverlayId === "logo";

  return (
    <Group>
      <KonvaImage
        image={outlinedCanvas}
        x={x - padScale}
        y={y - padScale}
        width={logoW + padScale * 2}
        height={logoH + padScale * 2}
        onClick={() => {
          if (brushMode || selectedOverlayId === "mascot") return;
          setSelectedOverlay("logo");
          useBannerStore.getState().setSelectedColumn(null);
        }}
      />
      {isSelected && (
        <BlinkingBorder
          x={x - padScale}
          y={y - padScale}
          width={logoW + padScale * 2}
          height={logoH + padScale * 2}
        />
      )}
    </Group>
  );
}

// ── "Images" offscreen canvas builder ────────────────────────────────────────

// Base ratio: "Images" is ~58% of the picCount fontSize
const IMAGES_RATIO = 0.58;
const STROKE_RATIO = 0.19; // stroke relative to images font size

function buildImagesCanvas(countFontSize: number): HTMLCanvasElement | null {
  const fontSize = Math.round(countFontSize * IMAGES_RATIO);
  const stroke = Math.max(2, Math.round(fontSize * STROKE_RATIO));
  const font = `bold ${fontSize}px ${OVERLAY_FONT}`;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const gap = 2;
  const charMetrics = IMAGES_LETTERS.map(({ char, tx }) => ({
    w: measure.measureText(char).width,
    tx,
  }));
  const totalW =
    charMetrics.reduce((s, m) => s + m.w + gap, 0) + stroke * 2 + 20;
  const totalH = fontSize + stroke * 2 + 20;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(totalW);
  canvas.height = Math.ceil(totalH);
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.textBaseline = "top";

  let cursorX = stroke + 5;
  for (let i = 0; i < IMAGES_LETTERS.length; i++) {
    const { char, rotate, tx, ty } = IMAGES_LETTERS[i];
    const s = fontSize / 42; // scale nudge values relative to base size
    const cx = cursorX + charMetrics[i].w / 2 + tx * s;
    const cy = stroke + 5 + fontSize / 2 + ty * s;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotate * Math.PI) / 180);

    ctx.lineWidth = stroke;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(char, -charMetrics[i].w / 2, -fontSize / 2);

    ctx.fillStyle = "#a8d8f0";
    ctx.fillText(char, -charMetrics[i].w / 2, -fontSize / 2);

    ctx.restore();
    cursorX += charMetrics[i].w + gap;
  }
  return canvas;
}

// ── Layer ─────────────────────────────────────────────────────────────────────

export function OverlayLayer({ canvasWidth }: { canvasWidth: number }) {
  const canvasHeight = useBannerStore((s) => s.canvasHeight);
  const brushMode = useBannerStore((s) => s.brushMode);
  const setSelectedOverlay = useOverlayStore((s) => s.setSelectedOverlay);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    document.fonts.ready.then(() => {
      layerRef.current?.batchDraw();
    });
  }, []);

  return (
    <Layer
      ref={layerRef}
      listening={!brushMode}
      onClick={(e) => {
        if (e.target instanceof Konva.Layer) setSelectedOverlay(null);
      }}
    >
      <TextGroup canvasHeight={canvasHeight} />
      <MascotNode />
      <LogoImage canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
    </Layer>
  );
}
