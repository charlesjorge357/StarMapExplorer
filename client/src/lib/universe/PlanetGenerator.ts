import { Planet, PlanetType, SurfaceFeature } from "shared/schema";

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

  static generateSurfaceFeatures(planet: Planet, count: number = 5): SurfaceFeature[] {
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
        affiliation: this.generateAffiliation()
      };

      features.push(feature);
    }

    return features;
  }

  private static generateFeatureName(type: 'city' | 'fort' | 'landmark', index: number): string {
    const cityNames = ['New Terra', 'Alpha Station', 'Beta Colony', 'Gamma Outpost', 'Delta City'];
    const fortNames = ['Fort Alpha', 'Beta Garrison', 'Gamma Stronghold', 'Delta Fortress', 'Epsilon Base'];
    const landmarkNames = ['Crystal Peaks', 'Azure Falls', 'Crimson Canyon', 'Emerald Valley', 'Silver Plateau'];

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

  static generateAffiliation(): string {
    const affiliations = [
      'Terran Federation',
      'Independent Colony',
      'Mining Consortium',
      'Trade Union',
      'Scientific Outpost',
      'Frontier Settlement',
      'Corporate Territory',
      'Free State',
      'Research Station',
      'Colonial Administration'
    ];
    return affiliations[Math.floor(Math.random() * affiliations.length)];
  }
}