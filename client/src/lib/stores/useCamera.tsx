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
      isTransitioning: true 
    });
    
    // Auto-end transition after duration
    setTimeout(() => {
      set({ 
        isTransitioning: false,
        position: toPos.clone(),
        target: toTarget.clone()
      });
    }, duration);
  },

  getTransitionProgress: () => {
    const state = get();
    if (!state.isTransitioning) return 1;
    
    const elapsed = Date.now() - state.transitionStartTime;
    const progress = Math.min(elapsed / state.transitionDuration, 1);
    
    // Smooth easing function
    return progress * progress * (3 - 2 * progress);
  }
}));
