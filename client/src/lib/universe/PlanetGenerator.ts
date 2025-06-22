import { Planet, PlanetType, SurfaceFeature } from "../../shared/schema";

export class PlanetGenerator {
  static generateSurfaceTexture(planet: Planet): string {
    // Return appropriate texture based on planet type
    switch (planet.type) {
      case 'verdant_world':
        return '/textures/grass.png';
      case 'arid_world':
      case 'dead_world':
        return '/textures/sand.jpg';
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
      case 'verdant_world':
        return '#228b22'; // Forest green
      case 'ocean_world':
        return '#006994'; // Deep blue
      case 'arid_world':
        return '#daa520'; // Goldenrod
      case 'acidic_world':
        return '#9acd32'; // Yellow green
      case 'nuclear_world':
        return '#ff4500'; // Orange red
      case 'dead_world':
        return '#696969'; // Dim gray
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
        description: this.generateFeatureDescription(type)
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
    }
  }

  private static generateFeatureDescription(type: 'city' | 'fort' | 'landmark'): string {
    switch (type) {
      case 'city':
        return 'A major population center with industrial and commercial facilities.';
      case 'fort':
        return 'A military installation providing defense and security.';
      case 'landmark':
        return 'A notable geographical or cultural feature.';
    }
  }
}
