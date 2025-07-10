import { WarpLane } from '../../../../shared/schema';

interface SimpleStar {
  id: string;
  name?: string;
  position: [number, number, number];
  radius: number;
  spectralClass: string;
  mass?: number;
  temperature?: number;
  luminosity?: number;
}

interface Graph {
  [starId: string]: { [neighborId: string]: number };
}

export class WarpLaneGenerator {
  /**
   * Calculate distance between two stars
   */
  static calculateDistance(star1: SimpleStar, star2: SimpleStar): number {
    const dx = star1.position[0] - star2.position[0];
    const dy = star1.position[1] - star2.position[1];
    const dz = star1.position[2] - star2.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Build a graph of star connections within a minimum distance threshold
   */
  static buildStarGraph(stars: SimpleStar[], maxDistance: number): Graph {
    const graph: Graph = {};
    let totalConnections = 0;
    
    // Initialize graph
    stars.forEach(star => {
      graph[star.id] = {};
    });

    console.log(`Building graph for ${stars.length} stars with max distance ${maxDistance}`);
    
    // Connect stars within distance threshold
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const distance = this.calculateDistance(stars[i], stars[j]);
        if (distance <= maxDistance) {
          graph[stars[i].id][stars[j].id] = distance;
          graph[stars[j].id][stars[i].id] = distance;
          totalConnections++;
        }
      }
    }

    console.log(`Graph connectivity: ${totalConnections} connections, average ${(totalConnections * 2 / stars.length).toFixed(1)} connections per star`);
    
    // Debug: Check if we have any connections at all
    const connectedStars = Object.keys(graph).filter(starId => Object.keys(graph[starId]).length > 0);
    console.log(`${connectedStars.length} out of ${stars.length} stars have connections`);
    
