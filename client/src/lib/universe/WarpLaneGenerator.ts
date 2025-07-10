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
      let minDistance = 100000000000;
      
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
   * Generate warp lanes between distant star pairs using pathfinding
   */
  static generateWarpLanes(stars: SimpleStar[], galaxyRadius: number, laneCount: number = 35): WarpLane[] {
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

    // Build star graph with increased max distance for pathfinding
    const maxGraphDistance = galaxyRadius * 4.0; // Increased from 2.6 to allow longer connections
    const starGraph = this.buildStarGraph(workingStars, maxGraphDistance);
    
    const usedStars = new Set<string>();
    const minDistanceBetweenEndpoints = galaxyRadius * 1.5; // Minimum distance between start and end stars
    
    // Generate multiple warp lane paths
    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
      if (usedStars.size >= workingStars.length - 15) {
        console.log(`Not enough unused stars for more lanes (used: ${usedStars.size}/${workingStars.length})`);
        break;
      }
      
      // Find two distant stars that haven't been used
      const availableStars = workingStars.filter(star => !usedStars.has(star.id));
      if (availableStars.length < 15) {
        console.log(`Not enough available stars for lane ${laneIndex} (need 15, have ${availableStars.length})`);
        break;
      }
      
      let startStar: SimpleStar | null = null;
      let endStar: SimpleStar | null = null;
      let bestDistance = 0;
      
      // Try to find a good pair of distant stars
      for (let attempts = 0; attempts < 100; attempts++) {
        const candidate1 = availableStars[Math.floor(Math.random() * availableStars.length)];
        const candidate2 = availableStars[Math.floor(Math.random() * availableStars.length)];
        
        if (candidate1.id === candidate2.id) continue;
        
        const distance = this.calculateDistance(candidate1, candidate2);
        if (distance >= minDistanceBetweenEndpoints && distance > bestDistance) {
          startStar = candidate1;
          endStar = candidate2;
          bestDistance = distance;
        }
      }
      
      if (!startStar || !endStar) {
        console.log(`Could not find suitable star pair for lane ${laneIndex}`);
        continue;
      }
      
      console.log(`Creating warp lane ${laneIndex + 1} from ${startStar.id} to ${endStar.id} (distance: ${bestDistance.toFixed(1)})`);
      
      // Use Dijkstra's algorithm to find path between the two stars
      const pathResult = this.dijkstra(starGraph, startStar.id, endStar.id);
      
      if (!pathResult) {
        console.log(`No path found between ${startStar.id} and ${endStar.id}`);
        continue;
      }
      
      const { path, distance } = pathResult;
      
      // Check if any stars in the path are already used
      const pathHasUsedStars = path.some(starId => usedStars.has(starId));
      if (pathHasUsedStars) {
        console.log(`Path contains already used stars, skipping lane ${laneIndex}`);
        continue;
      }
      
      // If path has exactly 15 stars (13 intermediate + 2 endpoints), use it
      // If it has fewer, it's still valid but not ideal
      // If it has more, we'll trim it to 15 stars
      let finalPath = path;
      if (path.length > 15) {
        // Keep start and end, and evenly distribute intermediate stars
        const intermediateStars = path.slice(1, -1);
        const step = Math.floor(intermediateStars.length / 13);
        const selectedIntermediates = [];
        for (let i = 0; i < 13; i++) {
          const index = Math.min(i * step, intermediateStars.length - 1);
          selectedIntermediates.push(intermediateStars[index]);
        }
        finalPath = [path[0], ...selectedIntermediates, path[path.length - 1]];
      }
      
      // Calculate total distance for the final path
      let totalDistance = 0;
      for (let i = 0; i < finalPath.length - 1; i++) {
        const star1 = workingStars.find(s => s.id === finalPath[i]);
        const star2 = workingStars.find(s => s.id === finalPath[i + 1]);
        if (star1 && star2) {
          totalDistance += this.calculateDistance(star1, star2);
        }
      }
      
      const warpLane: WarpLane = {
        id: `warp-chain-${laneIndex}`,
        name: `Warp Route ${laneIndex + 1}`,
        startStarId: finalPath[0],
        endStarId: finalPath[finalPath.length - 1],
        path: finalPath,
        distance: totalDistance,
        color: warpColors[laneIndex % warpColors.length],
        opacity: 0.4,
        isActive: true
      };
      
      warpLanes.push(warpLane);
      
      // Mark all stars in this path as used
      finalPath.forEach(starId => usedStars.add(starId));
      
      console.log(`Generated warp lane ${laneIndex + 1}: ${finalPath.length} stars, ${totalDistance.toFixed(1)} total distance`);
    }
    
    console.log(`Generated ${warpLanes.length} warp lane chains`);
    return warpLanes;
  }
}