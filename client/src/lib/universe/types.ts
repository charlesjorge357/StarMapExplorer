export type ScopeType = 'galactic' | 'system' | 'planetary';
export type ModeType = 'sandbox' | 'lore';

export interface Star {
  id: string;
  name: string;
  position: [number, number, number];
  spectralClass: string;
  mass: number;
  radius: number;
  temperature: number;
  luminosity: number;
  age: number;
  systemId?: string;
  planetCount: number;
}

export interface Planet {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  mass: number;
  type: PlanetType;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  temperature: number;
  atmosphere: string[];
  moons: Moon[];
  surfaceFeatures: SurfaceFeature[];
}

export interface Moon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export interface SurfaceFeature {
  id: string;
  type: 'city' | 'fort' | 'landmark';
  name: string;
  position: [number, number]; // latitude, longitude
  description?: string;
}

export type PlanetType = 
  | 'gas_giant' 
  | 'frost_giant' 
  | 'arid_world' 
  | 'verdant_world' 
  | 'acidic_world' 
  | 'nuclear_world' 
  | 'ocean_world' 
  | 'dead_world';

export interface StarSystem {
  id: string;
  starId: string;
  planets: Planet[];
  asteroidBelts: AsteroidBelt[];
}

export interface AsteroidBelt {
  id: string;
  name: string;
  innerRadius: number;
  outerRadius: number;
  density: number;
  asteroidCount: number;
}

export interface UniverseData {
  mode: ModeType;
  stars: Star[];
  systems: StarSystem[];
  metadata: {
    version: string;
    created: string;
    modified: string;
    seed?: number;
  };
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  scope: ScopeType;
}
