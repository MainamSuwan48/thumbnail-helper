/**
 * Renders an image with a stroke/outline outside its alpha boundary.
 * Uses the "draw at 16 angular offsets → source-in fill → original on top" technique.
 */
export function createOutlinedCanvas(
  img: HTMLImageElement,
  strokeWidth: number,
  strokeColor: string,
): HTMLCanvasElement {
  const pad = Math.ceil(strokeWidth);
  const canvas = document.createElement('canvas');
  canvas.width = img.width + pad * 2;
  canvas.height = img.height + pad * 2;
  const ctx = canvas.getContext('2d')!;

  // Draw image at 16 angular positions to build expanded alpha
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    ctx.drawImage(img, pad + Math.cos(angle) * strokeWidth, pad + Math.sin(angle) * strokeWidth);
  }

  // Flood the accumulated alpha with strokeColor
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = strokeColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  // Draw original on top
  ctx.drawImage(img, pad, pad);
  return canvas;
}
