import { Fleets, Ships, Faction } from "@shared/schema";

export class FleetGenerator {
  /**
   * Generate fleets for a faction's homeworld system
   */
  static generateFleetForFaction(faction: Faction, systemId: string): Fleets[] {
    if (!faction.homeworld || faction.name === 'Contested Zone') {
      return [];
    }

    // Generate one fleet per faction homeworld
    const fleet = this.createFleet(faction, systemId);
    faction.fleets = [fleet];
    return [fleet];
  }

  /**
   * Create a single fleet with multiple ships
   */
  private static createFleet(faction: Faction, systemId: string): Fleets {
    // Position fleet at a random orbital distance (between inner and outer system)
    const orbitRadius = 8 + Math.random() * 16; // 8-24 AU range
    const orbitAngle = Math.random() * Math.PI * 2; // Random angle around star
    
    const fleetPosition: [number, number, number] = [
      orbitRadius * Math.cos(orbitAngle),
      0, // Keep fleets on XZ plane
      orbitRadius * Math.sin(orbitAngle)
    ];

    // Generate 3-8 ships for the fleet based on faction technology
    const techLevel = parseInt(faction.technology || '5');
    const shipCount = Math.min(3 + Math.floor(techLevel / 2), 8);
    
    const ships: Ships[] = [];
    for (let i = 0; i < shipCount; i++) {
      ships.push(this.createShip(faction, i, orbitRadius));
    }

    const fleet: Fleets = {
      id: this.generateId(),
      size: ships.length,
      position: fleetPosition,
      composition: ships,
      faction: faction
    };

    console.log(`Generated fleet for ${faction.name}: ${ships.length} ships at orbit ${orbitRadius.toFixed(1)} AU`);
    return fleet;
  }

  /**
   * Create an individual ship within a fleet
   */
  private static createShip(faction: Faction, shipIndex: number, fleetOrbitRadius: number): Ships {
    const techLevel = parseInt(faction.technology || '5');
    
    // Determine ship type based on technology and index
    let shipType: Ships['type'];
    if (techLevel <= 3) {
      shipType = shipIndex < 2 ? 'fighter_wing' : 'destroyer';
    } else if (techLevel <= 6) {
      shipType = ['fighter_wing', 'bomber_wing', 'cruiser', 'destroyer'][shipIndex % 4] as Ships['type'];
    } else {
      shipType = ['cruiser', 'destroyer', 'carrier', 'battleship'][shipIndex % 4] as Ships['type'];
    }

    // Position ship in formation around fleet center
    const formationAngle = (shipIndex / 8) * Math.PI * 2; // Up to 8 ships in circle
    const formationRadius = 0.5 + (shipIndex % 2) * 0.3; // Two formation rings
    
    const shipPosition: [number, number, number] = [
      fleetOrbitRadius * Math.cos(0) + formationRadius * Math.cos(formationAngle), // Will be updated with fleet movement
      0,
      fleetOrbitRadius * Math.sin(0) + formationRadius * Math.sin(formationAngle)
    ];

    return {
      id: this.generateId(),
      type: shipType,
      name: `${faction.name} ${this.getShipClassName(shipType)} ${shipIndex + 1}`,
      position: shipPosition,
      size: this.getShipSize(shipType),
      affiliation: faction.name,
      faction: faction
    };
  }

  /**
   * Get ship class name for display
   */
  private static getShipClassName(type: Ships['type']): string {
    switch (type) {
      case 'fighter_wing': return 'Fighter Wing';
      case 'bomber_wing': return 'Bomber Wing';
      case 'cruiser': return 'Cruiser';
      case 'destroyer': return 'Destroyer';
      case 'carrier': return 'Carrier';
      case 'dreadnought': return 'Dreadnought';
      case 'battleship': return 'Battleship';
      case 'super_carrier': return 'Super Carrier';
      default: return 'Unknown';
    }
  }

  /**
   * Get ship size category
   */
  private static getShipSize(type: Ships['type']): "small" | "medium" | "large" {
    switch (type) {
      case 'fighter_wing':
      case 'bomber_wing':
        return 'small';
      case 'cruiser':
      case 'destroyer':
      case 'carrier':
        return 'medium';
      case 'dreadnought':
      case 'battleship':
      case 'super_carrier':
        return 'large';
      default:
        return 'medium';
    }
  }

  /**
   * Calculate orbital speed for fleet at given radius (matching planet orbital mechanics)
   */
  static calculateOrbitalSpeed(orbitRadius: number, starMass: number = 1): number {
    // Same calculation as planets use - gravitational orbital mechanics
    const G = 6.67430e-11; // Gravitational constant
    const M = starMass * 1.989e30; // Star mass in kg
    const r = orbitRadius * 1.496e11; // Orbit radius in meters (AU to meters)
    
    const orbitalSpeed = Math.sqrt(G * M / r);
    
    // Convert to angular velocity for use in Three.js (scaled for game time)
    const angularVelocity = orbitalSpeed / r;
    return angularVelocity * 1000; // Scale for visible movement
  }

  /** Simple random ID generator */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}