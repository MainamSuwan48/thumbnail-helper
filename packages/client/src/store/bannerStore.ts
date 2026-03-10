import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColumnState, FilterState, ImageState } from '../types';

let _id = 0;
const uid = () => `col-${++_id}`;

function makeColumn(widthRatio: number): ColumnState {
  return {
    id: uid(),
    widthRatio,
    image: null,
    filter: { type: 'none', blurRadius: 15, pixelSize: 20 },
  };
}

function makeEqualColumns(count: number): ColumnState[] {
  const ratio = 1 / count;
  return Array.from({ length: count }, () => makeColumn(ratio));
}

interface BannerStore {
  // Canvas config
  canvasWidth: number;
  canvasHeight: number;
  columnCount: number;
  columns: ColumnState[];
  selectedColumnId: string | null;
  slantPx: number;

  // Brush state
  brushMode: boolean;
  brushTool: 'paint' | 'erase';
  brushSize: number;
  brushFilterType: 'blur' | 'pixelate';
  brushBlurRadius: number;
  brushPixelSize: number;

  // Actions
  setDimensions: (w: number, h: number) => void;
  setColumnCount: (count: number) => void;
  setSelectedColumn: (id: string | null) => void;

  setColumnImage: (columnId: string, image: ImageState) => void;
  clearColumnImage: (columnId: string) => void;

  updateImagePosition: (columnId: string, x: number, y: number) => void;
  updateImageScale: (columnId: string, scale: number) => void;

  updateFilter: (columnId: string, patch: Partial<FilterState>) => void;

  /** Drag a column divider: clamp ratios between adjacent columns */
  resizeColumns: (leftId: string, rightId: string, delta: number) => void;

  setSlantPx: (px: number) => void;

  // Brush actions
  setBrushMode: (on: boolean) => void;
  setBrushTool: (tool: 'paint' | 'erase') => void;
  setBrushSize: (size: number) => void;
  setBrushFilterType: (type: 'blur' | 'pixelate') => void;
  setBrushBlurRadius: (r: number) => void;
  setBrushPixelSize: (s: number) => void;
}

export const useBannerStore = create<BannerStore>()(
  persist(
    (set, get) => ({
      canvasWidth: 1280,
      canvasHeight: 720,
      columnCount: 3,
      columns: makeEqualColumns(3),
      selectedColumnId: null,
      slantPx: 15,

      brushMode: true,
      brushTool: 'paint',
      brushSize: 40,
      brushFilterType: 'pixelate',
      brushBlurRadius: 20,
      brushPixelSize: 20,

      setDimensions: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),

      setColumnCount: (count) => {
        const { columns } = get();
        const ratio = 1 / count;
        let newColumns: ColumnState[];
        if (count >= columns.length) {
          const extras = Array.from({ length: count - columns.length }, () => makeColumn(ratio));
          newColumns = [...columns, ...extras].map((c) => ({ ...c, widthRatio: ratio }));
        } else {
          newColumns = columns.slice(0, count).map((c) => ({ ...c, widthRatio: ratio }));
        }
        set({ columnCount: count, columns: newColumns });
      },

      setSelectedColumn: (id) => set({ selectedColumnId: id }),

      setColumnImage: (columnId, image) =>
        set((s) => ({
          columns: s.columns.map((c) => (c.id === columnId ? { ...c, image } : c)),
        })),

      clearColumnImage: (columnId) =>
        set((s) => ({
          columns: s.columns.map((c) => (c.id === columnId ? { ...c, image: null } : c)),
        })),

      updateImagePosition: (columnId, x, y) =>
        set((s) => ({
          columns: s.columns.map((c) =>
            c.id === columnId && c.image ? { ...c, image: { ...c.image, x, y } } : c,
          ),
        })),

      updateImageScale: (columnId, scale) =>
        set((s) => ({
          columns: s.columns.map((c) =>
            c.id === columnId && c.image ? { ...c, image: { ...c.image, scale } } : c,
          ),
        })),

      updateFilter: (columnId, patch) =>
        set((s) => ({
          columns: s.columns.map((c) =>
            c.id === columnId ? { ...c, filter: { ...c.filter, ...patch } } : c,
          ),
        })),

      resizeColumns: (leftId, rightId, delta) => {
        const { columns, canvasWidth } = get();
        const minRatio = 80 / canvasWidth;
        const left = columns.find((c) => c.id === leftId)!;
        const right = columns.find((c) => c.id === rightId)!;
        const deltaRatio = delta / canvasWidth;
        const newLeft = Math.max(minRatio, left.widthRatio + deltaRatio);
        const newRight = Math.max(minRatio, right.widthRatio - deltaRatio);
        if (newLeft + newRight !== left.widthRatio + right.widthRatio) return;
        set({
          columns: columns.map((c) => {
            if (c.id === leftId) return { ...c, widthRatio: newLeft };
            if (c.id === rightId) return { ...c, widthRatio: newRight };
            return c;
          }),
        });
      },

      setSlantPx: (px) => set({ slantPx: px }),

      setBrushMode: (on) => set({ brushMode: on }),
      setBrushTool: (tool) => set({ brushTool: tool }),
      setBrushSize: (size) => set({ brushSize: size }),
      setBrushFilterType: (type) => set({ brushFilterType: type }),
      setBrushBlurRadius: (r) => set({ brushBlurRadius: r }),
      setBrushPixelSize: (s) => set({ brushPixelSize: s }),
    }),
    {
      name: 'thumbnail-helper-banner',
      // Strip blob image URLs (they die on reload) and transient UI state
      partialize: (state) => ({
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        columnCount: state.columnCount,
        slantPx: state.slantPx,
        columns: state.columns.map((c) => ({ ...c, image: null })),
        brushMode: state.brushMode,
        brushTool: state.brushTool,
        brushSize: state.brushSize,
        brushFilterType: state.brushFilterType,
        brushBlurRadius: state.brushBlurRadius,
        brushPixelSize: state.brushPixelSize,
      }),
      // Sync the uid counter so new columns don't clash with restored IDs
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const maxId = state.columns.reduce((max, c) => {
          const n = parseInt(c.id.replace('col-', ''), 10);
          return isNaN(n) ? max : Math.max(max, n);
        }, 0);
        _id = maxId;
      },
    },
  ),
);
