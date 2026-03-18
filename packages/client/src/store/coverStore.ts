import { create } from "zustand";
import { persist } from "zustand/middleware";
import { autoMainDividerPos, equalDividers } from "../components/cover/FillLayout";

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

interface CellOverride {
  panX: number;
  panY: number;
  zoom: number;
}

export type CellId = 'main' | number;

interface CoverStore {
  canvasSize: number;

  // Main image
  mainImage: CoverImage | null;
  mainImageOverride: CellOverride;

  // Fill images pool
  fillPool: CoverImage[];

  // Layout controls
  fillCount: number;
  fillSeed: number;
  mainDividerPos: number;
  fillDividers: number[];
  cellOverrides: Record<string, CellOverride>;

  // Cell assignments (explicit user picks override shuffle)
  cellAssignments: Record<number, string>;

  // Selection
  selectedCellId: CellId | null;

  // Artist name overlay
  artistOverlay: ArtistOverlay;

  // Actions
  setCanvasSize: (s: number) => void;
  setMainImage: (img: CoverImage | null) => void;
  updateMainImageOverride: (patch: Partial<CellOverride>) => void;
  addToFillPool: (imgs: CoverImage[]) => void;
  removeFromFillPool: (id: string) => void;
  replaceFillImage: (index: number, img: CoverImage) => void;
  clearFillPool: () => void;
  setFillCount: (n: number) => void;
  shuffle: () => void;
  setMainDividerPos: (pos: number) => void;
  setFillDividers: (dividers: number[]) => void;
  updateCellOverride: (imageId: string, patch: Partial<CellOverride>) => void;
  assignCell: (index: number, imageId: string) => void;
  setSelectedCellId: (id: CellId | null) => void;
  resetDividers: () => void;
  updateArtistOverlay: (patch: Partial<ArtistOverlay>) => void;
}

let _coverId = 0;
export const coverUid = () => `cov-${++_coverId}`;

const DEFAULT_CELL: CellOverride = { panX: 0, panY: 0, zoom: 1 };

export const useCoverStore = create<CoverStore>()(
  persist(
    (set, get) => ({
      canvasSize: 1080,

      mainImage: null,
      mainImageOverride: { ...DEFAULT_CELL },

      fillPool: [],

      fillCount: 3,
      fillSeed: 0,
      mainDividerPos: 0.6,
      fillDividers: equalDividers(3),
      cellOverrides: {},

      cellAssignments: {},
      selectedCellId: null,

      artistOverlay: { visible: true, x: 20, y: -1, scale: 0.15 },

      setCanvasSize: (canvasSize) => set({ canvasSize }),

      setMainImage: (mainImage) => {
        const updates: Partial<CoverStore> = {
          mainImage,
          mainImageOverride: { ...DEFAULT_CELL },
        };
        if (mainImage) {
          updates.mainDividerPos = autoMainDividerPos(
            mainImage.naturalWidth,
            mainImage.naturalHeight,
          );
        }
        updates.cellOverrides = {};
        updates.cellAssignments = {};
        const { fillCount } = get();
        updates.fillDividers = equalDividers(fillCount);
        set(updates);
      },

      updateMainImageOverride: (patch) =>
        set((s) => ({
          mainImageOverride: { ...s.mainImageOverride, ...patch },
        })),

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

      replaceFillImage: (_index, img) =>
        set((s) => {
          const pool = [...s.fillPool];
          const exists = pool.find((f) => f.name === img.name);
          if (!exists) {
            pool.push(img);
          }
          const newOverrides = { ...s.cellOverrides };
          delete newOverrides[img.id];
          return { fillPool: pool, cellOverrides: newOverrides };
        }),

      clearFillPool: () => set({ fillPool: [], cellOverrides: {}, cellAssignments: {}, selectedCellId: null }),

      setFillCount: (n) => {
        const fillCount = Math.max(1, Math.min(n, 5));
        set({
          fillCount,
          fillDividers: equalDividers(fillCount),
          cellOverrides: {},
          cellAssignments: {},
        });
      },

      shuffle: () => set({ fillSeed: Math.random(), cellOverrides: {}, cellAssignments: {} }),

      setMainDividerPos: (mainDividerPos) =>
        set({ mainDividerPos: Math.max(0.2, Math.min(0.85, mainDividerPos)) }),

      setFillDividers: (fillDividers) => set({ fillDividers }),

      updateCellOverride: (imageId, patch) =>
        set((s) => ({
          cellOverrides: {
            ...s.cellOverrides,
            [imageId]: { ...(s.cellOverrides[imageId] ?? DEFAULT_CELL), ...patch },
          },
        })),

      assignCell: (index, imageId) =>
        set((s) => ({
          cellAssignments: { ...s.cellAssignments, [index]: imageId },
        })),

      setSelectedCellId: (selectedCellId) => set({ selectedCellId }),

      resetDividers: () =>
        set((s) => {
          const updates: Partial<CoverStore> = {
            fillDividers: equalDividers(s.fillCount),
            cellOverrides: {},
            mainImageOverride: { ...DEFAULT_CELL },
          };
          if (s.mainImage) {
            updates.mainDividerPos = autoMainDividerPos(
              s.mainImage.naturalWidth,
              s.mainImage.naturalHeight,
            );
          }
          return updates;
        }),

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
