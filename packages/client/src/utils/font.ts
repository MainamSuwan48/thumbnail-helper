const FONT_FAMILY = 'FOT-Yuruka Std';
const FALLBACK = "'Rounded Mplus 1c', 'M PLUS Rounded 1c', Arial Rounded MT Bold, sans-serif";

export const OVERLAY_FONT = `'${FONT_FAMILY}', ${FALLBACK}`;

export async function preloadFont() {
  try {
    // Register for ALL weights — canvas text matching requires the exact weight
    const faces = [
      new FontFace(FONT_FAMILY, "url('/fot-yuruka-std.ttf')", { weight: 'normal' }),
      new FontFace(FONT_FAMILY, "url('/fot-yuruka-std.ttf')", { weight: 'bold' }),
    ];
    const loaded = await Promise.all(faces.map((f) => f.load()));
    loaded.forEach((f) => document.fonts.add(f));
  } catch {
    // Font not available — fallback used silently
  }
  await document.fonts.ready;
}
