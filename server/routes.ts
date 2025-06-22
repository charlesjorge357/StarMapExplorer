import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { UniverseData } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Lore mode API endpoints
  app.get('/api/lore/universe', async (req, res) => {
    try {
      const universe = await storage.getLoreUniverse();
      res.json(universe);
    } catch (error) {
      console.error('Error loading lore universe:', error);
      res.status(500).json({ error: 'Failed to load lore universe' });
    }
  });

  app.post('/api/lore/universe', async (req, res) => {
    try {
      const universeData: UniverseData = req.body;
      await storage.saveLoreUniverse(universeData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving lore universe:', error);
      res.status(500).json({ error: 'Failed to save lore universe' });
    }
  });

  app.put('/api/lore/star/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await storage.updateLoreStar(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating star:', error);
      res.status(500).json({ error: 'Failed to update star' });
    }
  });

  app.put('/api/lore/planet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await storage.updateLorePlanet(id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating planet:', error);
      res.status(500).json({ error: 'Failed to update planet' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
