import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Vector3 } from 'three';
import { useUniverse } from './useUniverse';

export type ViewType = 'galactic' | 'system' | 'planetary';

export interface CameraActions {
  homeToPlanet: ((center: Vector3, distance: number, planet: any, track: boolean) => void) | null;
  homeToSpaceFeature: ((feature: any, distance: number, track: boolean) => void) | null;
  homeToFeature: ((feature: any, distance: number) => void) | null;
  resetToStar: (() => void) | null;
  setCameraLookingAtStar: ((star: any) => void) | null;
}

interface GameViewState {
  // View navigation
  currentView: ViewType;
  currentSystem: any | null;
  frozenTime: number | null;
  lastVisitedStar: any | null;
  systemCache: Map<string, any>;
  controlsDisabled: boolean;

  // Selections
  selectedStar: any | null;
  selectedNebula: any | null;
  selectedPlanet: any | null;
  selectedFeature: any | null;
  selectedSpaceFeature: any | null;
  selectedFleet: any | null;
  selectedArmy: any | null;

  // Camera action registry — filled by CameraController on mount
  cameraActions: CameraActions;

  // UI panel state
  isSearching: boolean;
  isSearchingSpaceFeatures: boolean;
  isSearchingSurfaceFeatures: boolean;
  isViewingFleets: boolean;
  isViewingArmies: boolean;

  // Camera registration
  registerCameraActions: (actions: Partial<CameraActions>) => void;

  // Selections
  setSelectedStar: (star: any | null) => void;
  setSelectedNebula: (nebula: any | null) => void;
  setSelectedPlanet: (planet: any | null) => void;
  setSelectedFeature: (feature: any | null) => void;
  setSelectedSpaceFeature: (feature: any | null) => void;
  setSelectedFleet: (fleet: any | null) => void;
  setSelectedArmy: (army: any | null) => void;

  // Navigation — each action is atomic so consumers don't need to coordinate
  enterSystem: (star: any, system: any) => void;
  exitSystem: () => void;
  enterPlanetary: () => void;
  exitPlanetary: () => void;

  // System cache
  getCachedSystem: (starId: string) => any | undefined;
  setCachedSystem: (starId: string, system: any) => void;

  // UI toggles
  setIsSearching: (v: boolean) => void;
  setIsSearchingSpaceFeatures: (v: boolean) => void;
  setIsSearchingSurfaceFeatures: (v: boolean) => void;
  setIsViewingFleets: (v: boolean) => void;
  setIsViewingArmies: (v: boolean) => void;
  setControlsDisabled: (v: boolean) => void;
}

