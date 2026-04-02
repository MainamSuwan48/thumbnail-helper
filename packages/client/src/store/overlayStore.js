import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useOverlayStore = create()(persist((set) => ({
    selectedOverlayId: null,
    picCount: {
        visible: true,
        x: 28,
        bottomOffset: 165,
        count: "108",
        fontSize: 72,
        color: "#ff6b8a",
        opacity: 1,
        scale: 1,
        shadowEnabled: true,
        strokeEnabled: true,
        strokeColor: "#ffffff",
        strokeWidth: 16,
        extrasEnabled: false,
        extras: "3",
        extrasColor: "#ffe07a",
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
        outlineColor: "#ffffff",
    },
    logo: {
        scale: 1,
    },
    setSelectedOverlay: (id) => set({ selectedOverlayId: id }),
    updatePicCount: (p) => set((s) => ({ picCount: { ...s.picCount, ...p } })),
    updateMascot: (p) => set((s) => ({ mascot: { ...s.mascot, ...p } })),
    updateLogo: (p) => set((s) => ({ logo: { ...s.logo, ...p } })),
}), {
    name: "thumbnail-helper-overlay-v2",
    partialize: (state) => ({
        picCount: state.picCount,
        mascot: { ...state.mascot, url: null, visible: false },
        logo: state.logo,
    }),
}));
