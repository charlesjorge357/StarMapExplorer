interface Planet {
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
  inclination?: number;
  textureIndex?: number;
  surfaceFeatures?: any[];
}

interface Moon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
}

type PlanetType = 
  | 'gas_giant' 
  | 'frost_giant' 
  | 'arid_world' 
  | 'verdant_world' 
  | 'acidic_world' 
  | 'nuclear_world' 
  | 'ocean_world' 
  | 'dead_world';

interface StarSystem {
  id: string;
  starId: string;
  star?: any;
  planets: Planet[];
}

export class SystemGenerator {
  static PLANET_RADII = {
    gas_giant: { min: 6.5, max: 11.2 },
    frost_giant: { min: 5.5, max: 10.0 },
    arid_world: { min: 0.4, max: 1.2 },
    verdant_world: { min: 0.8, max: 1.5 },
    acidic_world: { min: 0.6, max: 1.1 },
    nuclear_world: { min: 0.3, max: 0.8 },
    ocean_world: { min: 0.7, max: 1.3 },
    dead_world: { min: 0.1, max: 0.6 }
  };

  static ORBITAL_ZONES = {
    inner: { min: 0.3, max: 1.5 },
    habitable: { min: 0.8, max: 2.0 },
    outer: { min: 2.5, max: 12.0 }
  };

  static seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private static generateTextureIndex(planetType: PlanetType, planetIndex: number, starName: string): number {
    // Generate a consistent texture index based on planet properties
    // Include planet type in the seed to ensure variety between planets of the same type
    const typeHash = planetType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const nameHash = starName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = nameHash + planetIndex * 1000 + typeHash * 100;
    
    // Define texture count per planet type (based on available textures)
    const textureCountMap = {
      gas_giant: 1, // Jupiter only
      frost_giant: 2, // Neptune, Jupiter for variety
      arid_world: 2, // Mars, Venus surface
      verdant_world: 3, // Earth-like terrestrial textures
      acidic_world: 2, // Venus atmosphere, Venus surface
      nuclear_world: 2, // Ceres, Eris
      ocean_world: 1, // Ocean texture available
      dead_world: 3 // Moon, Mercury, Eris
    };
    
    const textureCount = textureCountMap[planetType] || 1;
    return Math.floor(this.seededRandom(seed) * textureCount);
  }

  static generatePlanetName(starName: string, index: number): string {
    const greekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
    return index < greekLetters.length ? `${starName} ${greekLetters[index]}` : `${starName} ${index + 1}`;
  }

  static determinePlanetType(orbitRadius: number, starTemp: number, seed: number): PlanetType {
    const random = this.seededRandom(seed);
    const effectiveTemp = starTemp / (orbitRadius * orbitRadius);

    if (orbitRadius < 1.5) {
      if (effectiveTemp > 800) return random < 0.3 ? 'dead_world' : 'arid_world';
      if (effectiveTemp > 400) return random < 0.4 ? 'arid_world' : 'acidic_world';
      return random < 0.6 ? 'verdant_world' : 'ocean_world';
    } else if (orbitRadius < 4.0) {
      if (random < 0.3) return 'gas_giant';
      if (random < 0.6) return 'arid_world';
      return 'dead_world';
    } else {
      return random < 0.7 ? 'gas_giant' : 'frost_giant';
    }
  }

  static generatePlanet(starName: string, starTemp: number, index: number, orbitRadius: number, seed: number): Planet {
    const planetSeed = seed + index * 1000;
    const name = this.generatePlanetName(starName, index);
    const type = this.determinePlanetType(orbitRadius, starTemp, planetSeed);

    const radiusRange = this.PLANET_RADII[type];
    const radius = radiusRange.min + this.seededRandom(planetSeed + 1) * (radiusRange.max - radiusRange.min);

    const orbitSpeed = Math.sqrt(1 / orbitRadius) * 0.15;
    let mass = Math.pow(radius, 3);
    if (type === 'gas_giant' || type === 'frost_giant') mass *= 0.3;

    const baseTemp = starTemp / (orbitRadius * orbitRadius * 16);
    let temperature = baseTemp;
    if (type === 'acidic_world') temperature *= 2;
    if (type === 'gas_giant') temperature *= 0.7;

    let atmosphere: string[] = [];
    switch (type) {
      case 'gas_giant': atmosphere = ['Hydrogen', 'Helium', 'Methane']; break;
      case 'frost_giant': atmosphere = ['Hydrogen', 'Helium', 'Water', 'Ammonia']; break;
      case 'acidic_world': atmosphere = ['Carbon Dioxide', 'Sulfuric Acid', 'Nitrogen']; break;
      case 'verdant_world': case 'ocean_world': atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor']; break;
      case 'arid_world': atmosphere = ['Carbon Dioxide', 'Nitrogen']; break;
      case 'nuclear_world': atmosphere = ['Radioactive Gases', 'Noble Gases']; break;
    }

    const angle = this.seededRandom(planetSeed + 10) * Math.PI * 2;
    const inclination = (this.seededRandom(planetSeed + 13) - 0.5) * 0.3;
    const position: [number, number, number] = [
      Math.cos(angle) * orbitRadius * 10,
      Math.sin(inclination) * orbitRadius * 2,
      Math.sin(angle) * orbitRadius * 10
    ];

    return {
      id: `planet-${starName}-${index}`,
      name,
      position,
      radius,
      mass,
      type,
      orbitRadius,
      orbitSpeed,
      rotationSpeed: this.seededRandom(planetSeed + 12) * 0.1,
      temperature,
      atmosphere,
      moons: [],
      inclination,
      textureIndex: this.generateTextureIndex(type, index, starName),
      surfaceFeatures: []
    };
  }

