import { Armies, Divisions, Faction } from "@shared/schema";

export class MilitaryGenerator {
  /**
   * Generate armies for a given faction based on its holdings or surface features.
   * If the faction has surfaceFeatures, one army is created per feature; otherwise per holding.
   */
  static generateMilitaryForFaction(faction: Faction): Armies[] {
    // Ensure holdings is always an array
    if (!Array.isArray(faction.holdings)) {
      faction.holdings = [];
    }

    // Determine army bases: prefer surfaceFeatures if present
    const bases: Array<{ id: string; name: string; position: number[] }> =
      Array.isArray((faction as any).surfaceFeatures) && (faction as any).surfaceFeatures.length > 0
        ? (faction as any).surfaceFeatures
        : faction.holdings;

    // If no bases but homeworld exists, add placeholder base
    if (bases.length === 0 && faction.homeworld) {
      bases.push({
        id: `base-${faction.homeworld}`,
        name: faction.homeworld,
        position: [0, 0]
      } as any);
    }

    // Build one army per base (holding or surface feature)
    const armies: Armies[] = bases.map((feature: any) => {
      // Extract 2D coords: if 3 elements, take x and z, otherwise x and y
      let fx: number; let fy: number;
      if (Array.isArray(feature.position) && feature.position.length === 3) {
        [fx, , fy] = feature.position as [number, number, number];
      } else {
        [fx, fy] = feature.position as [number, number];
      }
      
      // Position army near the feature, not directly on it
      const armyDistance = 0.3 + Math.random() * 0.5; // 0.3-0.8 units away
      const armyAngle = Math.random() * Math.PI * 2; // Random angle around feature
      const armyX = fx + Math.cos(armyAngle) * armyDistance;
      const armyY = fy + Math.sin(armyAngle) * armyDistance;

      // Generate between 1–5 divisions for this army
      const numDivisions = Math.floor(Math.random() * 5) + 1;
      const divisions: Divisions[] = Array.from({ length: numDivisions }, () => {
        const divSize = Math.floor(Math.random() * 100) + 10;
        const offsetX = (Math.random() - 0.5) * 0.15; // Slightly larger spread
        const offsetY = (Math.random() - 0.5) * 0.15;
        return {
          id: MilitaryGenerator.generateId(),
          size: divSize,
          position: [armyX + offsetX, armyY + offsetY], // 2D relative to army, not feature
          affiliation: faction.name,
          faction: faction,
        } as Divisions;
      });

      // Army aggregates its divisions
      const armySize = divisions.reduce((sum, d) => sum + d.size, 0);
      return {
        id: MilitaryGenerator.generateId(),
        size: armySize,
        position: [armyX, armyY], // 2D positioned near feature
        affiliation: faction.name,
        faction: faction,
        composition: divisions,
      } as Armies;
    });

    // Assign and return
    faction.armies = armies;
    return armies;
  }

  /** Simple random ID generator */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
