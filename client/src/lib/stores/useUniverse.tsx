import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ScopeType, ModeType, Star, StarSystem, Planet, UniverseData } from "../../../../shared/schema";
import { StarGenerator } from "../universe/StarGenerator";
import { SystemGenerator } from "../universe/SystemGenerator";
import { SaveSystem } from "../universe/SaveSystem";

interface UniverseState {
  // Core state
  mode: ModeType;
  currentScope: ScopeType;
  universeData: UniverseData | null;

  // Selection state
  selectedStar: Star | null;
  selectedSystem: StarSystem | null;
  selectedPlanet: Planet | null;

  // Navigation breadcrumb
  breadcrumb: Array<{ scope: ScopeType; name: string; id?: string }>;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  setMode: (mode: ModeType) => void;
  setScope: (scope: ScopeType) => void;
  selectStar: (star: Star) => void;
  selectPlanet: (planet: Planet) => void;
  jumpToScope: (scope: ScopeType, targetId?: string) => void;
  generateSandbox: (seed?: number) => void;
  loadLoreData: () => Promise<void>;
  saveUniverse: () => void;
  loadUniverse: (file: File) => Promise<void>;
  updateStar: (starId: string, updates: Partial<Star>) => void;
  updatePlanet: (planetId: string, updates: Partial<Planet>) => void;
  updateFleetPosition: (systemId: string, fleetId: string, position: [number, number, number]) => void;
  updateArmyPosition: (planetId: string, armyId: string, position: [number, number]) => void;
}

