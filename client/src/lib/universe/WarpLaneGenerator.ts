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
   * Generate warp lanes using Dijkstra's algorithm
   */
  static generateWarpLanes(stars: SimpleStar[], galaxyRadius: number, laneCount: number = 8): WarpLane[] {
    console.log(`Starting warp lane generation with ${stars.length} stars...`);
    const warpLanes: WarpLane[] = [];
    const minDistance = galaxyRadius * 0.4; // Reasonable minimum distance for warp lanes
    
    // Limit stars for performance - use only a subset for warp lane generation
    const maxStarsForWarpLanes = Math.min(stars.length, 500);
    const workingStars = stars.slice(0, maxStarsForWarpLanes);
    console.log(`Using ${workingStars.length} stars for warp lane pathfinding`);
    
    // Build graph with connections for pathfinding (moderate radius for realistic connectivity)
    const connectivityRadius = galaxyRadius * 0.3; // Reduced for more realistic star connectivity
    const graph = this.buildStarGraph(workingStars, connectivityRadius);
    console.log(`Built connectivity graph with radius ${connectivityRadius}, graph has ${Object.keys(graph).length} nodes`);

    // Find star pairs that meet the minimum distance requirement
    const validPairs: { star1: SimpleStar, star2: SimpleStar, distance: number }[] = [];
    
    // Limit the pair checking to prevent performance issues
    const maxPairChecks = Math.min(workingStars.length, 300);
    for (let i = 0; i < maxPairChecks && validPairs.length < laneCount * 5; i++) {
      for (let j = i + 1; j < maxPairChecks && validPairs.length < laneCount * 5; j++) {
        const distance = this.calculateDistance(workingStars[i], workingStars[j]);
        if (distance >= minDistance) {
          validPairs.push({
            star1: workingStars[i],
            star2: workingStars[j],
            distance
          });
        }
      }
    }
    
    console.log(`Found ${validPairs.length} valid star pairs for warp lanes (min distance: ${minDistance})`);

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

    console.log(`Processing ${validPairs.length} valid pairs, attempting to generate ${laneCount} warp lanes`);
    
    for (const pair of validPairs) {
      if (warpLanes.length >= laneCount) {
        console.log(`Reached target lane count ${laneCount}, stopping generation`);
        break;
      }
      
      // Avoid reusing stars to prevent overlap
      if (usedStars.has(pair.star1.id) || usedStars.has(pair.star2.id)) {
        console.log(`Skipping pair ${pair.star1.id}-${pair.star2.id} (stars already used)`);
        continue;
      }

      console.log(`Attempting pathfinding for ${pair.star1.id} -> ${pair.star2.id} (distance: ${pair.distance.toFixed(1)})`);
      
      // Check if both stars exist in the graph
      if (!graph[pair.star1.id] || !graph[pair.star2.id]) {
        console.log(`Stars not found in graph: ${pair.star1.id}=${!!graph[pair.star1.id]}, ${pair.star2.id}=${!!graph[pair.star2.id]}`);
        continue;
      }
      
      // Find shortest path using Dijkstra's algorithm
      const pathResult = this.dijkstra(graph, pair.star1.id, pair.star2.id);
      
      if (pathResult && pathResult.path.length > 1) {
        // Only create warp lanes for paths that aren't just direct connections
        if (pathResult.path.length === 2 && pathResult.distance < minDistance) {
          console.log(`Path too short and direct (${pathResult.distance.toFixed(1)} < ${minDistance.toFixed(1)}), skipping`);
          continue;
        }
        
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
      } else {
        console.log(`No valid path found for ${pair.star1.id} -> ${pair.star2.id} (pathResult: ${!!pathResult})`);
        // Create direct connection as fallback for distant pairs
        if (pair.distance >= minDistance) {
          const directWarpLane: WarpLane = {
            id: `warp-direct-${pair.star1.id}-${pair.star2.id}`,
            name: `${pair.star1.name || pair.star1.id} - ${pair.star2.name || pair.star2.id}`,
            startStarId: pair.star1.id,
            endStarId: pair.star2.id,
            path: [pair.star1.id, pair.star2.id], // Direct connection
            distance: pair.distance,
            color: warpColors[warpLanes.length % warpColors.length],
            opacity: 0.4,
            isActive: true
          };

          warpLanes.push(directWarpLane);
          usedStars.add(pair.star1.id);
          usedStars.add(pair.star2.id);
          
          console.log(`Generated direct warp lane: ${directWarpLane.name} (direct connection, distance: ${pair.distance.toFixed(1)})`);
        } else {
          console.log(`Pair distance ${pair.distance.toFixed(1)} < minimum ${minDistance.toFixed(1)}, skipping`);
        }
      }
    }
    
    console.log(`Warp lane generation completed: ${warpLanes.length} lanes generated out of ${laneCount} requested`);

    // If no warp lanes were generated through pathfinding, create some simple direct connections
    if (warpLanes.length === 0 && validPairs.length > 0) {
      console.log('No pathfinding lanes generated, creating direct connections as fallback');
      for (let i = 0; i < Math.min(laneCount, validPairs.length); i++) {
        const pair = validPairs[i];
        if (!usedStars.has(pair.star1.id) && !usedStars.has(pair.star2.id)) {
          const directLane: WarpLane = {
            id: `direct-${pair.star1.id}-${pair.star2.id}`,
            name: `${pair.star1.name || pair.star1.id} - ${pair.star2.name || pair.star2.id}`,
            startStarId: pair.star1.id,
            endStarId: pair.star2.id,
            path: [pair.star1.id, pair.star2.id],
            distance: pair.distance,
            color: warpColors[i % warpColors.length],
            opacity: 0.4,
            isActive: true
          };
          warpLanes.push(directLane);
          usedStars.add(pair.star1.id);
          usedStars.add(pair.star2.id);
          console.log(`Created direct fallback lane: ${directLane.name} (distance: ${pair.distance.toFixed(1)})`);
        }
      }
    }
    
    // Final fallback: if still no lanes, create some basic connections
    if (warpLanes.length === 0 && workingStars.length >= 2) {
      console.log('Creating basic fallback lanes with any available stars');
      for (let i = 0; i < Math.min(laneCount, Math.floor(workingStars.length / 2)); i++) {
        const star1 = workingStars[i * 2];
        const star2 = workingStars[i * 2 + 1];
        const distance = this.calculateDistance(star1, star2);
        
        const basicLane: WarpLane = {
          id: `basic-${star1.id}-${star2.id}`,
          name: `${star1.name || star1.id} - ${star2.name || star2.id}`,
          startStarId: star1.id,
          endStarId: star2.id,
          path: [star1.id, star2.id],
          distance: distance,
          color: warpColors[i % warpColors.length],
          opacity: 0.4,
          isActive: true
        };
        warpLanes.push(basicLane);
        console.log(`Created basic fallback lane: ${basicLane.name} (distance: ${distance.toFixed(1)})`);
      }
    }

    console.log(`Generated ${warpLanes.length} warp lanes`);
    if (warpLanes.length > 0) {
      console.log('Sample warp lane:', warpLanes[0]);
    }
    return warpLanes;
  }
}