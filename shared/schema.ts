import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const universeData = pgTable("universe_data", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(),
  data: jsonb("data").notNull(),
  created: timestamp("created").defaultNow(),
  modified: timestamp("modified").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Universe data types
export type ScopeType = "galactic" | "system" | "planetary";
export type ModeType = "sandbox" | "lore";

export interface Star {
  id: string;
  name: string;
  position: [number, number, number];
  spectralClass: string;
  mass: number;
  radius: number;
  temperature: number;
  luminosity: number;
  age: number;
  systemId?: string;
  planetCount: number;
}

export interface Planet {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  mass: number;
  type: PlanetType;
  orbitRadius: number;
  displayOrbit: number;
  orbitSpeed: number;
  rotationSpeed: number;
  temperature: number;
  atmosphere: string[];
  moons: Moon[];
  surfaceFeatures: SurfaceFeature[];
  rings: PlanetRing[]; // Planetary ring systems
  textureIndex?: number; // Persistent texture selection index
  faction?: Faction;
}

export interface Moon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export interface PlanetRing {
  id: string;
  name: string;
  innerRadius: number; // In planet radii
  outerRadius: number; // In planet radii
  thickness: number;   // Visual thickness
  density: number;     // Particle density (0-1)
  color: string;       // Ring color
  composition: "ice" | "rock" | "dust" | "mixed";
}

export interface SurfaceFeature {
  id: string;
  type: "city" | "fort" | "landmark";
  name: string;
  position: [number, number]; // latitude, longitude
  description?: string;
  population?: number; // For cities - affects light intensity
  size?: "small" | "medium" | "large"; // Affects light cluster size
  technology?: "primitive" | "industrial" | "advanced"; // Affects light color
  affiliation?: string; // Political/cultural affiliation (e.g., "Terran Federation", "Independent")
}

export type PlanetType =
  | "gas_giant"
  | "frost_giant"
  | "arid_world"
  | "barren_world"
  | "dusty_world"
  | "grassland_world"
  | "jungle_world"
  | "marshy_world"
  | "martian_world"
  | "methane_world"
  | "sandy_world"
  | "snowy_world"
  | "tundra_world"
  | "nuclear_world"
  | "ocean_world";

export interface StarSystem {
  id: string;
  starId: string;
  planets: Planet[];
  asteroidBelts: AsteroidBelt[];
  star?: any;
}

export interface AsteroidBelt {
  id: string;
  name: string;
  innerRadius: number;
  outerRadius: number;
  density: number;
  asteroidCount: number;
}

export interface UniverseData {
  mode: ModeType;
  stars: Star[];
  systems: StarSystem[];
  nebulas?: Nebula[];
  warpLanes?: WarpLane[];
  metadata: {
    version: string;
    created: string;
    modified: string;
    seed?: number;
  };
}

export interface Nebula {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  composition: string;
  type: "emission" | "reflection" | "dark" | "planetary";
  starsWithin?: Star[]; // optional
}

export interface WarpLane {
  id: string;
  name: string;
  startStarId: string;
  endStarId: string;
  path: string[]; // Array of star IDs representing the shortest path
  distance: number; // Total distance of the warp lane
  color: string; // Color of the warp lane visualization
  opacity: number; // Transparency level
  isActive: boolean; // Whether the warp lane is currently active
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  leader: string;
  homeworld: string;
  population: number;
  technology: string;
  influence: number;
  allies: string[];
  enemies: string[];
  goals: string[];
  resources: {
    credits: number;
    minerals: number;
    energy: number;
    food: number;
  };
  ships: Ship[];
  forts: Fort[];
  fleets: Fleet[];
}
