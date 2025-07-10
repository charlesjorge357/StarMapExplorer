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
    
    // Initialize graph
    stars.forEach(star => {
      graph[star.id] = {};
    });

    // Connect stars within distance threshold
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const distance = this.calculateDistance(stars[i], stars[j]);
        if (distance <= maxDistance) {
          graph[stars[i].id][stars[j].id] = distance;
          graph[stars[j].id][stars[i].id] = distance;
        }
      }
    }

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

    while (unvisited.size > 0) {
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
   * Generate warp lanes using Dijkstra's algorithm
   */
  static generateWarpLanes(stars: SimpleStar[], galaxyRadius: number, laneCount: number = 9): WarpLane[] {
    const warpLanes: WarpLane[] = [];
    const minDistance = galaxyRadius * 0.5; // Minimum distance requirement (1/2 galaxy radius)
    
    // Build graph with connections for pathfinding (larger radius for connectivity)
    const connectivityRadius = galaxyRadius * 0.3; // Allow broader connections for pathfinding
    const graph = this.buildStarGraph(stars, connectivityRadius);

    // Find star pairs that meet the minimum distance requirement
    const validPairs: { star1: SimpleStar, star2: SimpleStar, distance: number }[] = [];
    
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const distance = this.calculateDistance(stars[i], stars[j]);
        if (distance >= minDistance) {
          validPairs.push({
            star1: stars[i],
            star2: stars[j],
            distance
          });
        }
      }
    }

    // Sort by distance and take pairs for warp lanes
    validPairs.sort((a, b) => b.distance - a.distance); // Prefer longer distances
    
    const usedStars = new Set<string>();
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

    for (const pair of validPairs) {
      if (warpLanes.length >= laneCount) break;
      
      // Avoid reusing stars to prevent overlap
      if (usedStars.has(pair.star1.id) || usedStars.has(pair.star2.id)) continue;

      // Find shortest path using Dijkstra's algorithm
      const pathResult = this.dijkstra(graph, pair.star1.id, pair.star2.id);
      
      if (pathResult) {
        const warpLane: WarpLane = {
          id: `warp-${pair.star1.id}-${pair.star2.id}`,
          name: `${pair.star1.name || pair.star1.id} - ${pair.star2.name || pair.star2.id}`,
          startStarId: pair.star1.id,
          endStarId: pair.star2.id,
          path: pathResult.path,
          distance: pathResult.distance,
          color: warpColors[warpLanes.length % warpColors.length],
          opacity: 0.4,
          isActive: true
        };

        warpLanes.push(warpLane);
        usedStars.add(pair.star1.id);
        usedStars.add(pair.star2.id);
        
        console.log(`Generated warp lane: ${warpLane.name} (${pathResult.path.length} hops, distance: ${pathResult.distance.toFixed(1)})`);
      }
    }

    console.log(`Generated ${warpLanes.length} warp lanes`);
    return warpLanes;
  }
}