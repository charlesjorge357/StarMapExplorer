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

interface AsteroidBelt {
  id: string;
  name: string;
  innerRadius: number;
  outerRadius: number;
  density: number;
  asteroidCount: number;
}

interface StarSystem {
  id: string;
  starId: string;
  star?: any;
  planets: Planet[];
  asteroidBelts: AsteroidBelt[];
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
    outer: { min: 2.5, max: 8.0 }
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
    const planets = [];

    // Legacy generation logic - identical to original App.tsx
    // Fewer planets for larger stars (they're more disruptive to planet formation)
    let maxPlanets = 8;
    if (star.radius > 2) maxPlanets = 4;
    if (star.radius > 5) maxPlanets = 2;

    const planetCount = Math.floor(Math.random() * maxPlanets) + 1;

    const planetTypes: PlanetType[] = [
      'gas_giant', 'frost_giant', 'arid_world', 'verdant_world',
      'acidic_world', 'nuclear_world', 'ocean_world', 'dead_world'
    ];

    // Pre-calculate orbital zones to prevent exponential growth
    const baseSpacing = 16 + star.radius * 8;
    const maxOrbitRadius = baseSpacing * 6; // Cap maximum orbit distance
    const orbitZones: number[] = [];
    
    for (let i = 0; i < planetCount; i++) {
      if (i === 0) {
        orbitZones.push(baseSpacing);
      } else {
        // Use additive spacing instead of multiplicative to prevent exponential growth
        const additiveSpacing = baseSpacing * (0.8 + Math.random() * 0.6); // 0.8x to 1.4x base spacing
        const newOrbit = orbitZones[i - 1] + additiveSpacing;
        orbitZones.push(Math.min(newOrbit, maxOrbitRadius)); // Cap at maximum distance
      }
    }

    for (let i = 0; i < planetCount; i++) {
      const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
      const orbitRadius = orbitZones[i];

      // Earth radii scaling (realistic)
      let radius: number;
      switch (type) {
        case 'gas_giant':
          radius = 8 + Math.random() * 4; // 8–12 R⊕
          break;
        case 'frost_giant':
          radius = 4 + Math.random() * 3; // 4–7 R⊕
          break;
        case 'verdant_world':
        case 'acidic_world':
        case 'ocean_world':
        case 'arid_world':
          radius = 0.8 + Math.random() * 1.5; // 0.8–2.3 R⊕
          break;
        case 'nuclear_world':
        case 'dead_world':
          radius = 0.3 + Math.random() * 0.7; // 0.3–1.0 R⊕
          break;
        default:
          radius = 1.0;
      }

      // Mass = radius³ × density factor (gas giants less dense)
      const densityFactor = type === 'gas_giant' || type === 'frost_giant' ? 0.3 : 1.0;
      const mass = Math.pow(radius, 3) * densityFactor;

      // Simplified temperature model
      const temperature = 200 + Math.random() * 600;

      // Generate atmosphere
      let atmosphere: string[] = [];
      switch (type) {
        case 'gas_giant':
          atmosphere = ['Hydrogen', 'Helium', 'Methane'];
          break;
        case 'frost_giant':
          atmosphere = ['Hydrogen', 'Helium', 'Water', 'Ammonia'];
          break;
        case 'verdant_world':
        case 'ocean_world':
          atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor'];
          break;
        case 'arid_world':
          atmosphere = ['Carbon Dioxide', 'Nitrogen'];
          break;
        case 'acidic_world':
          atmosphere = ['Carbon Dioxide', 'Sulfuric Acid', 'Nitrogen'];
          break;
        case 'nuclear_world':
          atmosphere = ['Radioactive Gases', 'Noble Gases'];
          break;
        case 'dead_world':
          atmosphere = [];
          break;
      }

      const angle = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * 0.3;
      const position: [number, number, number] = [
        Math.cos(angle) * orbitRadius * 10,
        Math.sin(inclination) * orbitRadius * 2,
        Math.sin(angle) * orbitRadius * 10
      ];

      planets.push({
        id: `planet-${star.id}-${i}`,
        name: `${star.name} ${String.fromCharCode(945 + i)}`,
        position,
        radius,
        mass,
        type,
        orbitRadius,
        orbitSpeed: 0.05 + Math.random() * 0.15,
        rotationSpeed: 0.01 + Math.random() * 0.05,
        temperature,
        atmosphere,
        moons: [],
        inclination,
        textureIndex: this.generateTextureIndex(type, i, star.name),
        surfaceFeatures: this.generateSurfaceFeatures(type, `planet-${star.id}-${i}`, this.hashString(star.name + i))
      });
    }

