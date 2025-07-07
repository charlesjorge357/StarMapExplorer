import { PlanetGenerator } from './PlanetGenerator';
import { SurfaceFeature, Planet, Moon, PlanetRing, PlanetType } from '../../../../shared/schema';
import { SurfaceFeatureMarker } from 'client/src/components/ui/SurfaceFeatures'
import React, { useRef, useMemo } from 'react';

// Using imported Planet, Moon, PlanetRing, PlanetType interfaces from shared schema

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
    arid_world: { min: 0.7, max: 2.5 },
    barren_world: { min: 0.3, max: 0.8 },
    dusty_world: { min: 0.7, max: 2.5 },
    grassland_world: { min: 0.7, max: 2.5 },
    jungle_world: { min: 0.7, max: 2.5 },
    marshy_world: { min: 0.7, max: 2.5 },
    martian_world: { min: 0.45, max: 0.6 }, // Mars-like: 0.45-0.6 Earth radii (Mars is 0.53)
    methane_world: { min: 0.4, max: 2.2 }, // Titan-like to super-Earth: 0.4-2.2 Earth radii (Titan is 0.4)
    sandy_world: { min: 0.7, max: 2.5 },
    snowy_world: { min: 0.7, max: 2.5 },
    tundra_world: { min: 0.7, max: 2.5 },
    nuclear_world: { min: 0.3, max: 0.8 },
    ocean_world: { min: 0.7, max: 1.3 }
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
    
    // Use a more complex seed that includes planet position and type for better distribution
    const seed = nameHash * 7919 + planetIndex * 2003 + typeHash * 701;
    
    // Define texture count per planet type (based on available textures)
    const textureCountMap = {
      gas_giant: 20, // Gaseous textures (20 available)
      frost_giant: 20, // Gaseous textures (20 available)
      arid_world: 5, // Arid textures
      barren_world: 5, // Barren textures
      dusty_world: 5, // Dusty textures
      grassland_world: 5, // Grassland textures
      jungle_world: 5, // Jungle textures
      marshy_world: 5, // Marshy textures
      martian_world: 5, // Martian textures
      methane_world: 5, // Methane textures
      sandy_world: 5, // Sandy textures
      snowy_world: 5, // Snowy textures
      tundra_world: 5, // Tundra textures
      nuclear_world: 2, // Keep existing nuclear world textures
      ocean_world: 1 // Keep existing ocean texture
    };
    
    const textureCount = textureCountMap[planetType] || 1;
    const textureIndex = Math.floor(this.seededRandom(seed) * textureCount);
    
    // Debug logging for texture selection
    console.log(`Texture selection for ${planetType} planet ${planetIndex} in ${starName}: index ${textureIndex} of ${textureCount}`);
    
    return textureIndex;
  }

  static generatePlanetName(starName: string, index: number): string {
    const greekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
    return index < greekLetters.length ? `${starName} ${greekLetters[index]}` : `${starName} ${index + 1}`;
  }

  static calculateRealisticAU(planetIndex: number): number {
    // Realistic AU progression based on our solar system pattern
    // Mercury=0.39, Venus=0.72, Earth=1.0, Mars=1.52, Jupiter=5.2, Saturn=9.5, Uranus=19.2, Neptune=30.1
    const baseDistances = [0.39, 0.72, 1.0, 1.52, 3.2, 5.2, 9.5, 19.2, 30.1];
    
    if (planetIndex < baseDistances.length) {
      return baseDistances[planetIndex];
    } else {
      // For planets beyond Neptune, use exponential progression
      const lastDistance = baseDistances[baseDistances.length - 1];
      const additionalIndex = planetIndex - baseDistances.length + 1;
      return lastDistance * Math.pow(1.6, additionalIndex); // Exponential growth
    }
  }

  static determinePlanetType(orbitRadius: number, starTemp: number, seed: number, planetIndex: number = 0): PlanetType {
    // Create unique random seed for each planet by combining with timestamp and orbit position
    const sessionSeed = Date.now();
    const orbitSeed = Math.floor(orbitRadius * 1000); // Orbital position factor
    const dynamicSeed = seed + sessionSeed + orbitSeed;
    
    // Use realistic AU progression based on planet index, independent of visual distances
    const auScaledRadius = this.calculateRealisticAU(planetIndex);
    
    // Calculate zone scaling factor based on stellar class deviation from G-class
    // G-class (Sun-like, ~5778K) = 1.0x scaling (baseline)
    // Hotter stars (A, B, O) = zones pushed outward (>1.0x)
    // Cooler stars (K, M) = zones pulled inward (<1.0x)
    const tempFactor = starTemp / 5778; // Solar temperature baseline
    const zoneScaling = Math.sqrt(tempFactor); // Square root for realistic luminosity scaling
    
    // 8 orbital zones with stellar-class scaled boundaries
    const zones = {
      scorched: 0.3 * zoneScaling,    // Zone 1: Ultra-hot (closer than Mercury)
      hot: 0.7 * zoneScaling,         // Zone 2: Hot (Mercury-Venus range)
      warm: 1.2 * zoneScaling,        // Zone 3: Warm (Venus-Earth range)
      habitable: 2.0 * zoneScaling,   // Zone 4: Habitable (Earth-Mars range)
      temperate: 3.5 * zoneScaling,   // Zone 5: Temperate (Mars-Asteroid belt)
      cool: 6.0 * zoneScaling,        // Zone 6: Cool (Jupiter region)
      cold: 12.0 * zoneScaling,       // Zone 7: Cold (Saturn-Uranus range)
      frozen: 25.0 * zoneScaling      // Zone 8: Frozen (Neptune+ range)
    };
    
    // Calculate effective temperature at planet's orbit, accounting for stellar luminosity
    // Hotter stars emit more energy, so planets at same distance are hotter
    const luminosityFactor = Math.pow(tempFactor, 4); // Stefan-Boltzmann law: L ∝ T^4
    const effectiveTemp = 1.5 * starTemp * luminosityFactor / (auScaledRadius * auScaledRadius);
    
    console.log(`Planet ${planetIndex} at visual orbit ${orbitRadius.toFixed(1)} using realistic ${auScaledRadius.toFixed(2)} AU: effectiveTemp=${effectiveTemp.toFixed(0)}K, starTemp=${starTemp}K, zoneScaling=${zoneScaling.toFixed(2)}x`);

    // Zone 1: Scorched (0-0.3 AU) - Extreme heat
    if (auScaledRadius < zones.scorched) {
      const rand = this.seededRandom(dynamicSeed) * 3;
      if (rand < 1) return 'barren_world';
      if (rand < 2) return 'dusty_world';
      return 'nuclear_world'; // Tidally locked, extreme radiation
    }
    // Zone 2: Hot (0.3-0.7 AU) - Very hot, Mercury-like
    else if (auScaledRadius < zones.hot) {
      const rand = this.seededRandom(dynamicSeed + 100) * 4;
      if (rand < 1) return 'barren_world';
      if (rand < 2) return 'dusty_world';
      if (rand < 3) return 'arid_world';
      return 'martian_world';
    }
    // Zone 3: Warm (0.7-1.2 AU) - Hot but potentially habitable
    else if (auScaledRadius < zones.warm) {
      if (effectiveTemp > 600) {
        const rand = this.seededRandom(dynamicSeed + 200) * 3;
        if (rand < 1) return 'arid_world';
        if (rand < 2) return 'sandy_world';
        return 'dusty_world';
      }
      const rand = this.seededRandom(dynamicSeed + 250) * 4;
      if (rand < 1) return 'grassland_world';
      if (rand < 2) return 'arid_world';
      if (rand < 3) return 'sandy_world';
      return 'jungle_world';
    }
    // Zone 4: Habitable (1.2-2.0 AU) - Earth-like conditions
    else if (auScaledRadius < zones.habitable) {
      const rand = this.seededRandom(dynamicSeed + 300) * 5;
      if (rand < 1) return 'grassland_world';
      if (rand < 2) return 'jungle_world';
      if (rand < 3) return 'ocean_world';
      if (rand < 4) return 'marshy_world';
      return 'arid_world';
    }
    // Zone 5: Temperate (2.0-3.5 AU) - Mars-like, NO gas giants (too close to star)
    else if (auScaledRadius < zones.temperate) {
      const rand = this.seededRandom(dynamicSeed + 450) * 5;
      if (rand < 1) return 'martian_world';
      if (rand < 2) return 'tundra_world';
      if (rand < 3) return 'arid_world';
      if (rand < 4) return 'barren_world';
      return 'snowy_world';
    }
    // Zone 6: Cool (3.5-6.0 AU) - Gas giants and cold terrestrials
    else if (auScaledRadius < zones.cool) {
      if (this.seededRandom(dynamicSeed + 500) < 0.5) return 'gas_giant';
      const rand = this.seededRandom(dynamicSeed + 550) * 4;
      if (rand < 1) return 'tundra_world';
      if (rand < 2) return 'snowy_world';
      if (rand < 3) return 'barren_world';
      return 'martian_world';
    }
    // Zone 7: Cold (6.0-12.0 AU) - Gas/frost giants, frozen worlds
    else if (auScaledRadius < zones.cold) {
      if (this.seededRandom(dynamicSeed + 600) < 0.4) return 'gas_giant';
      if (this.seededRandom(dynamicSeed + 650) < 0.6) return 'frost_giant';
      const rand = this.seededRandom(dynamicSeed + 700) * 3;
      if (rand < 1) return 'snowy_world';
      if (rand < 2) return 'tundra_world';
      return 'methane_world';
    }
    // Zone 8: Frozen (12.0+ AU) - Outer system, mostly giants and ice worlds
    else {
      if (this.seededRandom(dynamicSeed + 800) < 0.3) return 'gas_giant';
      if (this.seededRandom(dynamicSeed + 850) < 0.7) return 'frost_giant';
      const rand = this.seededRandom(dynamicSeed + 900) * 3;
      if (rand < 1) return 'snowy_world';
      if (rand < 2) return 'methane_world';
      return 'tundra_world';
    }
  }

  static generatePlanet(starName: string, starTemp: number, index: number, orbitRadius: number, seed: number): Planet {
    const planetSeed = seed + index * 1000;
    const name = this.generatePlanetName(starName, index);
    const type = this.determinePlanetType(orbitRadius, starTemp, planetSeed, index);

    const radiusRange = this.PLANET_RADII[type];
    
    // For habitable worlds, bias toward smaller sizes using power distribution
    const habitableTypes = ['arid_world', 'dusty_world', 'grassland_world', 'jungle_world', 'marshy_world', 'sandy_world', 'snowy_world', 'tundra_world'];
    let radius: number;
    
    if (habitableTypes.includes(type)) {
      // Use power of 2 to bias toward lower end (0.7-2.5 range)
      const biasedRandom = Math.pow(this.seededRandom(planetSeed + 1), 2);
      radius = radiusRange.min + biasedRandom * (radiusRange.max - radiusRange.min);
    } else {
      // Normal distribution for non-habitable worlds
      radius = radiusRange.min + this.seededRandom(planetSeed + 1) * (radiusRange.max - radiusRange.min);
    }

    const orbitSpeed = Math.sqrt(1 / orbitRadius) * 0.15;
    
    // Calculate realistic mass based on planet type and composition
    // Using Earth as baseline (mass = 1, radius = 1, density = 1)
    let densityFactor: number;
    switch (type) {
      case 'gas_giant':
        densityFactor = 0.25; // Very low density (Jupiter = 0.24 Earth density)
        break;
      case 'frost_giant':
        densityFactor = 0.3; // Low density (Neptune = 0.3 Earth density)
        break;
      case 'nuclear_world':
        densityFactor = 1.8; // Very dense due to heavy elements
        break;
      case 'barren_world':
      case 'dusty_world':
      case 'martian_world':
        densityFactor = 0.7; // Lower density like Mars (0.71 Earth density)
        break;
      case 'methane_world':
      case 'snowy_world':
      case 'tundra_world':
        densityFactor = 0.6; // Lower density due to ice content
        break;
      case 'ocean_world':
        densityFactor = 0.9; // Slightly lower due to water content
        break;
      case 'grassland_world':
      case 'jungle_world':
      case 'marshy_world':
        densityFactor = 1.0; // Earth-like density
        break;
      case 'arid_world':
      case 'sandy_world':
        densityFactor = 0.8; // Slightly lower density due to composition
        break;
      default:
        densityFactor = 1.0; // Default Earth-like
    }
    
    // Mass = Volume × Density = radius³ × density factor
    const mass = Math.pow(radius, 3) * densityFactor;

    const baseTemp = starTemp / (orbitRadius * orbitRadius * 16);
    let temperature = baseTemp;
    if (type === 'gas_giant') temperature *= 0.7;
    if (type === 'dusty_world') temperature *= 1.5; // Dust traps heat
    if (type === 'methane_world') temperature *= 0.8; // Methane atmosphere cooling

    let atmosphere: string[] = [];
    switch (type) {
      case 'gas_giant': atmosphere = ['Hydrogen', 'Helium', 'Methane']; break;
      case 'frost_giant': atmosphere = ['Hydrogen', 'Helium', 'Water', 'Ammonia']; break;
      case 'arid_world': atmosphere = ['Carbon Dioxide', 'Nitrogen']; break;
      case 'barren_world': atmosphere = []; break;
      case 'dusty_world': atmosphere = ['Carbon Dioxide', 'Dust Particles']; break;
      case 'grassland_world': case 'jungle_world': case 'ocean_world': atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor']; break;
      case 'marshy_world': atmosphere = ['Nitrogen', 'Oxygen', 'Methane', 'Water Vapor']; break;
      case 'martian_world': atmosphere = ['Carbon Dioxide', 'Nitrogen', 'Iron Oxide']; break;
      case 'methane_world': atmosphere = ['Methane', 'Nitrogen', 'Ethane']; break;
      case 'sandy_world': atmosphere = ['Carbon Dioxide', 'Silicon Particles']; break;
      case 'snowy_world': case 'tundra_world': atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor']; break;
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
      rings: this.generatePlanetRings(type, radius, name, planetSeed + 1000),
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
      'gas_giant', 'frost_giant', 'arid_world', 'barren_world',
      'dusty_world', 'grassland_world', 'jungle_world', 'marshy_world',
      'martian_world', 'methane_world', 'sandy_world', 'snowy_world',
      'tundra_world', 'nuclear_world', 'ocean_world'
    ];

    // Calculate orbital zones with proper spacing to prevent overlaps (for 3D visuals)
    const baseSpacing = 20 + star.radius * 6; // Increased base spacing for visual separation
    let maxOrbitRadius = baseSpacing * 8; // Increased max orbit
    const orbitZones: number[] = [];

    for (let i = 0; i < planetCount; i++) {
      if (i === 0) {
        // First planet starts at base spacing from star
        orbitZones.push(baseSpacing);
      } else {
        const prevOrbit = orbitZones[i - 1];
        
        // Use conservative spacing that accounts for largest possible planets
        const minSpacingBetweenOrbits = 25 + (i * 5); // Progressive spacing
        const randomVariation = Math.random() * 15 + 10; // 10-25 additional spacing
        
        let newOrbit = prevOrbit + minSpacingBetweenOrbits + randomVariation;
        if (newOrbit > maxOrbitRadius && i < planetCount - 1) {
          maxOrbitRadius = newOrbit + 20;
        }
        orbitZones.push(newOrbit);
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
          radius = 4 + Math.random() * 4; // 4–8 R⊕
          break;
        case 'grassland_world':
        case 'jungle_world':
        case 'ocean_world':
        case 'arid_world':
        case 'marshy_world':
          radius = 0.8 + Math.random() * 1.5; // 0.8–2.3 R⊕
          break;
        case 'nuclear_world':
        case 'barren_world':
        case 'dusty_world':
        case 'martian_world':
        case 'methane_world':
        case 'sandy_world':
        case 'snowy_world':
        case 'tundra_world':
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
        case 'grassland_world':
        case 'jungle_world':
        case 'ocean_world':
          atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor'];
          break;
        case 'arid_world':
          atmosphere = ['Carbon Dioxide', 'Nitrogen'];
          break;
        case 'barren_world':
          atmosphere = [];
          break;
        case 'dusty_world':
          atmosphere = ['Carbon Dioxide', 'Dust Particles'];
          break;
        case 'marshy_world':
          atmosphere = ['Nitrogen', 'Oxygen', 'Methane', 'Water Vapor'];
          break;
        case 'martian_world':
          atmosphere = ['Carbon Dioxide', 'Nitrogen', 'Iron Oxide'];
          break;
        case 'methane_world':
          atmosphere = ['Methane', 'Nitrogen', 'Ethane'];
          break;
        case 'sandy_world':
          atmosphere = ['Carbon Dioxide', 'Silicon Particles'];
          break;
        case 'snowy_world':
        case 'tundra_world':
          atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor'];
          break;
        case 'nuclear_world':
          atmosphere = ['Helium-3', 'Argon', 'Tritium'];
          break;
      }

      const angle = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * 0.3;
      const position: [number, number, number] = [
        Math.cos(angle) * orbitRadius * 10,
        Math.sin(inclination) * orbitRadius * 2,
        Math.sin(angle) * orbitRadius * 10
      ];

      const planet: Planet = {
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
        moons: this.generateMoons(radius, `${star.name} ${String.fromCharCode(945 + i)}`, i * 1000 + this.hashString(star.name)),
        rings: this.generatePlanetRings(type, radius, `${star.name} ${String.fromCharCode(945 + i)}`, i * 2000 + this.hashString(star.name)),
        textureIndex: this.generateTextureIndex(type, i, star.name),
        surfaceFeatures: []
      };

      // Generate surface features using PlanetGenerator
      planet.surfaceFeatures = PlanetGenerator.generateSurfaceFeatures(planet as any);
      
      planets.push(planet);
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
    
    // Only apply colors to specific planet types
    const coloredTypes = ['gas_giant', 'frost_giant', 'nuclear_world', 'ocean_world'];
    if (!coloredTypes.includes(type)) {
      return '#ffffff'; // White for all other planet types
    }
    
    const baseColors: Record<string, [number, number, number]> = {
      gas_giant: [30, 70, 65],        // Increased lightness from 50 to 65
      frost_giant: [220, 50, 75],     // Increased lightness from 60 to 75, reduced saturation
      nuclear_world: [10, 90, 50],
      ocean_world: [210, 80, 55]
    };
    let [h, s, l] = baseColors[type];
    
    // Special handling for frost giants to keep them in blue/cyan range
    if (type === 'frost_giant') {
      // Limit hue variation to stay in blue/cyan range (180-240 degrees)
      const limitedVariation = variation * 0.2; // Reduce variation strength
      h = Math.max(180, Math.min(240, h + limitedVariation * 60)); // Keep in blue range
    } else {
      h = (h + variation * 360 + 360) % 360;
    }
    
    return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
  }



  // Generate moons for planets
  private static generateMoons(planetRadius: number, planetName: string, seed: number) {
    const moons = [];
    let moonCount = 0;
    
    // Determine moon count based on planet size
    if (planetRadius > 6) moonCount = Math.floor(this.seededRandom(seed) * 8) + 2; // 2-9 moons for gas giants
    else if (planetRadius > 3) moonCount = Math.floor(this.seededRandom(seed + 1) * 4) + 1; // 1-4 moons for large planets
    else if (planetRadius > 1.5) moonCount = Math.floor(this.seededRandom(seed + 2) * 2); // 0-1 moons for medium planets

    for (let j = 0; j < moonCount; j++) {
      const moonName = `${planetName} ${String.fromCharCode(97 + j)}`; // a, b, c, etc.
      moons.push({
        id: `${planetName}-moon-${j}`,
        name: moonName,
        radius: 0.1 + this.seededRandom(seed + j + 10) * 0.4, // Small moons
        orbitRadius: 1.5 + j * 0.8, // Much tighter orbits
        orbitSpeed: 0.3 + this.seededRandom(seed + j + 20) * 0.35 // Moon speed relative to planet timing
      });
    }
    
    return moons;
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

  static generatePlanetRings(type: PlanetType, radius: number, planetName: string, seed: number): PlanetRing[] {
    const rings: PlanetRing[] = [];
    const random = this.seededRandom(seed);
    
    // Determine ring probability based on planet type and size
    let ringChance = 0;
    if (type === 'gas_giant' || type === 'frost_giant') {
      ringChance = 0.4; // 40% chance
    } else if (radius > 1.0) { // Terrestrial planets larger than Earth
      ringChance = 0.3; // 30% chance
    }
    
    console.log(`Ring generation for ${planetName} (${type}, radius: ${radius}): chance=${ringChance}, random=${random}, hasRings=${random <= ringChance}`);
    
    // Check if planet gets rings
    if (random > ringChance) {
      return rings; // No rings
    }
    
    // Generate ring systems based on planet type
    let maxRings = 3; // Gas/frost giants can have up to 3 rings
    if (type !== 'gas_giant' && type !== 'frost_giant') {
      maxRings = 2; // Terrestrial planets limited to 2 rings max
    }
    const numRingSystems = Math.floor(this.seededRandom(seed + 100) * maxRings) + 1;
    
    for (let i = 0; i < numRingSystems; i++) {
      const systemSeed = seed + i * 200;
      
      // Ring distances from planet (in planet radii)
      const baseDistance = 2.0 + i * 1.5; // Start at 2 planet radii, space out subsequent rings
      const innerRadius = baseDistance + this.seededRandom(systemSeed + 1) * 0.5;
      const ringWidth = 0.3 + this.seededRandom(systemSeed + 2) * 0.7; // 0.3-1.0 planet radii wide
      const outerRadius = innerRadius + ringWidth;
      
      // Ring properties based on planet type
      let composition: "ice" | "rock" | "dust" | "mixed";
      let color: string;
      let density = 0.3 + this.seededRandom(systemSeed + 3) * 0.6; // 0.3-0.9
      
      if (type === 'gas_giant') {
        composition = this.seededRandom(systemSeed + 4) > 0.5 ? "ice" : "rock";
        color = composition === "ice" ? "#E6F3FF" : "#8B7355";
      } else if (type === 'frost_giant') {
        composition = "ice";
        color = "#B8E6FF";
        density *= 1.2; // Frost giants have denser ice rings
      } else {
        // Terrestrial planets
        composition = this.seededRandom(systemSeed + 5) > 0.7 ? "rock" : "dust";
        color = composition === "rock" ? "#A0A0A0" : "#D2B48C";
        density *= 0.7; // Terrestrial rings are typically less dense
      }
      
      rings.push({
        id: `ring-${planetName.replace(/\s+/g, '-')}-${i}`,
        name: `${planetName} Ring ${String.fromCharCode(65 + i)}`, // A, B, C
        innerRadius,
        outerRadius,
        thickness: 0.02 + this.seededRandom(systemSeed + 6) * 0.08, // 0.02-0.1 thickness
        density,
        color,
        composition
      });
    }
    
    console.log(`Generated ${rings.length} rings for ${planetName}:`, rings);
    return rings;
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