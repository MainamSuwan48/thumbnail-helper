import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OverlayId = 'picCount' | 'mascot' | 'logo';

export interface PicCountState {
  visible: boolean;
  x: number;
  bottomOffset: number;
  count: string;
  fontSize: number;
  color: string;
  opacity: number;
  scale: number;
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

export interface LogoState {
  scale: number;
}

interface OverlayStore {
  selectedOverlayId: OverlayId | null;
  picCount: PicCountState;
  mascot: MascotState;
  logo: LogoState;

  setSelectedOverlay: (id: OverlayId | null) => void;
  updatePicCount: (p: Partial<PicCountState>) => void;
  updateMascot: (p: Partial<MascotState>) => void;
  updateLogo: (p: Partial<LogoState>) => void;
}

export const useOverlayStore = create<OverlayStore>()(
  persist(
    (set) => ({
      selectedOverlayId: null,

      picCount: {
        visible: true,
        x: 28,
        bottomOffset: 165,
        count: '108',
        fontSize: 72,
        color: '#ff6b8a',
        opacity: 0.9,
        scale: 1,
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
      logo: {
        scale: 1,
      },

      setSelectedOverlay: (id) => set({ selectedOverlayId: id }),
      updatePicCount: (p) => set((s) => ({ picCount: { ...s.picCount, ...p } })),
      updateMascot: (p) => set((s) => ({ mascot: { ...s.mascot, ...p } })),
      updateLogo: (p) => set((s) => ({ logo: { ...s.logo, ...p } })),
    }),
    {
      name: 'thumbnail-helper-overlay-v2',
      partialize: (state) => ({
        picCount: state.picCount,
        mascot: { ...state.mascot, url: null, visible: false },
        logo: state.logo,
      }),
    },
  ),
);
