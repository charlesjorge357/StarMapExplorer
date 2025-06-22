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
  planets: Planet[];
}

export class SystemGenerator {
  // Real planetary radii in Earth radii (authentic celestial data)
  static PLANET_RADII = {
    gas_giant: { min: 3.5, max: 11.2 }, // Saturn to Jupiter scale
    frost_giant: { min: 2.5, max: 4.0 }, // Neptune to Uranus scale
    arid_world: { min: 0.4, max: 1.2 }, // Mars to super-Earth
    verdant_world: { min: 0.8, max: 1.5 }, // Earth-like to super-Earth
    acidic_world: { min: 0.6, max: 1.1 }, // Venus-like
    nuclear_world: { min: 0.3, max: 0.8 }, // Small rocky worlds
    ocean_world: { min: 0.7, max: 1.3 }, // Earth-like water worlds
    dead_world: { min: 0.1, max: 0.6 }   // Mercury to small rocky
  };

  // Real orbital distances in AU (astronomical units)
  static ORBITAL_ZONES = {
    inner: { min: 0.3, max: 1.5 },    // Mercury to Mars
    habitable: { min: 0.8, max: 2.0 }, // Venus to asteroid belt
    outer: { min: 2.5, max: 12.0 }     // Jupiter to Neptune
  };

  static seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  static generatePlanetName(starName: string, index: number): string {
    const greekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
    if (index < greekLetters.length) {
      return `${starName} ${greekLetters[index]}`;
    }
    return `${starName} ${index + 1}`;
  }

  static determinePlanetType(orbitRadius: number, starTemp: number, seed: number): PlanetType {
    const random = this.seededRandom(seed);
    
    // Determine zone based on orbit and star temperature
    const effectiveTemp = starTemp / (orbitRadius * orbitRadius); // Simplified temperature calculation
    
    if (orbitRadius < 1.5) {
      // Inner system
      if (effectiveTemp > 800) return random < 0.3 ? 'dead_world' : 'arid_world';
      if (effectiveTemp > 400) return random < 0.4 ? 'arid_world' : 'acidic_world';
      return random < 0.6 ? 'verdant_world' : 'ocean_world';
    } else if (orbitRadius < 4.0) {
      // Middle system
      if (random < 0.3) return 'gas_giant';
      if (random < 0.6) return 'arid_world';
      return 'dead_world';
    } else {
      // Outer system
      if (random < 0.7) return 'gas_giant';
      return 'frost_giant';
    }
  }

  static generatePlanet(
    starName: string, 
    starTemp: number, 
    index: number, 
    orbitRadius: number, 
    seed: number
  ): Planet {
    const planetSeed = seed + index * 1000;
    const name = this.generatePlanetName(starName, index);
    const type = this.determinePlanetType(orbitRadius, starTemp, planetSeed);
    
    // Get radius range for planet type
    const radiusRange = this.PLANET_RADII[type];
    const radius = radiusRange.min + 
      this.seededRandom(planetSeed + 1) * (radiusRange.max - radiusRange.min);
    
    // Calculate orbital speed using Kepler's laws (simplified)
    const orbitSpeed = Math.sqrt(1 / orbitRadius) * 0.1; // Scaled for visual appeal
    
    // Generate realistic mass based on radius and type
    let mass = radius * radius * radius; // Base cubic relationship
    if (type === 'gas_giant' || type === 'frost_giant') {
      mass *= 0.3; // Gas giants less dense
    }
    
    // Calculate temperature based on distance and type
    const baseTemp = starTemp / (orbitRadius * orbitRadius * 16);
    let temperature = baseTemp;
    if (type === 'acidic_world') temperature *= 2; // Greenhouse effect
    if (type === 'gas_giant') temperature *= 0.7; // Upper atmosphere
    
    // Generate appropriate atmosphere
    let atmosphere: string[] = [];
    switch (type) {
      case 'gas_giant':
        atmosphere = ['Hydrogen', 'Helium', 'Methane'];
        break;
      case 'frost_giant':
        atmosphere = ['Hydrogen', 'Helium', 'Water', 'Ammonia'];
        break;
      case 'acidic_world':
        atmosphere = ['Carbon Dioxide', 'Sulfuric Acid', 'Nitrogen'];
        break;
      case 'verdant_world':
        atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor'];
        break;
      case 'ocean_world':
        atmosphere = ['Nitrogen', 'Oxygen', 'Water Vapor'];
        break;
      case 'arid_world':
        atmosphere = ['Carbon Dioxide', 'Nitrogen'];
        break;
      case 'nuclear_world':
        atmosphere = ['Radioactive Gases', 'Noble Gases'];
        break;
      case 'dead_world':
        atmosphere = [];
        break;
    }
    
    // Calculate orbital position
    const angle = this.seededRandom(planetSeed + 10) * Math.PI * 2;
    const position: [number, number, number] = [
      Math.cos(angle) * orbitRadius * 10, // Scale up for visibility
      this.seededRandom(planetSeed + 11) * 2 - 1, // Small vertical variation
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
      moons: [] // TODO: Generate moons
    };
  }

  static generateSystem(star: any, seed: number): StarSystem {
    const systemSeed = seed + parseInt(star.id.slice(-3), 36); // Use star ID for consistency
    
    // Determine number of planets based on star type and size
    let planetCount = Math.floor(this.seededRandom(systemSeed) * 8) + 2; // 2-9 planets
    if (star.spectralClass === 'M') planetCount = Math.min(planetCount, 5); // Red dwarfs have fewer
    if (star.spectralClass === 'O' || star.spectralClass === 'B') planetCount = Math.min(planetCount, 4); // Hot stars fewer
    
    const planets: Planet[] = [];
    
    for (let i = 0; i < planetCount; i++) {
      // Generate orbital distances using realistic spacing (Titius-Bode-like)
      let orbitRadius: number;
      if (i === 0) {
        orbitRadius = 0.3 + this.seededRandom(systemSeed + i) * 0.7; // Inner planet
      } else {
        // Each planet roughly 1.4-2x farther than previous
        const previousRadius = planets[i - 1].orbitRadius;
        const spacing = 1.4 + this.seededRandom(systemSeed + i + 100) * 0.6;
        orbitRadius = previousRadius * spacing;
      }
      
      const planet = this.generatePlanet(
        star.name,
        star.temperature || 5778, // Default to Sun temperature
        i,
        orbitRadius,
        systemSeed
      );
      
      planets.push(planet);
    }
    
    return {
      id: `system-${star.id}`,
      starId: star.id,
      planets
    };
  }

  static getPlanetColor(type: PlanetType): string {
    switch (type) {
      case 'gas_giant': return '#FFA500';      // Orange/brown
      case 'frost_giant': return '#4169E1';    // Blue
      case 'arid_world': return '#CD853F';     // Sandy brown
      case 'verdant_world': return '#228B22';  // Forest green
      case 'acidic_world': return '#FFFF00';   // Yellow
      case 'nuclear_world': return '#FF4500';  // Red-orange
      case 'ocean_world': return '#1E90FF';    // Deep sky blue
      case 'dead_world': return '#696969';     // Gray
      default: return '#808080';
    }
  }
}