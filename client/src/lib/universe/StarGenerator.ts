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

  static generateStars(seed: number, count: number = 4000): Star[] {
    const random = this.seededRandom(seed);
    const stars: Star[] = [];
    console.log(`Generating ${count} stars with seed ${seed}...`);

    for (let i = 0; i < count; i++) {
      // Generate position in a much larger sphere to prevent overlapping (6000 unit radius)
      const distance = 150 + random() * 5850; // Minimum distance of 150 units from center
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);

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

      const star: Star = {
        id: `star-${i}`,
        name: this.generateStarName(i, spectralClass),
        position: [x, y, z],
        spectralClass,
        mass,
        radius,
        temperature,
        luminosity,
        age,
        planetCount
      };

      stars.push(star);
    }

    console.log(`Generated ${stars.length} stars`);
    return stars;
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

    // If stars are provided, calculate density-based placement
    let densityHotspots: { position: [number, number, number], weight: number }[] = [];
    
    if (stars && stars.length > 0) {
      // Create a 3D grid to calculate star density
      const gridSize = 1000; // Grid cell size
      const densityMap = new Map<string, { count: number, totalMass: number, center: [number, number, number] }>();
      
      // Calculate density for each grid cell
      stars.forEach(star => {
        const gridX = Math.floor(star.position[0] / gridSize);
        const gridY = Math.floor(star.position[1] / gridSize);
        const gridZ = Math.floor(star.position[2] / gridSize);
        const key = `${gridX},${gridY},${gridZ}`;
        
        if (!densityMap.has(key)) {
          densityMap.set(key, {
            count: 0,
            totalMass: 0,
            center: [gridX * gridSize, gridY * gridSize, gridZ * gridSize]
          });
        }
        
        const cell = densityMap.get(key)!;
        cell.count++;
        cell.totalMass += star.mass || 1;
      });
      
      // Convert high-density cells to hotspots
      densityMap.forEach(cell => {
        if (cell.count >= 8) { // Only consider cells with 8+ stars as hotspots
          const weight = Math.log(cell.count) * cell.totalMass; // Weight by count and total mass
          densityHotspots.push({
            position: cell.center,
            weight: weight
          });
        }
      });
      
      // Sort by weight and keep top hotspots
      densityHotspots.sort((a, b) => b.weight - a.weight);
      densityHotspots = densityHotspots.slice(0, Math.max(10, count * 0.4)); // Keep up to 40% of nebula count as hotspots
    }

    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number;
      
      // 70% chance to place near density hotspots if they exist, 30% random distribution
      if (densityHotspots.length > 0 && random() < 0.7) {
        // Choose a random hotspot weighted by density
        const totalWeight = densityHotspots.reduce((sum, hotspot) => sum + hotspot.weight, 0);
        let randomWeight = random() * totalWeight;
        let selectedHotspot = densityHotspots[0];
        
        for (const hotspot of densityHotspots) {
          randomWeight -= hotspot.weight;
          if (randomWeight <= 0) {
            selectedHotspot = hotspot;
            break;
          }
        }
        
        // Place nebula near the selected hotspot with some random offset
        const offsetDistance = 200 + random() * 800; // 200-1000 unit offset from hotspot center
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        
        x = selectedHotspot.position[0] + offsetDistance * Math.sin(phi) * Math.cos(theta);
        y = selectedHotspot.position[1] + offsetDistance * Math.sin(phi) * Math.sin(theta);
        z = selectedHotspot.position[2] + offsetDistance * Math.cos(phi);
      } else {
        // Random placement for distribution variety
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
        // Emission nebulas - larger, redder
        type = 'emission';
        const colors = ['#ff6b6b', '#ff8e8e', '#ffb3ba', '#ff69b4', '#ff1493'];
        color = colors[Math.floor(random() * colors.length)];
        radius = 30 + random() * 80; // 30-110 units
      } else {
        // Reflection nebulas - smaller, bluer
        type = 'reflection';
        const colors = ['#4d79ff', '#66b3ff', '#99ccff', '#b3d9ff', '#87ceeb'];
        color = colors[Math.floor(random() * colors.length)];
        radius = 15 + random() * 40; // 15-55 units
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
