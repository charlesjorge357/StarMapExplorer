import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
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
export type ScopeType = 'galactic' | 'system' | 'planetary';
export type ModeType = 'sandbox' | 'lore';

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
  orbitSpeed: number;
  rotationSpeed: number;
  temperature: number;
  atmosphere: string[];
  moons: Moon[];
  surfaceFeatures: SurfaceFeature[];
  textureIndex?: number; // Persistent texture selection index
}

export interface Moon {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export interface SurfaceFeature {
  id: string;
  type: 'city' | 'fort' | 'landmark';
  name: string;
  position: [number, number]; // latitude, longitude
  description?: string;
  population?: number; // For cities - affects light intensity
  size?: 'small' | 'medium' | 'large'; // Affects light cluster size
  technology?: 'primitive' | 'industrial' | 'advanced'; // Affects light color
}

export type PlanetType = 
  | 'gas_giant' 
  | 'frost_giant' 
  | 'arid_world' 
  | 'verdant_world' 
  | 'acidic_world' 
  | 'nuclear_world' 
  | 'ocean_world' 
  | 'dead_world';

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
  metadata: {
    version: string;
    created: string;
    modified: string;
    seed?: number;
  };
}
