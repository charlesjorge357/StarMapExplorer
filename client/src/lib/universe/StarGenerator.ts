import type { Star, Nebula } from "../../../../shared/schema";

export class StarGenerator {
  private static seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  private static getSpectralClass(temp: number): string {
    if (temp > 30000) return 'O';
    if (temp > 10000) return 'B';
    if (temp > 7500) return 'A';
    if (temp > 6000) return 'F';
    if (temp > 5200) return 'G';
    if (temp > 3700) return 'K';
    return 'M';
  }

  private static generateStarName(index: number, spectralClass: string): string {
    const prefixes = [
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
      'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
      'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
    ];
    
    const suffixes = [
      'Centauri', 'Draconis', 'Lyrae', 'Cygni', 'Orionis', 'Ursae',
      'Andromedae', 'Cassiopeiae', 'Persei', 'Aquilae', 'Bootis',
      'Coronae', 'Geminorum', 'Leonis', 'Scorpii', 'Tauri'
    ];

    if (index === 0) return "Sol"; // Our sun
    
    const prefixIndex = Math.floor(index / suffixes.length) % prefixes.length;
    const suffixIndex = index % suffixes.length;
    
    return `${prefixes[prefixIndex]} ${suffixes[suffixIndex]}`;
  }

  static generateStarsWithNebulas(seed: number, count: number = 4000): { stars: Star[], nebulas: Nebula[] } {
    const random = this.seededRandom(seed);
    const stars: Star[] = [];
    console.log(`Generating ${count} stars with seed ${seed}...`);

    // First generate nebulas to place stars inside them
    const nebulas = this.generateNebulas(35); // Generate 35 nebulas first
    
    // Calculate how many stars should be in nebulas vs scattered
    const starsInNebulas = Math.floor(count * 0.4); // 40% of stars in nebulas
    const scatteredStars = count - starsInNebulas;
    
    let starIndex = 0;
    
    // Place stars inside nebulas
    const starsPerNebula = Math.floor(starsInNebulas / nebulas.length);
    const extraStars = starsInNebulas % nebulas.length;
    
    nebulas.forEach((nebula, nebulaIndex) => {
      const thisNebulaStarCount = starsPerNebula + (nebulaIndex < extraStars ? 1 : 0);
      
      for (let j = 0; j < thisNebulaStarCount; j++) {
        // Generate position inside nebula volume
        const distance = random() * nebula.radius; // Random distance from nebula center
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        
        const x = nebula.position[0] + distance * Math.sin(phi) * Math.cos(theta);
        const y = nebula.position[1] + distance * Math.sin(phi) * Math.sin(theta);
        const z = nebula.position[2] + distance * Math.cos(phi);

        stars.push(this.createStar(starIndex, [x, y, z], random));
        starIndex++;
      }
    });
    
    // Place remaining stars scattered throughout space
    for (let i = starIndex; i < count; i++) {
      // Generate position in a much larger sphere to prevent overlapping (6000 unit radius)
      const distance = 150 + random() * 5850; // Minimum distance of 150 units from center
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);

      stars.push(this.createStar(i, [x, y, z], random));
    }

