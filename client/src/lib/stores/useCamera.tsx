import { create } from "zustand";
import { Vector3 } from "three";

interface CameraState {
  position: Vector3;
  target: Vector3;
  isTransitioning: boolean;
  transitionDuration: number;
  transitionStartTime: number;
  fromPosition: Vector3;
  toPosition: Vector3;
  fromTarget: Vector3;
  toTarget: Vector3;

  // Actions
  setPosition: (position: Vector3) => void;
  setTarget: (target: Vector3) => void;
  startTransition: () => void;
  endTransition: () => void;
  transitionTo: (fromPos: Vector3, toPos: Vector3, fromTarget: Vector3, toTarget: Vector3, duration?: number) => void;
  getTransitionProgress: () => number;
  updateTransition: () => { position: Vector3; target: Vector3 };
}

export const useCamera = create<CameraState>((set, get) => ({
  position: new Vector3(0, 0, 10),
  target: new Vector3(0, 0, 0),
  isTransitioning: false,
  transitionDuration: 2000,
  transitionStartTime: 0,
  fromPosition: new Vector3(0, 0, 10),
  toPosition: new Vector3(0, 0, 10),
  fromTarget: new Vector3(0, 0, 0),
  toTarget: new Vector3(0, 0, 0),

  setPosition: (position) => set({ position }),
  setTarget: (target) => set({ target }),
  startTransition: () => set({ isTransitioning: true }),
  endTransition: () => set({ isTransitioning: false }),

  transitionTo: (fromPos, toPos, fromTarget, toTarget, duration = 2000) => {
    const startTime = Date.now();
    set({
      fromPosition: fromPos.clone(),
      toPosition: toPos.clone(),
      fromTarget: fromTarget.clone(),
      toTarget: toTarget.clone(),
      transitionDuration: duration,
      transitionStartTime: startTime,
      isTransitioning: true,
    });
  },

  getTransitionProgress: () => {
    const state = get();
    if (!state.isTransitioning) return 1;

    const elapsed = Date.now() - state.transitionStartTime;
    const progress = Math.min(elapsed / state.transitionDuration, 1);
    const eased = progress * progress * (3 - 2 * progress);

    if (progress >= 1) {
      set({ isTransitioning: false });
    }

    return eased;
  },

  updateTransition: () => {
    const state = get();
    const progress = state.getTransitionProgress();

    const newPosition = new Vector3().lerpVectors(state.fromPosition, state.toPosition, progress);
    const newTarget = new Vector3().lerpVectors(state.fromTarget, state.toTarget, progress);

    set({ position: newPosition, target: newTarget });

    return { position: newPosition, target: newTarget };
  }
}));