  static generateSystem(star: any, seed: number): StarSystem {
    const systemSeed = seed + parseInt(star.id.slice(-3), 36);
    let planetCount = Math.floor(this.seededRandom(systemSeed) * 8) + 2;
    if (star.spectralClass === 'M') planetCount = Math.min(planetCount, 5);
    if (['O', 'B'].includes(star.spectralClass)) planetCount = Math.min(planetCount, 4);

    const planets: Planet[] = [];

    for (let i = 0; i < planetCount; i++) {
      let orbitRadius: number;
      if (i === 0) {
        orbitRadius = 0.3 + this.seededRandom(systemSeed + i) * 0.7;
      } else {
        const previousRadius = planets[i - 1].orbitRadius;
        const spacing = 1.4 + this.seededRandom(systemSeed + i + 100) * 0.6;
        orbitRadius = previousRadius * spacing;
      }
      const planet = this.generatePlanet(star.name, star.temperature || 5778, i, orbitRadius, systemSeed);
      planets.push(planet);
    }

    return {
      id: `system-${star.id}`,
      starId: star.id,
      star,
      planets
    };
  }

  static getPlanetColor(type: PlanetType, seed: number): string {
    const variation = (this.seededRandom(seed + 2000) - 0.5) * 0.3;
    const baseColors: Record<PlanetType, [number, number, number]> = {
      gas_giant: [30, 80, 50],
      frost_giant: [220, 60, 60],
      arid_world: [30, 50, 45],
      verdant_world: [125, 70, 45],
      acidic_world: [55, 90, 60],
      nuclear_world: [10, 90, 50],
      ocean_world: [210, 80, 55],
      dead_world: [0, 0, 40]
    };
    let [h, s, l] = baseColors[type];
    h = (h + variation * 360 + 360) % 360;
    return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
  }

  static getStarColor(spectralClass: string): string {
    switch (spectralClass) {
      case 'O': return '#9BB0FF';
      case 'B': return '#AABFFF';
      case 'A': return '#CAD7FF';
      case 'F': return '#F8F7FF';
      case 'G': return '#FFFF00';
      case 'K': return '#FFCD9B';
      case 'M': return '#FF6D4D';
      default: return '#FFFF00';
    }
  }

  private generateAsteroidBelts(star: Star, planets: Planet[]): AsteroidBelt[] {
    const belts: AsteroidBelt[] = [];
    const rng = this.createSeededRandom(star.name + 'asteroids');
    
    // Only generate asteroid belts for certain stellar types and configurations
    const shouldHaveAsteroids = star.spectralClass.startsWith('G') || 
                               star.spectralClass.startsWith('F') || 
                               star.spectralClass.startsWith('K');
    
    if (!shouldHaveAsteroids || planets.length < 2) return belts;
    
    // Sort planets by orbital distance for gap detection
    const sortedPlanets = [...planets].sort((a, b) => a.orbitRadius - b.orbitRadius);
    
    // Look for gaps between planets large enough for asteroid belts
    for (let i = 0; i < sortedPlanets.length - 1; i++) {
      const innerPlanet = sortedPlanets[i];
      const outerPlanet = sortedPlanets[i + 1];
      
      const gap = outerPlanet.orbitRadius - innerPlanet.orbitRadius;
      const minGapForBelt = 30; // Minimum gap size for asteroid belt
      
      if (gap > minGapForBelt) {
        // Chance of asteroid belt based on gap size and stellar properties
        const beltProbability = Math.min(0.8, (gap / 100) * 0.6);
        
        if (rng() < beltProbability) {
          const beltInnerRadius = innerPlanet.orbitRadius + gap * 0.2;
          const beltOuterRadius = outerPlanet.orbitRadius - gap * 0.2;
          const beltWidth = beltOuterRadius - beltInnerRadius;
          
          // Density based on stellar mass and distance from star
          const baseDensity = star.mass * 0.3;
          const distanceFactor = 1 / Math.sqrt(beltInnerRadius / 50);
          const density = baseDensity * distanceFactor * (0.5 + rng() * 0.5);
          
          // Asteroid count based on belt size and density
          const asteroidCount = Math.floor(density * beltWidth * (200 + rng() * 300));
          
          belts.push({
            id: `belt-${star.id}-${i}`,
            name: `${star.name} Belt ${String.fromCharCode(65 + belts.length)}`,
            innerRadius: beltInnerRadius,
            outerRadius: beltOuterRadius,
            density: density,
            asteroidCount: Math.max(50, asteroidCount)
          });
        }
      }
    }
    
    // Sometimes add an outer asteroid belt beyond all planets
    if (rng() < 0.3 && sortedPlanets.length > 0) {
      const outermost = sortedPlanets[sortedPlanets.length - 1];
      const outerBeltStart = outermost.orbitRadius + 40 + rng() * 60;
      const outerBeltEnd = outerBeltStart + 20 + rng() * 40;
      
      belts.push({
        id: `belt-${star.id}-outer`,
        name: `${star.name} Outer Belt`,
        innerRadius: outerBeltStart,
        outerRadius: outerBeltEnd,
        density: star.mass * 0.15 * (0.3 + rng() * 0.4),
        asteroidCount: Math.floor(100 + rng() * 200)
      });
    }
    
    return belts;
  }
}