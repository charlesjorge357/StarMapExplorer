import { Star } from "../../shared/schema";

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

  static generateStars(seed: number, count: number): Star[] {
    const random = this.seededRandom(seed);
    const stars: Star[] = [];

    for (let i = 0; i < count; i++) {
      // Generate position in a much larger sphere to prevent overlapping (4000 unit radius)
      const distance = 50 + random() * 4000; // Minimum distance of 50 units from center
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

  static getStarColor(spectralClass: string, luminosity?: number): string {
    // Override color for red dwarfs (very low luminosity stars - only the dimmest)
    if (luminosity !== undefined && luminosity < 0.05) {
      return '#ff4444'; // Bright red for red dwarfs
    }
    
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
}