export const useUniverse = create<UniverseState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    mode: 'sandbox',
    currentScope: 'galactic',
    universeData: null,
    selectedStar: null,
    selectedSystem: null,
    selectedPlanet: null,
    breadcrumb: [{ scope: 'galactic', name: 'Galaxy' }],
    isLoading: false,
    error: null,

    initialize: () => {
      console.log("Initializing Rogue Stars");
      const state = get();
      // Always generate new sandbox to ensure fresh data
      state.generateSandbox();
    },

    setMode: (mode) => {
      set({ mode });
      if (mode === 'lore') {
        get().loadLoreData();
      } else {
        get().generateSandbox();
      }
    },

    setScope: (scope) => {
      set({ currentScope: scope });

      // Update breadcrumb
      const { selectedStar, selectedPlanet } = get();
      let newBreadcrumb = [{ scope: 'galactic' as ScopeType, name: 'Galaxy' }];

      if (scope === 'system' && selectedStar) {
        newBreadcrumb.push({ scope: 'system', name: selectedStar.name });
      } else if (scope === 'planetary' && selectedStar && selectedPlanet) {
        newBreadcrumb.push({ scope: 'system', name: selectedStar.name });
        newBreadcrumb.push({ scope: 'planetary', name: selectedPlanet.name });
      }

      set({ breadcrumb: newBreadcrumb });
    },

    selectStar: (star) => {
      set({ selectedStar: star });

      // Generate or get system data
      const { universeData } = get();
      if (universeData) {
        let system = universeData.systems.find((s: any) => s.starId === star.id);
        if (!system) {
          system = SystemGenerator.generateSystem(star, Math.floor(Math.random() * 1000000));
          universeData.systems.push(system);
        }
        set({ selectedSystem: system, universeData: { ...universeData } });
      }
    },

    selectPlanet: (planet) => {
      set({ selectedPlanet: planet });
    },

    jumpToScope: (scope, targetId) => {
      const { universeData, setScope, selectStar, selectPlanet } = get();

      if (scope === 'galactic') {
        set({ selectedStar: null, selectedSystem: null, selectedPlanet: null });
        setScope('galactic');
      } else if (scope === 'system' && targetId && universeData) {
        const star = universeData.stars.find(s => s.id === targetId);
        if (star) {
          selectStar(star);
          setScope('system');
        }
      } else if (scope === 'planetary' && targetId && universeData) {
        const { selectedSystem } = get();
        if (selectedSystem) {
          const planet = selectedSystem.planets.find(p => p.id === targetId);
          if (planet) {
            selectPlanet(planet);
            setScope('planetary');
          }
        }
      }
    },

    generateSandbox: (seed) => {
      // Generate a new random seed each time if no seed is provided
      const actualSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
      console.log("Generating sandbox universe with seed:", actualSeed);
      set({ isLoading: true, error: null });

      try {
        console.log(`About to generate stars with seed ${actualSeed} and count 4000`);
        const { stars, nebulas } = StarGenerator.generateStarsWithNebulas(actualSeed, 4000);
        console.log(`Actually generated ${stars.length} stars`);

        const universeData: UniverseData = {
          mode: 'sandbox',
          stars,
          systems: [],
          nebulas,
          metadata: {
            version: '1.0.0',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            seed: actualSeed
          }
        };

        set({ 
          universeData, 
          isLoading: false,
          selectedStar: null,
          selectedSystem: null,
          selectedPlanet: null
        });

        console.log(`Generated ${stars.length} stars`);
      } catch (error) {
        console.error("Error generating sandbox:", error);
        set({ error: "Failed to generate sandbox universe", isLoading: false });
      }
    },

    loadLoreData: async () => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch('/api/lore/universe');
        if (!response.ok) {
          throw new Error('Failed to load lore data');
        }

        const universeData: UniverseData = await response.json();
        set({ 
          universeData, 
          isLoading: false,
          selectedStar: null,
          selectedSystem: null,
          selectedPlanet: null
        });
      } catch (error) {
        console.error("Error loading lore data:", error);
        set({ error: "Failed to load lore data", isLoading: false });
      }
    },

    saveUniverse: () => {
      const { universeData } = get();
      if (universeData) {
        SaveSystem.downloadUniverse(universeData);
      }
    },

    loadUniverse: async (file) => {
      set({ isLoading: true, error: null });

      try {
        const universeData = await SaveSystem.loadUniverse(file);
        set({ 
          universeData, 
          mode: universeData.mode,
          isLoading: false,
          selectedStar: null,
          selectedSystem: null,
          selectedPlanet: null
        });
      } catch (error) {
        console.error("Error loading universe:", error);
        set({ error: "Failed to load universe file", isLoading: false });
      }
    },

    updateStar: (starId, updates) => {
      const { universeData } = get();
      if (universeData) {
        const starIndex = universeData.stars.findIndex(s => s.id === starId);
        if (starIndex >= 0) {
          universeData.stars[starIndex] = { ...universeData.stars[starIndex], ...updates };
          universeData.metadata.modified = new Date().toISOString();
          set({ universeData: { ...universeData } });
        }
      }
    },

    updatePlanet: (planetId, updates) => {
      const { universeData, selectedSystem } = get();
      if (universeData && selectedSystem) {
        const planetIndex = selectedSystem.planets.findIndex(p => p.id === planetId);
        if (planetIndex >= 0) {
          selectedSystem.planets[planetIndex] = { ...selectedSystem.planets[planetIndex], ...updates };
          universeData.metadata.modified = new Date().toISOString();
          set({ 
            universeData: { ...universeData },
            selectedSystem: { ...selectedSystem }
          });
        }
      }
    },

    updateFleetPosition: (systemId, fleetId, position) => {
      console.log(`💾 updateFleetPosition called with systemId: ${systemId}, fleetId: ${fleetId}`);
      const { universeData } = get();
      console.log(`💾 Universe data exists:`, !!universeData);
      console.log(`💾 Systems count:`, universeData?.systems?.length || 0);
      if (universeData) {
        const system = universeData.systems.find(s => s.id === systemId);
        console.log(`💾 System found for ID ${systemId}:`, !!system);
        if (system) {
          // Look for fleet in faction structure
          let fleetFound = false;
          if (system.factions) {
            for (const faction of system.factions) {
              if (faction.fleets) {
                const fleetIndex = faction.fleets.findIndex(f => f.id === fleetId);
                if (fleetIndex >= 0) {
                  faction.fleets[fleetIndex].position = position;
                  console.log(`💾 Updated fleet ${fleetId} position in faction ${faction.id}:`, position);
                  fleetFound = true;
                  break;
                }
              }
            }
          }
          
          // Also update system.fleets if it exists for backup storage
          if (!system.fleets) system.fleets = [];
          const systemFleetIndex = system.fleets.findIndex(f => f.id === fleetId);
          if (systemFleetIndex >= 0) {
            system.fleets[systemFleetIndex].position = position;
            console.log(`💾 Updated fleet ${fleetId} position in system.fleets:`, position);
            fleetFound = true;
          } else if (fleetFound) {
            // Add to system.fleets for backup reference (partial object for position tracking)
            system.fleets.push({ id: fleetId, position } as any);
            console.log(`💾 Added fleet ${fleetId} to system.fleets backup:`, position);
          }
          
          if (fleetFound) {
            universeData.metadata.modified = new Date().toISOString();
            // Create a deep copy to ensure Zustand detects the change
            set({ universeData: { 
              ...universeData,
              systems: [...universeData.systems] 
            } });
          } else {
            console.warn(`⚠️ Fleet ${fleetId} not found in system ${systemId}`);
          }
        }
      }
    },

    updateArmyPosition: (planetId, armyId, position) => {
      const { universeData } = get();
      if (universeData) {
        // Find planet and update army position
        for (const system of universeData.systems) {
          const planet = system.planets.find(p => p.id === planetId);
          const planetArmies = (planet as any)?.armies;
          if (planet && planetArmies) {
            const armyIndex = planetArmies.findIndex((a: any) => a.id === armyId);
            if (armyIndex >= 0) {
              planetArmies[armyIndex].position = position;
              universeData.metadata.modified = new Date().toISOString();
              // Create a deep copy to ensure Zustand detects the change
              set({ universeData: { 
                ...universeData,
                systems: [...universeData.systems] 
              } });
              console.log(`💾 Updated army ${armyId} position on planet ${planetId}:`, position);
              break;
            }
          }
        }
      }
    }
  }))
);