    console.log(`Generated ${stars.length} stars (${starsInNebulas} in nebulas, ${scatteredStars} scattered)`);
    return { stars, nebulas };
  }

  static generateStars(seed: number, count: number = 4000): Star[] {
    // Keep the old method for compatibility, but use the new one internally
    const result = this.generateStarsWithNebulas(seed, count);
    return result.stars;
  }

  private static createStar(index: number, position: [number, number, number], random: () => number): Star {
    const [x, y, z] = position;

      // Stellar properties based on realistic distributions
    const massRand = random();
    let mass: number;
    let temperature: number;
    
    // Mass distribution (most stars are M-class)
    if (massRand < 0.7) {
      mass = 0.1 + random() * 0.4; // M-class: 0.1-0.5 solar masses
      temperature = 2500 + random() * 1200; // 2500-3700K
    } else if (massRand < 0.9) {
      mass = 0.5 + random() * 0.8; // K-class: 0.5-1.3 solar masses
      temperature = 3700 + random() * 1500; // 3700-5200K
    } else if (massRand < 0.97) {
      mass = 0.8 + random() * 1.2; // G-F class: 0.8-2.0 solar masses
      temperature = 5200 + random() * 2300; // 5200-7500K
    } else {
      mass = 2 + random() * 8; // A-B-O class: 2-10 solar masses
      temperature = 7500 + random() * 12500; // 7500-20000K
    }

    // More realistic radius calculation with extreme stellar variations
    let radius;
    if (mass < 0.5) {
      // Red dwarfs: very small
      radius = Math.pow(mass / 0.5, 0.8) * 0.4;
    } else if (mass > 8) {
      // Massive stars become giants/supergiants
      radius = Math.pow(mass / 8, 0.6) * 8;
    } else {
      // Main sequence stars
      radius = Math.pow(mass, 0.8);
    }
    const luminosity = Math.pow(mass, 3.5); // Mass-luminosity relationship
    const age = 1 + random() * 10; // 1-11 billion years
    const spectralClass = this.getSpectralClass(temperature);
    const planetCount = Math.floor(random() * 12); // 0-11 planets

    return {
      id: `star-${index}`,
      name: this.generateStarName(index, spectralClass),
      position,
      spectralClass,
      mass,
      radius,
      temperature,
      luminosity,
      age,
      planetCount
    };
  }

  static getStarColor(spectralClass: string): string {
    switch (spectralClass) {
      case 'O': return '#9bb0ff';
      case 'B': return '#aabfff';
      case 'A': return '#cad7ff';
      case 'F': return '#f8f7ff';
      case 'G': return '#fff4ea';
      case 'K': return '#ffd2a1';
      case 'M': return '#ffad51';
      default: return '#ffffff';
    }
  }
  static generateNebulas(count: number, stars?: Star[]): Nebula[] {
    const nebulas: Nebula[] = [];
    const random = this.seededRandom(54321); // Use seeded random for consistency

    const nebulaNames = [
      'Orion', 'Eagle', 'Horsehead', 'Cat\'s Eye', 'Rosette', 'Helix',
      'Ring', 'Crab', 'Veil', 'Swan', 'Lagoon', 'Trifid', 'Flame',
      'Witch Head', 'Heart', 'Soul', 'North', 'Pelican'
    ];

    const compositions = [
      'Hydrogen and Helium',
      'Ionized Hydrogen',
      'Dust and Gas',
      'Carbon and Oxygen',
      'Silicon and Iron',
      'Molecular Hydrogen'
    ];

    // Generate nebula cluster centers first (where stars will be placed)
    let clusterCenters: [number, number, number][] = [];
    
    if (!stars) {
      // Generate cluster centers for star formation regions
      for (let i = 0; i < Math.min(count, 15); i++) {
        const distance = 1000 + random() * 4000; // Spread across galaxy
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        clusterCenters.push([x, y, z]);
      }
    }

    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number;
      
      // If we have cluster centers, place nebulas over them first
      if (clusterCenters.length > 0 && i < clusterCenters.length) {
        const center = clusterCenters[i];
        // Place nebula directly at cluster center with minimal variation
        const offsetDistance = 20 + random() * 80; // Very small offset to center over cluster
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        
        x = center[0] + offsetDistance * Math.sin(phi) * Math.cos(theta);
        y = center[1] + offsetDistance * Math.sin(phi) * Math.sin(theta);
        z = center[2] + offsetDistance * Math.cos(phi);
      } else {
        // Random placement for additional nebulas
        const distance = 800 + random() * 8647;
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        
        x = distance * Math.sin(phi) * Math.cos(theta);
        y = distance * Math.sin(phi) * Math.sin(theta);
        z = distance * Math.cos(phi);
      }

      // Determine nebula type and properties
      const typeRand = random();
      let type: 'emission' | 'reflection';
      let color: string;
      let radius: number;

      if (typeRand < 0.6) {
        // Emission nebulas - much larger to contain star clusters
        type = 'emission';
        const colors = ['#ff6b6b', '#ff8e8e', '#ffb3ba', '#ff69b4', '#ff1493'];
        color = colors[Math.floor(random() * colors.length)];
        radius = 100 + random() * 200; // 100-300 units - much larger to contain multiple stars
      } else {
        // Reflection nebulas - larger than before but smaller than emission
        type = 'reflection';
        const colors = ['#4d79ff', '#66b3ff', '#99ccff', '#b3d9ff', '#87ceeb'];
        color = colors[Math.floor(random() * colors.length)];
        radius = 60 + random() * 120; // 60-180 units - larger to contain star groups
      }

      const nameIndex = Math.floor(random() * nebulaNames.length);
      const compositionIndex = Math.floor(random() * compositions.length);

      const nebula: Nebula = {
        id: `nebula-${i.toString().padStart(3, '0')}`,
        name: `${nebulaNames[nameIndex]} Nebula`,
        position: [x, y, z],
        radius,
        color,
        composition: compositions[compositionIndex],
        type
      };
      nebulas.push(nebula);
    }

    return nebulas;
  }
  
  
}