    return graph;
  }

  /**
   * Dijkstra's algorithm to find shortest path between two stars
   */
  static dijkstra(graph: Graph, startId: string, endId: string): { path: string[], distance: number } | null {
    const distances: { [id: string]: number } = {};
    const previous: { [id: string]: string | null } = {};
    const unvisited = new Set<string>();

    // Initialize distances
    Object.keys(graph).forEach(starId => {
      distances[starId] = starId === startId ? 0 : Infinity;
      previous[starId] = null;
      unvisited.add(starId);
    });

    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops
    
    while (unvisited.size > 0 && iterations < maxIterations) {
      iterations++;
      // Find unvisited node with minimum distance
      let current: string | null = null;
      let minDistance = Infinity;
      
      for (const starId of unvisited) {
        if (distances[starId] < minDistance) {
          minDistance = distances[starId];
          current = starId;
        }
      }

      if (!current || distances[current] === Infinity) {
        break; // No path exists
      }

      unvisited.delete(current);

      // If we reached the destination
      if (current === endId) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | null = endId;
        while (node !== null) {
          path.unshift(node);
          node = previous[node];
        }
        return { path, distance: distances[endId] };
      }

      // Update distances to neighbors
      Object.keys(graph[current]).forEach(neighborId => {
        if (unvisited.has(neighborId)) {
          const newDistance = distances[current] + graph[current][neighborId];
          if (newDistance < distances[neighborId]) {
            distances[neighborId] = newDistance;
            previous[neighborId] = current;
          }
        }
      });
    }

    return null; // No path found
  }

  /**
   * Generate continuous warp lane paths (chains of 15-20 stars with sequential connections)
   */
  static generateWarpLanes(stars: SimpleStar[], galaxyRadius: number, laneCount: number = 30): WarpLane[] {
    console.log(`Starting warp lane generation with ${stars.length} stars...`);
    const warpLanes: WarpLane[] = [];
    
    // Limit stars for performance
    const maxStarsForWarpLanes = Math.min(stars.length, 500);
    const workingStars = stars.slice(0, maxStarsForWarpLanes);
    console.log(`Using ${workingStars.length} stars for warp lane generation`);
    
    const warpColors = [
      '#00FFFF', // Cyan
      '#FF00FF', // Magenta  
      '#FFFF00', // Yellow
      '#00FF00', // Green
      '#FF4500', // Orange Red
      '#9400D3', // Violet
      '#FF1493', // Deep Pink
      '#00CED1', // Dark Turquoise
      '#FFD700'  // Gold
    ];

    const usedStars = new Set<string>();
    const starsPerLane = 15; // Each warp lane will connect 15 stars (14 segments)
    const maxSearchDistance = galaxyRadius * 0.3; // Maximum distance to search for next star
    
    // Generate multiple warp lane paths
    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
      if (usedStars.size >= workingStars.length - starsPerLane) {
        console.log(`Not enough unused stars for more lanes (used: ${usedStars.size}/${workingStars.length})`);
        break;
      }
      
      // Pick a random starting star that hasn't been used yet
      const availableStars = workingStars.filter(star => !usedStars.has(star.id));
      if (availableStars.length < starsPerLane) {
        console.log(`Not enough available stars for lane ${laneIndex} (need ${starsPerLane}, have ${availableStars.length})`);
        break;
      }
      
      const startingStar = availableStars[Math.floor(Math.random() * availableStars.length)];
      const path: string[] = [startingStar.id];
      let currentStar = startingStar;
      
      console.log(`Creating warp lane ${laneIndex + 1} starting from ${startingStar.id}`);
      
      // Build a chain of stars by finding the closest available star each time
      for (let step = 1; step < starsPerLane; step++) {
        const candidates = workingStars.filter(star => 
          !usedStars.has(star.id) && 
          !path.includes(star.id) &&
          star.id !== currentStar.id
        );
        
        if (candidates.length === 0) {
          console.log(`No more candidates available at step ${step} for lane ${laneIndex}`);
          break;
        }
        
        // Find the closest candidate within search distance
        let closestStar: SimpleStar | null = null;
        let closestDistance = Infinity;
        
        for (const candidate of candidates) {
          const distance = this.calculateDistance(currentStar, candidate);
          if (distance <= maxSearchDistance && distance < closestDistance) {
            closestDistance = distance;
            closestStar = candidate;
          }
        }
        
        // If no star found within search distance, pick the closest available star
        if (!closestStar) {
          for (const candidate of candidates) {
            const distance = this.calculateDistance(currentStar, candidate);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestStar = candidate;
            }
          }
        }
        
        if (closestStar) {
          path.push(closestStar.id);
          currentStar = closestStar;
          console.log(`  Step ${step}: ${currentStar.id} (distance: ${closestDistance.toFixed(1)})`);
        } else {
          console.log(`  Could not find next star at step ${step}`);
          break;
        }
      }
      
      // Only create the warp lane if we have a meaningful path (at least 5 stars)
      if (path.length >= 5) {
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
          const star1 = workingStars.find(s => s.id === path[i]);
          const star2 = workingStars.find(s => s.id === path[i + 1]);
          if (star1 && star2) {
            totalDistance += this.calculateDistance(star1, star2);
          }
        }
        
        const warpLane: WarpLane = {
          id: `warp-chain-${laneIndex}`,
          name: `Warp Route ${laneIndex + 1}`,
          startStarId: path[0],
          endStarId: path[path.length - 1],
          path: path,
          distance: totalDistance,
          color: warpColors[laneIndex % warpColors.length],
          opacity: 0.4,
          isActive: true
        };
        
        warpLanes.push(warpLane);
        
        // Mark all stars in this path as used
        path.forEach(starId => usedStars.add(starId));
        
        console.log(`Generated warp lane ${laneIndex + 1}: ${path.length} stars, ${totalDistance.toFixed(1)} total distance`);
      } else {
        console.log(`Path too short for lane ${laneIndex} (only ${path.length} stars), skipping`);
      }
    }
    
    console.log(`Generated ${warpLanes.length} warp lane chains`);
    return warpLanes;
  }
}