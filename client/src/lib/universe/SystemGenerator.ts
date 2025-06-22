import { Star, StarSystem, Planet, AsteroidBelt, PlanetType, Moon } from "../../shared/schema";

export class SystemGenerator {
  private static seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  private static getPlanetType(distance: number, starTemp: number): PlanetType {
    // Habitable zone calculation based on star temperature
    const habZoneInner = Math.sqrt(starTemp / 5778) * 0.95;
    const habZoneOuter = Math.sqrt(starTemp / 5778) * 1.37;

    if (distance < habZoneInner * 0.5) {
      return 'nuclear_world';
    } else if (distance < habZoneInner) {
      return 'acidic_world';
    } else if (distance >= habZoneInner && distance <= habZoneOuter) {
      // In habitable zone
      const rand = Math.random();
      if (rand < 0.3) return 'verdant_world';
      if (rand < 0.6) return 'ocean_world';
      if (rand < 0.8) return 'arid_world';
      return 'dead_world';
    } else if (distance < habZoneOuter * 3) {
      const rand = Math.random();
      if (rand < 0.7) return 'dead_world';
      return 'arid_world';
    } else if (distance < habZoneOuter * 10) {
      return 'gas_giant';
    } else {
      return 'frost_giant';
    }
  }

  private static generatePlanetName(systemName: string, index: number): string {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return `${systemName} ${romanNumerals[index] || (index + 1).toString()}`;
  }

  private static generateMoons(planetType: PlanetType, planetRadius: number, random: () => number): Moon[] {
    const moons: Moon[] = [];
    let moonCount = 0;

    // Moon count based on planet type
    if (planetType === 'gas_giant' || planetType === 'frost_giant') {
      moonCount = Math.floor(random() * 8) + 2; // 2-9 moons
    } else if (planetType === 'verdant_world' || planetType === 'ocean_world') {
      moonCount = Math.floor(random() * 3); // 0-2 moons
    } else {
      moonCount = Math.floor(random() * 2); // 0-1 moon
    }

    for (let i = 0; i < moonCount; i++) {
      const moon: Moon = {
        id: `moon-${i}`,
        name: `Moon ${i + 1}`,
        radius: planetRadius * (0.1 + random() * 0.3), // 10-40% of planet radius
        orbitRadius: planetRadius * (2 + random() * 8), // 2-10 planet radii
        orbitSpeed: (random() * 0.02) + 0.005 // Orbital speed
      };
      moons.push(moon);
    }

    return moons;
  }

  static generateSystem(star: Star): StarSystem {
    const seed = star.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const random = this.seededRandom(seed);
    
    const planets: Planet[] = [];
    const asteroidBelts: AsteroidBelt[] = [];

    // Generate planets
    const planetCount = star.planetCount;
    let currentDistance = 0.4; // Start at 0.4 AU

    for (let i = 0; i < planetCount; i++) {
      // Calculate orbital distance (rough approximation of Titius-Bode law)
      currentDistance = 0.4 * Math.pow(1.7, i) + (random() - 0.5) * 0.2;
      
      const planetType = this.getPlanetType(currentDistance, star.temperature);
      
      // Planet radius based on type
      let radius: number;
      let mass: number;
      
      if (planetType === 'gas_giant') {
        radius = 4 + random() * 7; // 4-11 Earth radii
        mass = 50 + random() * 300; // 50-350 Earth masses
      } else if (planetType === 'frost_giant') {
        radius = 3 + random() * 5; // 3-8 Earth radii
        mass = 15 + random() * 50; // 15-65 Earth masses
      } else {
        radius = 0.4 + random() * 2.5; // 0.4-2.9 Earth radii
        mass = 0.1 + random() * 8; // 0.1-8.1 Earth masses
      }

      const orbitSpeed = Math.sqrt(star.mass / Math.pow(currentDistance, 3)) * 0.1;
      const rotationSpeed = (random() * 0.05) + 0.005;

      // Generate atmosphere
      const atmosphere: string[] = [];
      if (planetType !== 'dead_world') {
        const atmosphereTypes = ['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Methane', 'Hydrogen', 'Helium'];
        const atmosphereCount = Math.floor(random() * 4) + 1;
        for (let j = 0; j < atmosphereCount; j++) {
          const gasIndex = Math.floor(random() * atmosphereTypes.length);
          if (!atmosphere.includes(atmosphereTypes[gasIndex])) {
            atmosphere.push(atmosphereTypes[gasIndex]);
          }
        }
      }

      // Calculate temperature
      const temperature = (star.temperature * Math.sqrt(star.radius)) / (2 * Math.sqrt(currentDistance));

      const planet: Planet = {
        id: `planet-${i}`,
        name: this.generatePlanetName(star.name, i),
        position: [currentDistance * Math.cos(random() * Math.PI * 2), 0, currentDistance * Math.sin(random() * Math.PI * 2)],
        radius,
        mass,
        type: planetType,
        orbitRadius: currentDistance,
        orbitSpeed,
        rotationSpeed,
        temperature,
        atmosphere,
        moons: this.generateMoons(planetType, radius, random),
        surfaceFeatures: []
      };

      planets.push(planet);

      // Occasionally add asteroid belt
      if (random() < 0.3 && i < planetCount - 1) {
        const beltDistance = currentDistance + 0.5 + random() * 1.0;
        const belt: AsteroidBelt = {
          id: `belt-${asteroidBelts.length}`,
          name: `Asteroid Belt ${asteroidBelts.length + 1}`,
          innerRadius: beltDistance - 0.2,
          outerRadius: beltDistance + 0.2,
          density: random() * 0.5 + 0.1,
          asteroidCount: Math.floor(random() * 500) + 100
        };
        asteroidBelts.push(belt);
      }
    }

    return {
      id: `system-${star.id}`,
      starId: star.id,
      planets,
      asteroidBelts
    };
  }
}
