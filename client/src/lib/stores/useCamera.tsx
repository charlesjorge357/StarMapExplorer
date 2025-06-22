import { create } from "zustand";
import { Vector3 } from "three";

interface CameraState {
  position: Vector3;
  target: Vector3;
  isTransitioning: boolean;
  transitionDuration: number;
  
  // Actions
  setPosition: (position: Vector3) => void;
  setTarget: (target: Vector3) => void;
  startTransition: () => void;
  endTransition: () => void;
  transitionTo: (position: Vector3, target: Vector3, duration?: number) => void;
}

export const useCamera = create<CameraState>((set, get) => ({
  position: new Vector3(0, 0, 10),
  target: new Vector3(0, 0, 0),
  isTransitioning: false,
  transitionDuration: 2000,

  setPosition: (position) => set({ position }),
  
  setTarget: (target) => set({ target }),
  
  startTransition: () => set({ isTransitioning: true }),
  
  endTransition: () => set({ isTransitioning: false }),
  
  transitionTo: (position, target, duration = 2000) => {
    set({ 
      position, 
      target, 
      transitionDuration: duration,
      isTransitioning: true 
    });
    
    // Auto-end transition after duration
    setTimeout(() => {
      set({ isTransitioning: false });
    }, duration);
  }
}));
