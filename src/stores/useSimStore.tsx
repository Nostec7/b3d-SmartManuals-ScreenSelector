import { create } from "zustand";
import type { ActionMsg, ScreenDoc } from "../types";

type Box2D = [number, number, number, number]; // [yMin, xMin, yMax, xMax] in 0..1000

type SimState = {
  screens: ScreenDoc[];
  currentIndex: number;
  debug: boolean;

  /** Per-screen per-anchor edits (in 0..1000 coords). */
  overrides: Record<number, Record<string, Box2D>>;

  selectedAnchorKey: string | null;

  actionMsg: ActionMsg | null;
  showController: boolean;

  setScreens: (screens: ScreenDoc[]) => void;
  setCurrentIndex: (i: number) => void;
  next: () => void;
  prev: () => void;
  toggleDebug: () => void;

  setSelectedAnchorKey: (key: string | null) => void;

  updateAnchorBox: (screenIndex: number, anchorKey: string, box: Box2D) => void;
  getAnchorBox: (
    screenIndex: number,
    anchorKey: string,
    fallback: Box2D
  ) => Box2D;

  setActionMsg: (message: ActionMsg | null) => void;
  setShowController: (show: boolean) => void;
};

export const useSimStore = create<SimState>((set, get) => ({
  screens: [],
  currentIndex: 0,
  debug: false,
  overrides: {},
  selectedAnchorKey: null,
  actionMsg: null,
  showController: false,

  setScreens: (screens) => set({ screens, currentIndex: 0 }),
  setCurrentIndex: (i) => {
    const n = get().screens.length;
    const clamped = Math.max(0, Math.min(n - 1, i));
    set({ currentIndex: clamped, selectedAnchorKey: null });
  },
  next: () => {
    const { currentIndex, screens } = get();
    if (!screens.length) return;
    set({
      currentIndex: Math.min(screens.length - 1, currentIndex + 1),
      selectedAnchorKey: null,
    });
  },
  prev: () => {
    const { currentIndex } = get();
    set({
      currentIndex: Math.max(0, currentIndex - 1),
      selectedAnchorKey: null,
    });
  },
  toggleDebug: () => set((s) => ({ debug: !s.debug })),

  setSelectedAnchorKey: (key) => set({ selectedAnchorKey: key }),

  updateAnchorBox: (screenIndex, anchorKey, box) =>
    set((s) => ({
      overrides: {
        ...s.overrides,
        [screenIndex]: {
          ...(s.overrides[screenIndex] ?? {}),
          [anchorKey]: box,
        },
      },
    })),

  getAnchorBox: (screenIndex, anchorKey, fallback) => {
    const o = get().overrides[screenIndex]?.[anchorKey];
    return o ?? fallback;
  },

  setActionMsg: (msg) => set({ actionMsg: msg != null ? {title: msg.title, message: msg.message} : null}),
  setShowController: (show) => set({ showController: show})
}));
