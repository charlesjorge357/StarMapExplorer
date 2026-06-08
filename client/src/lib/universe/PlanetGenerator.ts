import SurfaceFeaturesList from "@/components/ui/SurfaceFeaturesList";
import { Planet, PlanetType, SurfaceFeature, Faction, Armies, Divisions, Fleets, Ships } from "@shared/schema";
import { CultureArchetype, generateCultureName, idToSeed } from './CultureNameGenerator';

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

      const planetFaction = (planet as any).faction ?? factions.find((f: any) => f.homeworld === planet.name);
      const feature: SurfaceFeature = {
        id: `feature-${i}`,
        type,
        name: this.generateFeatureName(type, i, planetFaction, planet.id),
        position: [lat, lon],
        description: this.generateFeatureDescription(type),
        population: type === 'city' ? Math.floor(Math.random() * 10000000) + 50000 : undefined,
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
        technology: ['primitive', 'industrial', 'advanced'][Math.floor(Math.random() * 3)] as 'primitive' | 'industrial' | 'advanced',
        affiliation: this.generateAffiliation(factions, planet),
        planet: planet,
      };

      features.push(feature);
    }

    return features;
  }

  private static generateFeatureName(
    type: 'city' | 'fort' | 'landmark',
    index: number,
    faction?: any,
    planetId?: string
  ): string {
    // Use stored archetype directly; fall back to regex detection for backward compat
    const archetype: CultureArchetype = faction?.archetype ?? this.detectArchetype(faction);

    const seed = idToSeed((planetId ?? faction?.id ?? 'generic') + type + index);

    const noun = generateCultureName(archetype, seed);

    const citySuffixes: Record<CultureArchetype, string[]> = {
      imperial:  ['Gate', 'Square', 'Harbor', 'Quarter', 'Spire', 'Forum', 'Point', 'District', 'Rest', 'Landing'],
      republic:  ['Forum', 'Square', 'Bay', 'Hall', 'Plaza', 'Station', 'Quarter', 'Court', 'Center', 'Crossing'],
      corporate: ['Hub', 'Terminal', 'Exchange', 'Junction', 'Station', 'Nexus', 'Port', 'Tower', 'Prime', 'Base'],
      dominion:  ['Post', 'Station', 'Camp', 'Hold', 'Point', 'Depot', 'Facility', 'Control', 'Bureau', 'Block'],
      alliance:  ['Haven', 'Bay', 'Crossing', 'Rest', 'Landing', 'Shore', 'Way', 'Vale', 'Meeting', 'Springs'],
      generic:   ['City', 'Colony', 'Settlement', 'Outpost', 'Station', 'Base', 'Landing', 'Prime', 'Port', 'Town'],
    };

    const fortSuffixes: Record<CultureArchetype, string[]> = {
      imperial:  ['Keep', 'Bastion', 'Citadel', 'Hold', 'Wall', 'Rampart', 'Watch', 'Redoubt', 'Fortress', 'Gate'],
      republic:  ['Garrison', 'Bastion', 'Hold', 'Watch', 'Guard', 'Bulwark', 'Keep', 'Post', 'Citadel', 'Line'],
      corporate: ['Perimeter', 'Defense Post', 'Vault', 'Security Hub', 'Blockade', 'Lockdown', 'Shield', 'Barrier'],
      dominion:  ['Fortress', 'Barracks', 'Control Post', 'Garrison', 'Iron Keep', 'Suppression Hub', 'Wall', 'Hold'],
      alliance:  ['Refuge', 'Shelter', 'Watchtower', 'Safe Point', 'Retreat', 'Haven Keep', 'Guard Post', 'Outpost'],
      generic:   ['Fort', 'Keep', 'Bastion', 'Outpost', 'Watch', 'Garrison', 'Stronghold', 'Redoubt'],
    };

    const landmarkSuffixes: Record<CultureArchetype, string[]> = {
      imperial:  ['Monument', 'Arch', 'Obelisk', 'Tomb', 'Pillar', 'Colossus', 'Victory Gate', 'Mausoleum'],
      republic:  ['Monument', 'Memorial', 'Stone', 'Foundation', 'Pillar', 'Obelisk', 'Ruin', 'Marker'],
      corporate: ['Site', 'Remnant', 'Foundation', 'Wreck', 'Excavation', 'Ruin', 'Depot Ruin', 'Old Works'],
      dominion:  ['Scar', 'Iron Pillar', 'Warning Stone', 'Ruin', 'Monument', 'Marker', 'Mass Grave', 'Obelisk'],
      alliance:  ['Stone', 'Memorial', 'Glade', 'Falls', 'Spring', 'Sacred Ground', 'Meeting Place', 'Grove'],
      generic:   ['Crater', 'Peaks', 'Falls', 'Canyon', 'Valley', 'Spire', 'Lake', 'Ruins', 'Plains', 'Rift'],
    };

    const suffixes = type === 'city'
      ? citySuffixes[archetype]
      : type === 'fort'
        ? fortSuffixes[archetype]
        : landmarkSuffixes[archetype];

    // Pick suffix deterministically from the same seed offset
    let s = seed + 999;
    s = Math.sin(s) * 10000;
    const suffix = suffixes[Math.floor((s - Math.floor(s)) * suffixes.length)];

    return `${noun} ${suffix}`;
  }

  private static detectArchetype(faction: any): CultureArchetype {
    const n = faction?.name || '';
    if (/Empire|Imperial|Kingdom|Tsardom|Crown/i.test(n))            return 'imperial';
    if (/Republic|Federation|Assembly|Coalition|Democratic/i.test(n)) return 'republic';
    if (/Syndicate|Corporation|Conglomerate|Guild|Consortium/i.test(n)) return 'corporate';
    if (/Dominion|Collective|Union|Commune/i.test(n))                return 'dominion';
    if (/League|Alliance|Pact|Accord/i.test(n))                     return 'alliance';
    return 'generic';
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
    // 1) If this planet *is* a faction homeworld, use that faction directly
    if (planet) {
      const matched = factions.find(f => f.homeworld === planet.name);
      if (matched) {
        for (const surfaceFeature of planet.surfaceFeatures)
          matched.holdings.push(surfaceFeature);
        return matched.name;
      }
    }

    // 2) Fallback unaffiliated groups
    const unaffiliated = [
      'Independent Colony', 'Free Traders Guild', 'Crimson Cartel', 'Void Runners',
      'Outer Rim Rebels', 'Civic League', 'Neutral Enclave', 'Smugglers Den',
      'Black Market Union', 'Free State of Orion', 'Nomad Clans', 'Mercenary Syndicate'
    ];

    // 3) Other factions in this system (exclude generic contested and the planet’s own)
    const otherFactionNames = factions
      .filter(f => f.name !== 'Contested Zone' && f.homeworld !== planet?.name)
      .map(f => f.name);
    // 4) Combine and pick at random
    const pool = [...unaffiliated, ...otherFactionNames];
    const chosenFactionName = pool[Math.floor(Math.random() * pool.length)];
    const chosenFaction = factions.find(f => f.name === chosenFactionName);
    if (chosenFaction) {
      chosenFaction.holdings = chosenFaction.holdings || [];
      chosenFaction.holdings.push(...(planet?.surfaceFeatures || []));
    }
    return chosenFactionName;
  }

}