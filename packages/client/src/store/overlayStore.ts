import { create } from 'zustand';

export type OverlayId = 'picCount' | 'logoBadge' | 'mascot';

export interface PicCountState {
  visible: boolean;
  x: number;
  y: number;
  count: string;       // just the number e.g. "108"
  fontSize: number;
  color: string;
  opacity: number;
  shadowEnabled: boolean;
}

export interface LogoBadgeState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
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
  logoBadge: LogoBadgeState;
  mascot: MascotState;

  setSelectedOverlay: (id: OverlayId | null) => void;
  updatePicCount: (p: Partial<PicCountState>) => void;
  updateLogoBadge: (p: Partial<LogoBadgeState>) => void;
  updateMascot: (p: Partial<MascotState>) => void;
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  selectedOverlayId: null,

  picCount: {
    visible: true,
    x: 30,
    y: 320,
    count: '108',
    fontSize: 72,
    color: '#ff6b8a',
    opacity: 0.9,
    shadowEnabled: true,
  },
  logoBadge: {
    visible: true,
    x: 900,
    y: 340,
    text: 'CreatorName',
    fontSize: 32,
    textColor: '#ffffff',
    bgColor: '#ff6b8a',
    bgOpacity: 0.85,
    borderRadius: 16,
    paddingX: 20,
    paddingY: 12,
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
  updateLogoBadge: (p) => set((s) => ({ logoBadge: { ...s.logoBadge, ...p } })),
  updateMascot: (p) => set((s) => ({ mascot: { ...s.mascot, ...p } })),
}));