    // Generate asteroid belts in orbital gaps
    const asteroidBelts = this.generateAsteroidBelts(planets, star);
    console.log(`Generated ${asteroidBelts.length} asteroid belts for ${star.name}:`, asteroidBelts);

    return {
      id: `system-${star.id}`,
      starId: star.id,
      star,
      planets,
      asteroidBelts
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

  // Generate surface features for terrestrial planets
  private static generateSurfaceFeatures(planetType: string, planetId: string, baseSeed: number) {
    // Only terrestrial planets have surface features
    if (planetType === 'gas_giant' || planetType === 'frost_giant') {
      return [];
    }

    const features = [];
    const featureSeed = baseSeed + 1000;
    const seededRandom = () => this.seededRandom(featureSeed + features.length);
    
    // Number of features based on planet type
    let featureCount = 0;
    switch (planetType) {
      case 'verdant_world':
      case 'ocean_world':
        featureCount = 3 + Math.floor(seededRandom() * 4); // 3-6 features
        break;
      case 'arid_world':
      case 'acidic_world':
        featureCount = 1 + Math.floor(seededRandom() * 3); // 1-3 features
        break;
      case 'nuclear_world':
        featureCount = Math.floor(seededRandom() * 2); // 0-1 features
        break;
      case 'dead_world':
        featureCount = Math.floor(seededRandom() * 2); // 0-1 features
        break;
      default:
        featureCount = 1;
    }

    for (let i = 0; i < featureCount; i++) {
      const featureType = this.getRandomFeatureType(planetType, seededRandom);
      const lat = (seededRandom() - 0.5) * 180; // -90 to 90
      const lon = (seededRandom() - 0.5) * 360; // -180 to 180
      
      features.push({
        id: `${planetId}-feature-${i}`,
        type: featureType,
        name: this.generateFeatureName(featureType, i, seededRandom),
        position: [lat, lon] as [number, number],
        description: this.generateFeatureDescription(featureType, planetType),
        population: featureType === 'city' ? Math.floor(seededRandom() * 5000000) + 10000 : undefined,
        size: this.getRandomSize(seededRandom),
        technology: this.getRandomTechnology(planetType, seededRandom)
      });
    }

    return features;
  }

  private static getRandomFeatureType(planetType: string, random: () => number): 'city' | 'fort' | 'landmark' {
    const rand = random();
    
    switch (planetType) {
      case 'verdant_world':
      case 'ocean_world':
        if (rand < 0.5) return 'city';
        if (rand < 0.8) return 'landmark';
        return 'fort';
      case 'arid_world':
        if (rand < 0.3) return 'city';
        if (rand < 0.7) return 'fort';
        return 'landmark';
      default:
        if (rand < 0.2) return 'city';
        if (rand < 0.6) return 'fort';
        return 'landmark';
    }
  }

  private static generateFeatureName(type: 'city' | 'fort' | 'landmark', index: number, random: () => number): string {
    const cityNames = ['New Haven', 'Central City', 'Port Aurora', 'Meridian', 'Haven Point', 'Nova City'];
    const fortNames = ['Fort Alpha', 'Bastion Prime', 'Stronghold Beta', 'Citadel One', 'Outpost Gamma', 'Defense Station'];
    const landmarkNames = ['Crystal Peaks', 'The Great Canyon', 'Sunset Mesa', 'Ancient Ruins', 'Mystic Falls', 'Titan Ridge'];
    
    let names: string[];
    switch (type) {
      case 'city':
        names = cityNames;
        break;
      case 'fort':
        names = fortNames;
        break;
      case 'landmark':
        names = landmarkNames;
        break;
    }
    
    const nameIndex = Math.floor(random() * names.length);
    return names[nameIndex];
  }

  private static generateFeatureDescription(type: 'city' | 'fort' | 'landmark', planetType: string): string {
    switch (type) {
      case 'city':
        return planetType === 'verdant_world' ? 'A thriving metropolis with green spaces' :
               planetType === 'arid_world' ? 'A desert settlement with climate domes' :
               'A hardy colonial outpost';
      case 'fort':
        return planetType === 'arid_world' ? 'A fortified compound protecting trade routes' :
               'A defensive installation monitoring the region';
      case 'landmark':
        return planetType === 'verdant_world' ? 'A natural wonder of geological significance' :
               planetType === 'dead_world' ? 'Ancient ruins from a lost civilization' :
               'A notable geographical formation';
      default:
        return 'An interesting location';
    }
  }

  private static getRandomSize(random: () => number): 'small' | 'medium' | 'large' {
    const rand = random();
    if (rand < 0.5) return 'small';
    if (rand < 0.8) return 'medium';
    return 'large';
  }

  private static getRandomTechnology(planetType: string, random: () => number): 'primitive' | 'industrial' | 'advanced' {
    const rand = random();
    
    switch (planetType) {
      case 'verdant_world':
      case 'ocean_world':
        if (rand < 0.2) return 'primitive';
        if (rand < 0.6) return 'industrial';
        return 'advanced';
      case 'arid_world':
        if (rand < 0.4) return 'primitive';
        if (rand < 0.8) return 'industrial';
        return 'advanced';
      default:
        if (rand < 0.6) return 'primitive';
        if (rand < 0.9) return 'industrial';
        return 'advanced';
    }
  }

  static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  static generateAsteroidBelts(planets: Planet[], star: any): AsteroidBelt[] {
    const belts: AsteroidBelt[] = [];
    const beltCount = Math.floor(Math.random() * 4) + 1; // 1-4 belts
    console.log(`Attempting to generate ${beltCount} belts for ${star.name} with ${planets.length} planets`);

    // Find potential belt locations in orbital gaps
    const potentialBelts = [];
    
    // Belt before first planet
    if (planets.length > 0) {
      const firstPlanet = planets[0];
      const innerRadius = firstPlanet.orbitRadius * 0.5;
      const outerRadius = firstPlanet.orbitRadius * 0.8;
      if (innerRadius > 8) { // Only if there's enough space
        console.log(`Inner belt possible: ${innerRadius.toFixed(1)} - ${outerRadius.toFixed(1)}`);
        potentialBelts.push({ innerRadius, outerRadius, position: 'inner' });
      } else {
        console.log(`Inner belt too close: ${innerRadius.toFixed(1)} < 8`);
      }
    }

    // Belts between planets
    for (let i = 0; i < planets.length - 1; i++) {
      const currentPlanet = planets[i];
      const nextPlanet = planets[i + 1];
      const gap = nextPlanet.orbitRadius - currentPlanet.orbitRadius;
      
      if (gap > 20) { // Large enough gap for asteroid belt
        const innerRadius = currentPlanet.orbitRadius + gap * 0.3;
        const outerRadius = currentPlanet.orbitRadius + gap * 0.7;
        console.log(`Gap ${i}: ${gap.toFixed(1)} units between ${currentPlanet.name} and ${nextPlanet.name}`);
        potentialBelts.push({ innerRadius, outerRadius, position: `gap-${i}` });
      } else {
        console.log(`Gap ${i}: ${gap.toFixed(1)} units too small for belt between ${currentPlanet.name} and ${nextPlanet.name}`);
      }
    }

    // Belt after last planet
    if (planets.length > 0) {
      const lastPlanet = planets[planets.length - 1];
      const innerRadius = lastPlanet.orbitRadius * 1.5;
      const outerRadius = lastPlanet.orbitRadius * 1.8;
      console.log(`Outer belt: ${innerRadius.toFixed(1)} - ${outerRadius.toFixed(1)}`);
      potentialBelts.push({ innerRadius, outerRadius, position: 'outer' });
    }

    console.log(`Found ${potentialBelts.length} potential belt locations:`, potentialBelts);
    
    // Select random belts from potential locations
    const selectedBelts = potentialBelts
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(beltCount, potentialBelts.length));
    
    console.log(`Selected ${selectedBelts.length} belts to generate`);

    selectedBelts.forEach((belt, index) => {
      const density = 0.3 + Math.random() * 0.7; // 0.3-1.0 density
      const asteroidCount = Math.floor(density * 500 + Math.random() * 1000); // 150-1500 asteroids
      
      belts.push({
        id: `belt-${star.id}-${index}`,
        name: `${star.name} Asteroid Belt ${String.fromCharCode(65 + index)}`, // A, B, C, D
        innerRadius: belt.innerRadius,
        outerRadius: belt.outerRadius,
        density,
        asteroidCount
      });
    });

    return belts;
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
}