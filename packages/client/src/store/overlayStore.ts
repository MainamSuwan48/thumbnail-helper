import { create } from 'zustand';

export type OverlayId = 'picCount' | 'mascot';

export interface PicCountState {
  visible: boolean;
  x: number;
  y: number;
  count: string;       // just the number e.g. "108"
  fontSize: number;
  color: string;
  opacity: number;
  shadowEnabled: boolean;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface MascotState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  url: string | null;
  outlineEnabled: boolean;
  outlineThickness: number;
  outlineColor: string;
}

interface OverlayStore {
  selectedOverlayId: OverlayId | null;
  picCount: PicCountState;
  mascot: MascotState;

  setSelectedOverlay: (id: OverlayId | null) => void;
  updatePicCount: (p: Partial<PicCountState>) => void;
  updateMascot: (p: Partial<MascotState>) => void;
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  selectedOverlayId: null,

  picCount: {
    visible: true,
    x: 28,
    y: 555,
    count: '108',
    fontSize: 72,
    color: '#ff6b8a',
    opacity: 0.9,
    shadowEnabled: true,
    strokeEnabled: true,
    strokeColor: '#ffffff',
    strokeWidth: 16,
  },
  mascot: {
    visible: false,
    x: 820,
    y: 260,
    width: 120,
    height: 120,
    rotation: 0,
    url: null,
    outlineEnabled: true,
    outlineThickness: 4,
    outlineColor: '#ffffff',
  },

  setSelectedOverlay: (id) => set({ selectedOverlayId: id }),
  updatePicCount: (p) => set((s) => ({ picCount: { ...s.picCount, ...p } })),
  updateMascot: (p) => set((s) => ({ mascot: { ...s.mascot, ...p } })),
}));