export const useGameView = create<GameViewState>()(
  subscribeWithSelector((set, get) => ({
    currentView: 'galactic',
    currentSystem: null,
    frozenTime: null,
    lastVisitedStar: null,
    systemCache: new Map(),
    controlsDisabled: false,

    selectedStar: null,
    selectedNebula: null,
    selectedPlanet: null,
    selectedFeature: null,
    selectedSpaceFeature: null,
    selectedFleet: null,
    selectedArmy: null,

    cameraActions: {
      homeToPlanet: null,
      homeToSpaceFeature: null,
      homeToFeature: null,
      resetToStar: null,
      setCameraLookingAtStar: null,
    },

    isSearching: false,
    isSearchingSpaceFeatures: false,
    isSearchingSurfaceFeatures: false,
    isViewingFleets: false,
    isViewingArmies: false,

    registerCameraActions: (actions) =>
      set((state) => ({ cameraActions: { ...state.cameraActions, ...actions } })),

    setSelectedStar: (star) => set({ selectedStar: star }),
    setSelectedNebula: (nebula) => set({ selectedNebula: nebula }),
    setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),
    setSelectedFeature: (feature) => set({ selectedFeature: feature }),
    setSelectedSpaceFeature: (feature) => set({ selectedSpaceFeature: feature }),
    setSelectedFleet: (fleet) => set({ selectedFleet: fleet }),
    setSelectedArmy: (army) => set({ selectedArmy: army }),

    enterSystem: (star, system) => {
      // Clear stale frozen time only when entering fresh from galactic view
      if (system.frozenTime && get().currentView === 'galactic') {
        delete system.frozenTime;
      }

      set({
        currentView: 'system',
        currentSystem: system,
        lastVisitedStar: star,
        frozenTime: null,
        selectedStar: null,
        selectedSpaceFeature: null,
      });

      get().setCachedSystem(star.id, system);

      setTimeout(() => get().cameraActions.resetToStar?.(), 100);
    },

    exitSystem: () => {
      const { currentSystem, lastVisitedStar, cameraActions } = get();

      if (currentSystem?.frozenTime) delete currentSystem.frozenTime;

      // Stop any active tracking
      cameraActions.homeToPlanet?.(new Vector3(0, 0, 0), 1, null, false);
      cameraActions.homeToSpaceFeature?.(null, 0, false);

      set({
        currentView: 'galactic',
        currentSystem: null,
        frozenTime: null,
        selectedPlanet: null,
        selectedSpaceFeature: null,
        selectedFleet: null,
      });

      setTimeout(() => {
        if (lastVisitedStar) {
          get().cameraActions.setCameraLookingAtStar?.(lastVisitedStar);
          set({ selectedStar: lastVisitedStar });
        }
      }, 100);
    },

    enterPlanetary: () => {
      const { currentSystem, cameraActions } = get();
      if (!currentSystem) return;

      const frozenTime = Date.now();

      // Snapshot fleet positions into the universe store before leaving system view
      const universeStore = useUniverse.getState();
      if (universeStore?.updateFleetPosition) {
        currentSystem.factions?.forEach((faction: any) => {
          faction.fleets?.forEach((fleet: any) => {
            const snap = [...fleet.position] as [number, number, number];
            universeStore.updateFleetPosition(currentSystem.id, fleet.id, snap);
          });
        });
      }

      cameraActions.homeToPlanet?.(new Vector3(0, 0, 0), 1, null, false);

      set({
        currentView: 'planetary',
        frozenTime,
        controlsDisabled: true,
        selectedSpaceFeature: null,
        selectedFleet: null,
      });
    },

    exitPlanetary: () => {
      const { currentSystem, cameraActions } = get();

      cameraActions.homeToSpaceFeature?.(null, 0, false);

      // Restore fleet positions from universe store BEFORE flipping the view.
      // CameraController's useEffect on currentView fires after this render,
      // so homeToPlanet will see the already-restored positions.
      let updatedSystem = currentSystem ? { ...currentSystem } : null;
      if (updatedSystem) {
        const universeStore = useUniverse.getState();
        const savedSystem = universeStore?.universeData?.systems?.find(
          (s: any) => s.id === currentSystem.id
        );
        if (savedSystem?.fleets) {
          const savedFleets = savedSystem.fleets;
          updatedSystem.factions?.forEach((faction: any) => {
            faction.fleets?.forEach((fleet: any) => {
              const saved = savedFleets.find((sf: any) => sf.id === fleet.id);
              if (saved?.position) {
                fleet.position = [...saved.position] as [number, number, number];
                fleet._justRestored = true;
                fleet._forceRecalc = Date.now();
              }
            });
          });
        }
      }

      set({
        currentView: 'system',
        frozenTime: null,
        controlsDisabled: false,
        currentSystem: updatedSystem,
        selectedFeature: null,
        selectedArmy: null,
        selectedSpaceFeature: null,
      });
    },

    getCachedSystem: (starId) => get().systemCache.get(starId),

    setCachedSystem: (starId, system) =>
      set((state) => ({ systemCache: new Map(state.systemCache).set(starId, system) })),

    setIsSearching: (v) => set({ isSearching: v }),
    setIsSearchingSpaceFeatures: (v) => set({ isSearchingSpaceFeatures: v }),
    setIsSearchingSurfaceFeatures: (v) => set({ isSearchingSurfaceFeatures: v }),
    setIsViewingFleets: (v) => set({ isViewingFleets: v }),
    setIsViewingArmies: (v) => set({ isViewingArmies: v }),
    setControlsDisabled: (v) => set({ controlsDisabled: v }),
  }))
);
