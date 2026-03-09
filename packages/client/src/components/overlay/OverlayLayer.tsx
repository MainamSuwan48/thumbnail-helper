import { useRef, useEffect, useState } from 'react';
import { Layer, Group, Text, Rect, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useOverlayStore } from '../../store/overlayStore';
import { OVERLAY_FONT } from '../../utils/font';
import { createOutlinedCanvas } from '../../utils/mascotOutline';

// ── Pic count ─────────────────────────────────────────────────────────────────

function PicCountBadge() {
  const { picCount, selectedOverlayId, setSelectedOverlay, updatePicCount } = useOverlayStore();
  if (!picCount.visible) return null;
  const isSelected = selectedOverlayId === 'picCount';
  const shadow = picCount.shadowEnabled
    ? { shadowColor: 'rgba(0,0,0,0.6)', shadowBlur: 8, shadowOffsetX: 2, shadowOffsetY: 2 }
    : {};

  return (
    <Group
      x={picCount.x} y={picCount.y}
      opacity={picCount.opacity}
      draggable
      onClick={() => setSelectedOverlay('picCount')}
      onDragEnd={(e) => {
        updatePicCount({ x: picCount.x + e.target.x(), y: picCount.y + e.target.y() });
        e.target.position({ x: 0, y: 0 });
      }}
    >
      <Text
        text={picCount.count}
        fontFamily={OVERLAY_FONT}
        fontStyle="bold"
        fontSize={picCount.fontSize}
        fill={picCount.color}
        {...shadow}
      />
      {isSelected && (
        <Rect
          x={-4} y={-4}
          width={picCount.count.length * picCount.fontSize * 0.62 + 8}
          height={picCount.fontSize + 8}
          fill="transparent"
          stroke="#7c3aed" strokeWidth={1.5} dash={[4, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}

// ── Logo badge ────────────────────────────────────────────────────────────────

function LogoBadge() {
  const { logoBadge, selectedOverlayId, setSelectedOverlay, updateLogoBadge } = useOverlayStore();
  if (!logoBadge.visible) return null;
  const isSelected = selectedOverlayId === 'logoBadge';

  const textWidth = logoBadge.text.length * logoBadge.fontSize * 0.65;
  const badgeW = textWidth + logoBadge.paddingX * 2;
  const badgeH = logoBadge.fontSize + logoBadge.paddingY * 2;

  return (
    <Group
      x={logoBadge.x} y={logoBadge.y}
      draggable
      onClick={() => setSelectedOverlay('logoBadge')}
      onDragEnd={(e) => {
        updateLogoBadge({ x: logoBadge.x + e.target.x(), y: logoBadge.y + e.target.y() });
        e.target.position({ x: 0, y: 0 });
      }}
    >
      <Rect
        width={badgeW} height={badgeH}
        fill={logoBadge.bgColor} opacity={logoBadge.bgOpacity}
        cornerRadius={logoBadge.borderRadius}
      />
      <Text
        text={logoBadge.text}
        fontFamily={OVERLAY_FONT}
        fontStyle="bold"
        fontSize={logoBadge.fontSize}
        fill={logoBadge.textColor}
        x={logoBadge.paddingX} y={logoBadge.paddingY}
      />
      {isSelected && (
        <Rect
          x={-2} y={-2}
          width={badgeW + 4} height={badgeH + 4}
          fill="transparent" stroke="#7c3aed" strokeWidth={1.5}
          cornerRadius={logoBadge.borderRadius + 2}
          listening={false}
        />
      )}
    </Group>
  );
}

// ── Mascot ────────────────────────────────────────────────────────────────────

function MascotNode() {
  const { mascot, selectedOverlayId, setSelectedOverlay, updateMascot } = useOverlayStore();
  const imgRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [outlinedCanvas, setOutlinedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rawImg] = useImage(mascot.url ?? '', 'anonymous');

  useEffect(() => {
    if (!rawImg) { setOutlinedCanvas(null); return; }
    if (mascot.outlineEnabled && mascot.outlineThickness > 0) {
      setOutlinedCanvas(
        createOutlinedCanvas(rawImg as unknown as HTMLImageElement, mascot.outlineThickness, mascot.outlineColor),
      );
    } else {
      setOutlinedCanvas(null);
    }
  }, [rawImg, mascot.outlineEnabled, mascot.outlineThickness, mascot.outlineColor]);

  useEffect(() => {
    if (selectedOverlayId === 'mascot' && imgRef.current && trRef.current) {
      trRef.current.nodes([imgRef.current]);
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
    trRef.current?.getLayer()?.batchDraw();
  }, [selectedOverlayId]);

  if (!mascot.visible || !mascot.url) return null;

  const pad = mascot.outlineEnabled ? mascot.outlineThickness : 0;

  return (
    <>
      <KonvaImage
        ref={imgRef}
        image={outlinedCanvas ?? (rawImg as unknown as HTMLImageElement) ?? undefined}
        x={mascot.x - pad} y={mascot.y - pad}
        width={mascot.width + pad * 2}
        height={mascot.height + pad * 2}
        rotation={mascot.rotation}
        draggable
        onClick={() => setSelectedOverlay('mascot')}
        onDragEnd={(e) => {
          updateMascot({ x: e.target.x() + pad, y: e.target.y() + pad });
          e.target.position({ x: mascot.x - pad, y: mascot.y - pad });
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

// ── Layer ─────────────────────────────────────────────────────────────────────
// Render order: mascot first (below), then logoBadge (above mascot on export)

export function OverlayLayer({ canvasWidth: _canvasWidth }: { canvasWidth: number }) {
  const setSelectedOverlay = useOverlayStore((s) => s.setSelectedOverlay);

  return (
    <Layer
      onClick={(e) => {
        if (e.target instanceof Konva.Layer) setSelectedOverlay(null);
      }}
    >
      <PicCountBadge />
      <MascotNode />
      <LogoBadge />
    </Layer>
  );
}
