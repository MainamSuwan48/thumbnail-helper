import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CoverImage {
  id: string;
  url: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
}

interface ArtistOverlay {
  visible: boolean;
  x: number;
  y: number;
  scale: number;
}

interface CoverStore {
  canvasSize: number;

  // Main image
  mainImage: CoverImage | null;
  mainImageX: number;
  mainImageY: number;
  mainImageScale: number;

  // Fill images pool
  fillPool: CoverImage[];

  // Layout controls
  fillCount: number; // how many fill images to display
  fillSeed: number; // shuffle seed

  // Artist name overlay
  artistOverlay: ArtistOverlay;

  // Actions
  setCanvasSize: (s: number) => void;
  setMainImage: (img: CoverImage | null) => void;
  updateMainImagePosition: (x: number, y: number) => void;
  updateMainImageScale: (s: number) => void;
  addToFillPool: (imgs: CoverImage[]) => void;
  removeFromFillPool: (id: string) => void;
  clearFillPool: () => void;
  setFillCount: (n: number) => void;
  shuffle: () => void;
  updateArtistOverlay: (patch: Partial<ArtistOverlay>) => void;
}

let _coverId = 0;
export const coverUid = () => `cov-${++_coverId}`;

export const useCoverStore = create<CoverStore>()(
  persist(
    (set) => ({
      canvasSize: 1080,

      mainImage: null,
      mainImageX: 0,
      mainImageY: 0,
      mainImageScale: 1,

      fillPool: [],

      fillCount: 3,
      fillSeed: 0,

      artistOverlay: { visible: true, x: 20, y: -1, scale: 0.15 },

      setCanvasSize: (canvasSize) => set({ canvasSize }),

      setMainImage: (mainImage) =>
        set({
          mainImage,
          mainImageX: 0,
          mainImageY: 0,
          mainImageScale: 1,
        }),

      updateMainImagePosition: (mainImageX, mainImageY) =>
        set({ mainImageX, mainImageY }),
      updateMainImageScale: (mainImageScale) => set({ mainImageScale }),

      addToFillPool: (imgs) =>
        set((s) => {
          const existingNames = new Set(s.fillPool.map((f) => f.name));
          const unique = imgs.filter((i) => !existingNames.has(i.name));
          return { fillPool: [...s.fillPool, ...unique] };
        }),

      removeFromFillPool: (id) =>
        set((s) => ({
          fillPool: s.fillPool.filter((i) => i.id !== id),
        })),

      clearFillPool: () => set({ fillPool: [] }),

      setFillCount: (fillCount) => set({ fillCount }),

      shuffle: () => set({ fillSeed: Math.random() }),

      updateArtistOverlay: (patch) =>
        set((s) => ({
          artistOverlay: { ...s.artistOverlay, ...patch },
        })),
    }),
    {
      name: "thumbnail-helper-cover",
      partialize: (state) => ({
        canvasSize: state.canvasSize,
        fillCount: state.fillCount,
        artistOverlay: state.artistOverlay,
      }),
    },
  ),
);
