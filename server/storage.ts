import { users, type User, type InsertUser, type UniverseData } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLoreUniverse(): Promise<UniverseData>;
  saveLoreUniverse(data: UniverseData): Promise<void>;
  updateLoreStar(id: string, updates: any): Promise<void>;
  updateLorePlanet(id: string, updates: any): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private loreUniverse: UniverseData | null;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.loreUniverse = null;
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLoreUniverse(): Promise<UniverseData> {
    if (!this.loreUniverse) {
      // Create a default lore universe if none exists
      this.loreUniverse = {
        mode: 'lore' as const,
        stars: [],
        systems: [],
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };
    }
    return this.loreUniverse;
  }

  async saveLoreUniverse(data: UniverseData): Promise<void> {
    this.loreUniverse = { ...data, mode: 'lore' as const };
  }

  async updateLoreStar(id: string, updates: any): Promise<void> {
    if (this.loreUniverse) {
      const starIndex = this.loreUniverse.stars.findIndex(s => s.id === id);
      if (starIndex >= 0) {
        this.loreUniverse.stars[starIndex] = { ...this.loreUniverse.stars[starIndex], ...updates };
        this.loreUniverse.metadata.modified = new Date().toISOString();
      }
    }
  }

  async updateLorePlanet(id: string, updates: any): Promise<void> {
    if (this.loreUniverse) {
      for (const system of this.loreUniverse.systems) {
        const planetIndex = system.planets.findIndex(p => p.id === id);
        if (planetIndex >= 0) {
          system.planets[planetIndex] = { ...system.planets[planetIndex], ...updates };
          this.loreUniverse.metadata.modified = new Date().toISOString();
          break;
        }
      }
    }
  }
}

export const storage = new MemStorage();
