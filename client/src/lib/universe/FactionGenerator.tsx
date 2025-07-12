import { Planet, Faction } from "shared/schema";

export const ContestedFaction: Faction = {
  id: "faction-contested",
  name: "Contested Zone",
  description:
    "An area with no clear faction control, contested by various groups.",
  leader: "Unknown",
  homeworld: "",
  population: 0,
  technology: 0,
  influence: 0,
  allies: [],
  enemies: [],
  goals: [],
  resources: { credits: 0, minerals: 0, energy: 0, food: 0 },
  ships: [],
  forts: [],
  fleets: [],
};

export class FactionGenerator {
  /**
   * Generate factions for a system based on planets and dominance chance.
   * Does NOT depend on surface features.
   */

  static getFactionForPlanet(planetName: string, factions: Faction[]): Faction {
    // Try to find a faction where this planet is the homeworld
    const faction = factions.find((f) => f.homeworld === planetName);

    if (faction) {
      return faction;
    }

    // If no faction owns this planet, return the contested faction
    return ContestedFaction;
  }

  static generateFactionsForSystem(planets: Planet[]): Faction[] {
    const factions: Faction[] = [];
    if (planets.length === 0) return factions;

    factions.push(ContestedFaction);

    const isDominated = Math.random() < 0.1;

    if (isDominated) {
      // ONE faction dominates the whole system (all planets)
      const dominantPlanet =
        planets[Math.floor(Math.random() * planets.length)];
      const faction = this.createFactionFromPlanet(dominantPlanet);
      factions.push(faction);

      // Assign faction to all planets
      planets.forEach((p) => {
        p.faction = faction.name; // You might want to add 'faction' field on Planet
      });
    } else {
      const shuffled = [...planets].sort(() => Math.random() - 0.5); // randomize planet order
      const factionCount = planets.length - 1;
      // MULTIPLE factions, one per planet
      for (let i = 0; i < factionCount; i++) {
        const planet = shuffled[i];
        const faction = this.createFactionFromPlanet(planet);
        factions.push(faction);
        planet.faction = faction.id;
      }

      // The remaining planet(s) are considered contested (unclaimed)
      for (let i = factionCount; i < planets.length; i++) {
        shuffled[i].faction = ContestedFaction.id;
      }
    }

    return factions;
  }

  private static createFactionFromPlanet(planet: Planet): Faction {
    const name = this.generateFactionName(planet);
    return {
      id: `faction-${planet.id}`,
      name,
      description: `A faction based on the ${planet.type.replace("_", " ")} of ${planet.name}.`,
      leader: this.generateLeaderName(),
      homeworld: planet.name,
      population: 0, // You can update population later
      technology: 1, // Default tech level or update later
      influence: Math.floor(Math.random() * 100),
      allies: [],
      enemies: [],
      goals: this.generateGoals(),
      resources: this.generateResources(planet),
      ships: [],
      forts: [],
      fleets: [],
    };
  }

  private static generateFactionName(planet: Planet): string {
    const baseNames = [
      "Consortium",
      "Federation",
      "Syndicate",
      "Dominion",
      "Alliance",
      "Conglomerate",
      "Union",
      "Guild",
      "Assembly",
      "Kingdom",
      "Republic",
      "Empire",
      "League",
      "Coalition",
      "Corporation",
      "Collective",
      "Syndicate",
      "Union",
      "Guild",
      "Assembly",
      "Tsardom",
    ];
    const suffix = baseNames[Math.floor(Math.random() * baseNames.length)];
    return `${planet.name} ${suffix}`;
  }

  private static generateLeaderName(): string {
    const first = [
      "Admiral",
      "President",
      "Chancellor",
      "Overseer",
      "Director",
      "Warlord",
      "Commander",
    ];
    const last = [
      "Tarn",
      "Vale",
      "Korr",
      "Saren",
      "Dray",
      "Zane",
      "Myra",
      "Quinn",
      "Lex",
    ];
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
  }

  private static generateGoals(): string[] {
    const options = [
      "Expand influence",
      "Secure trade routes",
      "Dominate local system",
      "Advance technology",
      "Preserve cultural identity",
      "Mine rare resources",
      "Build megastructures",
    ];
    return Array.from(
      { length: 2 },
      () => options[Math.floor(Math.random() * options.length)],
    );
  }

  private static generateResources(planet: Planet): Faction["resources"] {
    return {
      credits: Math.floor(Math.random() * 100000),
      minerals: Math.floor(Math.random() * 50000),
      energy: Math.floor(Math.random() * 40000),
      food: 1000, // Default value; can be updated later with features
    };
  }
}
