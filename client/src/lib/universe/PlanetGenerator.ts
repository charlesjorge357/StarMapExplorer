import { Planet, PlanetType, SurfaceFeature, Faction } from "shared/schema";

export class PlanetGenerator {
  static generateSurfaceTexture(planet: Planet): string {
    // Return appropriate texture based on planet type
    switch (planet.type) {
      case 'grassland_world':
      case 'jungle_world':
        return '/textures/grass.png';
      case 'arid_world':
      case 'sandy_world':
      case 'dusty_world':
        return '/textures/sand.jpg';
      case 'barren_world':
      case 'martian_world':
        return '/textures/asphalt.png';
      default:
        return '/textures/asphalt.png'; // Default rocky texture
    }
  }

  static getPlanetColor(planetType: PlanetType): string {
    switch (planetType) {
      case 'gas_giant':
        return '#ffa500'; // Orange
      case 'frost_giant':
        return '#87ceeb'; // Sky blue
      case 'arid_world':
        return '#daa520'; // Goldenrod
      case 'barren_world':
        return '#8b7355'; // Dark khaki
      case 'dusty_world':
        return '#d2b48c'; // Tan
      case 'grassland_world':
        return '#9acd32'; // Yellow green
      case 'jungle_world':
        return '#228b22'; // Forest green
      case 'marshy_world':
        return '#556b2f'; // Dark olive green
      case 'martian_world':
        return '#cd5c5c'; // Indian red
      case 'methane_world':
        return '#dda0dd'; // Plum
      case 'sandy_world':
        return '#f4a460'; // Sandy brown
      case 'snowy_world':
        return '#f0f8ff'; // Alice blue
      case 'tundra_world':
        return '#708090'; // Slate gray
      case 'nuclear_world':
        return '#ff4500'; // Orange red
      case 'ocean_world':
        return '#006994'; // Deep blue
      default:
        return '#808080'; // Default gray
    }
  }

  

  static generateSurfaceFeatures(planet: Planet, count: number = 5, factions: Faction[]): SurfaceFeature[] {
    const features: SurfaceFeature[] = [];
    

    // Only generate surface features for rocky planets
    if (planet.type === 'gas_giant' || planet.type === 'frost_giant') {
      return features;
    }

    const featureTypes: Array<'city' | 'fort' | 'landmark'> = ['city', 'fort', 'landmark'];

    for (let i = 0; i < count; i++) {
      const lat = (Math.random() - 0.5) * 180; // -90 to 90
      const lon = (Math.random() - 0.5) * 360; // -180 to 180
      const type = featureTypes[Math.floor(Math.random() * featureTypes.length)];

      const feature: SurfaceFeature = {
        id: `feature-${i}`,
        type,
        name: this.generateFeatureName(type, i),
        position: [lat, lon],
        description: this.generateFeatureDescription(type),
        population: type === 'city' ? Math.floor(Math.random() * 10000000) + 50000 : undefined,
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
        technology: ['primitive', 'industrial', 'advanced'][Math.floor(Math.random() * 3)] as 'primitive' | 'industrial' | 'advanced',
        affiliation: this.generateAffiliation(factions, planet)
      };

      features.push(feature);
    }

    return features;
  }

  private static generateFeatureName(type: 'city' | 'fort' | 'landmark', index: number): string {
    const cityNames = [
      'New Terra', 'Alpha Station', 'Beta Colony', 'Gamma Outpost', 'Delta City',
      'Nova Harbor', 'Stellar Point', 'Void Port', 'Nexus Prime', 'Horizon City',
      'Zenith Colony', 'Eclipse Station', 'Aurora Settlement', 'Cosmos Bay', 'Nebula Falls',
      'Infinity Gate', 'Quantum City', 'Hyperion Base', 'Starfall Landing', 'Meridian Crossing',
      'Phoenix Rising', 'Crystal Shore', 'Crimson Spire', 'Azure Heights', 'Titanium Valley',
      'Solar Wind', 'Neutron Plaza', 'Pulsar Point', 'Comet\'s Rest', 'Asteroid Creek'
    ];
    
    const fortNames = [
      'Fort Alpha', 'Beta Garrison', 'Gamma Stronghold', 'Delta Fortress', 'Epsilon Base',
      'Ironhold Citadel', 'Starwatch Keep', 'Voidguard Bastion', 'Sentinel\'s Gate', 'Defender\'s Rest',
      'Steel Thunder', 'Storm\'s End', 'Barrier Peak', 'Shield Wall', 'Guardian\'s Stand',
      'Blackstone Keep', 'Iron Ridge', 'Steelpoint', 'Titanwall', 'Adamant Hold',
      'Eagle\'s Nest', 'Raven\'s Perch', 'Wolf\'s Den', 'Bear\'s Cave', 'Lion\'s Mane',
      'Nova Citadel', 'Stellar Bastion', 'Cosmic Gate', 'Star Fortress', 'Void Bulwark'
    ];
    
    const landmarkNames = [
      'Crystal Peaks', 'Azure Falls', 'Crimson Canyon', 'Emerald Valley', 'Silver Plateau',
      'Whispering Stones', 'Singing Crystals', 'Dancing Lights', 'Floating Isles', 'Gravity Wells',
      'Rainbow Geysers', 'Prismatic Caves', 'Magnetic Mountains', 'Temporal Rifts', 'Phantom Mists',
      'Golden Spires', 'Sapphire Lakes', 'Ruby Caverns', 'Diamond Cliffs', 'Opal Gardens',
      'Thunder Plains', 'Lightning Fields', 'Storm\'s Heart', 'Wind\'s Edge', 'Solar Mirrors',
      'Starfall Crater', 'Meteor Garden', 'Comet\'s Trail', 'Nova\'s Scar', 'Nebula\'s Eye',
      'Ancient Ruins', 'Titan\'s Bones', 'Dragon\'s Teeth', 'Giant\'s Stairs', 'Elder\'s Rest'
    ];

    switch (type) {
      case 'city':
        return cityNames[index % cityNames.length];
      case 'fort':
        return fortNames[index % fortNames.length];
      case 'landmark':
        return landmarkNames[index % landmarkNames.length];
      default:
        return 'Unknown Feature';
    }
  }

  private static generateFeatureDescription(type: 'city' | 'fort' | 'landmark'): string {
    switch (type) {
      case 'city':
        return 'A bustling urban center with diverse populations.';
      case 'fort':
        return 'A stronghold providing safety and defense.';
      case 'landmark':
        return 'A prominent natural or historical site.';
      default:
        return 'An interesting location.';
    }
  }

  private static generateTechnology (){
    return ['primitive', 'industrial', 'advanced'][Math.floor(Math.random() * 3)];
  }

  static generateAffiliation(factions: Faction[], planet?: Planet): string {
    // Priority: if planet matches a faction's homeworld, return that faction
    if (planet && factions.find(f => f.homeworld !== 'Contested Zone')) {
      const matched = factions.find(f => f.homeworld === planet.name);
      if (matched) return matched.name;
    }

    // Fallback unaffiliated groups
    const unaffiliated = [
      'Independent Colony', 'Free Traders Guild', 'Crimson Cartel', 'Void Runners',
      'Outer Rim Rebels', 'Civic League', 'Neutral Enclave', 'Smugglers Den',
      'Black Market Union', 'Free State of Orion', 'Nomad Clans', 'Mercenary Syndicate'
    ];
    return unaffiliated[Math.floor(Math.random() * unaffiliated.length)];
  }

}