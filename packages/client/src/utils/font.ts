const FONT_FAMILY = 'FOT-Yuruka Std';
const FALLBACK = "'Rounded Mplus 1c', 'M PLUS Rounded 1c', Arial Rounded MT Bold, sans-serif";

export const OVERLAY_FONT = `'${FONT_FAMILY}', ${FALLBACK}`;

export async function preloadFont() {
  try {
    const face = new FontFace(FONT_FAMILY, "url('/fonts/FOT-YurukaStd.otf'), url('/fonts/FOT-YurukaStd.ttf')");
    const loaded = await face.load();
    document.fonts.add(loaded);
  } catch {
    // Font file not placed yet — fallback will be used silently
  }
}
