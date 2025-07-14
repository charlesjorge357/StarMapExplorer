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
  holdings: [],
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
    planets = planets.filter(Boolean); // REMOVE undefined/null planets
    const factions: Faction[] = [];
    if (planets.length === 0) return factions;

    factions.push(ContestedFaction);

    const habitableTypes = [
      "grassland_world",
      "jungle_world",
      "ocean_world",
      "marshy_world",
      "sandy_world",
      "dusty_world",
      "tundra_world",
      "snowy_world",
    ];
    const hostileTypes = [
      "gas_giant",
      "frost_giant",
      "arid_world",
      "nuclear_world",
      "barren_world",
      "martian_world",
      "methane_world",
    ];

    

    const habitablePlanets = planets.filter((p) => habitableTypes.includes(p.type));
    const hostilePlanets = planets.filter((p) => hostileTypes.includes(p.type));
    const neutralPlanets = planets.filter(
      (p) => !habitableTypes.includes(p.type) && !hostileTypes.includes(p.type),
    );

    const isDominated = Math.random() < 0.1;

    if (isDominated && habitablePlanets.length > 0) {
      const dominantPlanet = habitablePlanets[Math.floor(Math.random() * habitablePlanets.length)];
      const faction = this.createFactionFromPlanet(dominantPlanet);
      factions.push(faction);

      // Assign the same faction to all non-hostile planets
      planets.forEach((p) => {
        if (!hostileTypes.includes(p.type)) {
          p.faction = faction;
        } else {
          p.faction = ContestedFaction;
        }
      });
    } else {
      const shuffled = [...habitablePlanets, ...neutralPlanets].sort(() => Math.random() - 0.5);
      const factionCount = Math.max(1, Math.floor(habitablePlanets.length * 0.75));

      for (let i = 0; i < factionCount; i++) {
        const planet = shuffled[i];
        const faction = this.createFactionFromPlanet(planet);
        factions.push(faction);
        planet.faction = faction;
      }

      // Any unclaimed neutral or habitable planets are contested
      for (let i = factionCount; i < shuffled.length; i++) {
        shuffled[i].faction = ContestedFaction;
      }

      // All hostile planets are automatically contested
      for (const hostile of hostilePlanets) {
        hostile.faction = ContestedFaction;
      }
    }

    return factions;
  }

  private static createFactionFromPlanet(planet: Planet): Faction {
    if (!planet) {
      console.warn("Attempted to create faction from undefined planet.");
      return ContestedFaction;
    }
    
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
      holdings: [],
      resources: this.generateResources(planet),
      ships: [],
      forts: [],
      fleets: [],
    };
  }

  public static editFactionFromPlanet (planet: Planet, faction: Faction): Faction{
    faction.homeworld = planet.name;
    faction.name = this.generateFactionName(planet);
    faction.description = `A faction based on the ${planet.type.replace("_", " ")} of ${planet.name}.`;
    faction.leader = this.generateLeaderName();
    faction.goals = this.generateGoals();
    faction.resources = this.generateResources(planet);
    return faction;
  }

  private static generateFactionName(planet: Planet): string {
    const governments = [
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
      "Tsardom",
    ];

    const prefixes = [
      "The",
      "New",
      "Greater",
      "United",
      "Free",
      "Imperial",
      "Grand",
      "Solar",
      "Galactic",
      "Outer",
    ];

    // Simple demonym generator based on planet name suffixes
    function generateDemonym(name: string): string {
      if (!name) return "";
      const lower = name.toLowerCase();

      if (lower.endsWith("a") || lower.endsWith("ia")) return name + "n";
      if (lower.endsWith("on")) return name + "ian";
      if (lower.endsWith("us")) return name.slice(0, -2) + "an";
      if (lower.endsWith("is")) return name.slice(0, -2) + "ian";
      if (lower.endsWith("ar")) return name + "ian";
      if (lower.endsWith("e")) return name + "an";
      if (lower.endsWith("y")) return name.slice(0, -1) + "ian";
      if (lower.endsWith("er")) return name + "ian";

      // Default fallback
      return name + "ian";
    }

    
    const gov = governments[Math.floor(Math.random() * governments.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const demonym = generateDemonym(planet.name);

    // Naming patterns
    const patterns = [
      () => `${planet.name} ${gov}`,                    // Crythus Syndicate
      () => `${demonym} ${gov}`,                        // Crythian Empire
      () => `${gov} of ${planet.name}`,                 // Federation of Crythus
      () => `The ${demonym} ${gov}`,                    // The Crythian Assembly
      () => `${prefix} ${planet.name} ${gov}`,          // Greater Crythus Guild
      () => `${prefix} ${gov}`,                         // Galactic Union
    ];

    // Pick a random pattern to generate a name
    const factionName = patterns[Math.floor(Math.random() * patterns.length)]();

    return factionName;
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
