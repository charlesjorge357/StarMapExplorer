import SurfaceFeaturesList from "@/components/ui/SurfaceFeaturesList";
import { Planet, PlanetType, SurfaceFeature, Faction, Armies, Divisions, Fleets, Ships } from "@shared/schema";

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
        name: this.generateFeatureName(type, i, planetFaction),
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

  private static getFactionArchetype(faction: any): string {
    const n = faction?.name || '';
    if (/Empire|Imperial|Kingdom|Tsardom|Crown/i.test(n))          return 'imperial';
    if (/Republic|Federation|Assembly|Coalition|Democratic/i.test(n)) return 'republic';
    if (/Syndicate|Corporation|Conglomerate|Guild|Consortium/i.test(n)) return 'corporate';
    if (/Dominion|Collective|Union|Commune/i.test(n))              return 'dominion';
    if (/League|Alliance|Pact|Accord/i.test(n))                   return 'alliance';
    return 'generic';
  }

  private static generateFeatureName(type: 'city' | 'fort' | 'landmark', index: number, faction?: any): string {
    const archetype = this.getFactionArchetype(faction);

    const cities: Record<string, string[]> = {
      imperial: [
        'Imperial City', 'Crown Spire', 'Emperor\'s Rest', 'The Citadel', 'Sovereign Landing',
        'Throne Point', 'Royal Harbor', 'Palace District', 'Augustan Quarter', 'Lord\'s Reach',
        'Regent\'s Bay', 'High Sanctum', 'Castellan\'s Watch', 'Edict Square', 'Praetor\'s Gate',
        'Imperial Nexus', 'Dominion Prime', 'Warlord\'s Seat', 'Grand Palisade', 'Apex Throne',
        'Bastion Heights', 'Hegemony Plaza', 'Conqueror\'s Rest', 'Iron Throne', 'Imperium Bay'
      ],
      republic: [
        'Parliament\'s Rest', 'Civic Center', 'Free Harbor', 'Accord Landing', 'Delegate\'s Point',
        'Senate Square', 'Liberty Bay', 'Council Spire', 'Charter Falls', 'Union Gate',
        'Commonwealth Hall', 'Tribune\'s Rest', 'Forum Prime', 'Quorum Station', 'Mandate City',
        'Sovereign Hill', 'Assembly Point', 'Consul\'s Reach', 'Plebiscite Square', 'Vote Tower',
        'Majority Falls', 'Peoples\'s Bay', 'Concord Station', 'Equality Heights', 'Justice Harbor'
      ],
      corporate: [
        'Profit Junction', 'Market Prime', 'Exchange City', 'Dividend Bay', 'Ledger Station',
        'Trade Nexus', 'Asset Landing', 'Commerce Spire', 'Yield Harbor', 'Venture Gate',
        'Merger Heights', 'Acquisition Point', 'Revenue Falls', 'Contract Bay', 'Equity Station',
        'Leverage City', 'Portfolio Plaza', 'Surplus Rest', 'Margin Tower', 'Capital Heights',
        'Broker\'s Gate', 'Syndicate Prime', 'Monopoly Bay', 'Franchise Station', 'Yield Point'
      ],
      dominion: [
        'Subjugation Prime', 'Occupied Falls', 'Control Station', 'Command Spire', 'Dominion Bay',
        'Directive Gate', 'Order Heights', 'Mandate Landing', 'Compliance Harbor', 'Unity City',
        'Collective Square', 'Solidarity Station', 'Commune Rest', 'State Prime', 'Bureau Gate',
        'Edict Tower', 'Policy Falls', 'Decree Harbor', 'Provision Bay', 'Authority Heights',
        'Overseer\'s Rest', 'Warden\'s Gate', 'Dictate Station', 'Regime Prime', 'Levy Point'
      ],
      alliance: [
        'Accord City', 'Unity Harbor', 'Coalition Station', 'Pact Gate', 'Treaty Falls',
        'Covenant Prime', 'Concord Bay', 'Partnership Heights', 'Bond Station', 'Compact Rest',
        'Allied Landing', 'Mutual Harbor', 'League Square', 'Collective Bay', 'Harmony Gate',
        'Truce Point', 'Alliance Spire', 'Ceasefire City', 'Fellowship Station', 'Kinship Falls',
        'Solidarity Bay', 'Brethren Heights', 'Sworn Gate', 'Pledge Harbor', 'Covenant Rest'
      ],
      generic: [
        'New Terra', 'Stellar Point', 'Void Port', 'Nexus Prime', 'Horizon City',
        'Zenith Colony', 'Eclipse Station', 'Aurora Settlement', 'Cosmos Bay', 'Nebula Falls',
        'Infinity Gate', 'Quantum City', 'Hyperion Base', 'Starfall Landing', 'Meridian Crossing',
        'Phoenix Rising', 'Crystal Shore', 'Crimson Spire', 'Azure Heights', 'Titanium Valley',
        'Solar Wind', 'Neutron Plaza', 'Pulsar Point', 'Comet\'s Rest', 'Asteroid Creek'
      ],
    };

    const forts: Record<string, string[]> = {
      imperial: [
        'Imperial Bastion', 'Crown Fortress', 'Emperor\'s Wall', 'Legion Keep', 'Conqueror\'s Hold',
        'Royal Redoubt', 'Sovereign Rampart', 'Praetorian Gate', 'Iron Bulwark', 'Palatine Watch',
        'Tribune\'s Fortress', 'Centurion\'s Rest', 'Siege Wall', 'Vanguard Citadel', 'War Spire'
      ],
      republic: [
        'Defender\'s Pact', 'Civil Guard Keep', 'Charter Bastion', 'Senate Wall', 'Union Stronghold',
        'Militia Gate', 'Common Bulwark', 'Free Fortress', 'People\'s Hold', 'Liberty Rampart',
        'Accord Citadel', 'Concord Watch', 'Tribune Guard', 'Patrol Station', 'Civic Redoubt'
      ],
      corporate: [
        'Security Tower', 'Asset Protection', 'Perimeter Station', 'Vault Fortress', 'Corporate Wall',
        'Defense Contract', 'Private Keep', 'Mercenary Hold', 'Hired Bastion', 'Secure Rampart',
        'Lock & Load', 'Profit Shield', 'Guard Post Alpha', 'Enforcement Hub', 'Paywall Citadel'
      ],
      dominion: [
        'Control Fortress', 'State Garrison', 'Order Bastion', 'Suppression Keep', 'Regime Wall',
        'Authority Hold', 'Warden\'s Rampart', 'Subjugation Gate', 'Iron Citadel', 'Mandate Guard',
        'Policy Fortress', 'Bureau Bulwark', 'Directive Keep', 'Compliance Wall', 'Overseer\'s Hold'
      ],
      alliance: [
        'Combined Arms Keep', 'United Fortress', 'Pact Bastion', 'Covenant Gate', 'Treaty Hold',
        'Mutual Defense', 'Allied Citadel', 'Joint Bulwark', 'Coalition Rampart', 'Bond Stronghold',
        'Accord Fortress', 'Harmony Watch', 'League Garrison', 'Shared Rampart', 'Fellowship Keep'
      ],
      generic: [
        'Fort Alpha', 'Ironhold Citadel', 'Starwatch Keep', 'Voidguard Bastion', 'Sentinel\'s Gate',
        'Steel Thunder', 'Storm\'s End', 'Barrier Peak', 'Shield Wall', 'Guardian\'s Stand',
        'Blackstone Keep', 'Iron Ridge', 'Steelpoint', 'Titanwall', 'Adamant Hold'
      ],
    };

    const landmarks: Record<string, string[]> = {
      imperial: [
        'Emperor\'s Tomb', 'Victory Arch', 'Conquest Monument', 'Legacy Spire', 'War Memorial',
        'Crown Obelisk', 'Dynasty Falls', 'Sovereign\'s Rest', 'Triumph Gate', 'Imperial Scar',
        'Throne Stone', 'Warlord\'s Monument', 'Subjugation Marker', 'Glorious Ruin', 'Legion\'s End'
      ],
      republic: [
        'Freedom Monument', 'Democracy Rock', 'Charter Obelisk', 'Founding Pillar', 'Liberty Stone',
        'First Vote Falls', 'Assembly Ruins', 'People\'s Monument', 'Accord Scar', 'Union Stone',
        'Old Senate Ruin', 'Liberty Gate', 'Revolution Monument', 'Equality Falls', 'Plebiscite Rock'
      ],
      corporate: [
        'First Trade Post', 'Founders\' Monument', 'Profit Obelisk', 'Market Ruin', 'Exchange Stone',
        'Old Ledger Falls', 'IPO Monument', 'Merger Scar', 'Asset Marker', 'Contract Stone',
        'Yield Falls', 'Legacy Patent', 'First Contract', 'Revenue Ruin', 'Dividend Rock'
      ],
      dominion: [
        'Dominion Marker', 'Control Obelisk', 'Mandate Stone', 'Subjugation Monument', 'Order Falls',
        'State Ruin', 'Bureau Rock', 'Directive Stone', 'Compliance Scar', 'Regime Monument',
        'Forgotten Dissent', 'Purge Marker', 'Authority Obelisk', 'Iron Pillar', 'Warden\'s Rock'
      ],
      alliance: [
        'Treaty Stone', 'Accord Monument', 'Union Obelisk', 'Covenant Falls', 'Pact Marker',
        'First Meeting Rock', 'Alliance Ruin', 'Bond Stone', 'Fellowship Scar', 'Harmony Falls',
        'Ceasefire Marker', 'Handshake Stone', 'Coalition Rock', 'United Obelisk', 'Concord Ruin'
      ],
      generic: [
        'Crystal Peaks', 'Azure Falls', 'Crimson Canyon', 'Emerald Valley', 'Silver Plateau',
        'Whispering Stones', 'Singing Crystals', 'Floating Isles', 'Gravity Wells', 'Phantom Mists',
        'Golden Spires', 'Sapphire Lakes', 'Ruby Caverns', 'Thunder Plains', 'Starfall Crater',
        'Ancient Ruins', 'Titan\'s Bones', 'Dragon\'s Teeth', 'Giant\'s Stairs', 'Elder\'s Rest'
      ],
    };

    const pool = (type === 'city' ? cities : type === 'fort' ? forts : landmarks)[archetype] ?? [];
    const fallback = (type === 'city' ? cities : type === 'fort' ? forts : landmarks)['generic'];
    const list = pool.length > 0 ? pool : fallback;
    return list[index % list.length];
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