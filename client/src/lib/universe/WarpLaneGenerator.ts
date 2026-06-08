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

function generateColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
}

export class WarpLaneGenerator {
  private static seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  static calculateDistance(a: SimpleStar, b: SimpleStar): number {
    const dx = a.position[0] - b.position[0];
    const dy = a.position[1] - b.position[1];
    const dz = a.position[2] - b.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Greedy forward-progress path from start to end.
   * At each hop, finds the nearest star that:
   *   1. Has more forward projection along start→end than the current star
   *   2. Falls within a deviation cone from the straight-line axis
   *   3. Has been used fewer than 2 times across all lanes
   *
   * If no candidate is found at the tight cone, the cone widens in two steps
   * before giving up and jumping directly to end.  This prevents a single
   * bad snap from pulling the path sideways through empty space.
   */
  private static greedyPath(
    start: SimpleStar,
    end: SimpleStar,
    working: SimpleStar[],
    useCount: Map<string, number>,
    galaxyRadius: number
  ): string[] {
    const path: string[] = [start.id];
    const pathSet = new Set<string>([start.id]);
    let current = start;
    const maxHops = 60;
    const arrivalThreshold = galaxyRadius * 0.12;

    const dx = end.position[0] - start.position[0];
    const dy = end.position[1] - start.position[1];
    const dz = end.position[2] - start.position[2];
    const totalDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const dir = { x: dx / totalDist, y: dy / totalDist, z: dz / totalDist };

    while (path.length < maxHops) {
      if (this.calculateDistance(current, end) <= arrivalThreshold) break;

      // Projection of current star along start→end axis
      const cx = current.position[0] - start.position[0];
      const cy = current.position[1] - start.position[1];
      const cz = current.position[2] - start.position[2];
      const currentProj = cx * dir.x + cy * dir.y + cz * dir.z;

      let best: { star: SimpleStar; score: number } | null = null;

      // Try a tight cone first, widen only if nothing is found
      for (const maxDev of [galaxyRadius * 0.12, galaxyRadius * 0.26, galaxyRadius * 0.45]) {
        for (const s of working) {
          if (pathSet.has(s.id)) continue;
          if (s.id === end.id) continue;
          if ((useCount.get(s.id) ?? 0) >= 2) continue;

          const sx = s.position[0] - start.position[0];
          const sy = s.position[1] - start.position[1];
          const sz = s.position[2] - start.position[2];
          const sProj = sx * dir.x + sy * dir.y + sz * dir.z;

          // Must advance along the axis
          if (sProj <= currentProj) continue;

          // Deviation from the straight-line axis at this projection depth
          const idealX = start.position[0] + dir.x * sProj;
          const idealY = start.position[1] + dir.y * sProj;
          const idealZ = start.position[2] + dir.z * sProj;
          const devX = s.position[0] - idealX;
          const devY = s.position[1] - idealY;
          const devZ = s.position[2] - idealZ;
          const deviation = Math.sqrt(devX * devX + devY * devY + devZ * devZ);

          if (deviation > maxDev) continue;

          const distFromCurrent = this.calculateDistance(current, s);
          const score = distFromCurrent + deviation * 0.5;

          if (!best || score < best.score) best = { star: s, score };
        }

        if (best) break;
      }

      // No candidate anywhere — long hop directly toward end and stop
      if (!best) break;

      path.push(best.star.id);
      pathSet.add(best.star.id);
      current = best.star;
    }

    path.push(end.id);
    return path;
  }

  static generateWarpLanes(
    stars: SimpleStar[],
    galaxyRadius: number,
    laneCount: number = 10,
    seed: number = 99999
  ): WarpLane[] {
    const random = this.seededRandom(seed);
    console.log(`Generating ${laneCount} warp lanes across ${stars.length} stars`);
    const warpLanes: WarpLane[] = [];

    // Probability that a star of each spectral class becomes a warp node.
    // G/K stars (Sun-like, orange dwarfs) dominate — they're the most likely
    // to host civilisations capable of building warp infrastructure.
    // M dwarfs (70% of all stars) are kept rare so the network stays readable.
    const nodeChance: Record<string, number> = {
      G: 0.90,
      K: 0.75,
      F: 0.40,
      M: 0.08,
      A: 0.15,
      B: 0.05,
      O: 0.02,
    };

    // Deterministic hash so each star always gets the same roll regardless of
    // lane generation order — keeps the working set seed-reproducible.
    const starHash = (id: string): number => {
      let h = 0;
      for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
      return (h >>> 0) / 0xffffffff;
    };

    // Spatial sample first (every Nth) so void regions are represented,
    // then spectral filter so the network is biased toward habitable stars.
    const spatialStep = Math.max(1, Math.floor(stars.length / 1200));
    const working = stars
      .filter((_, i) => i % spatialStep === 0)
      .filter(s => {
        const cls = (s.spectralClass ?? 'M').charAt(0).toUpperCase();
        return starHash(s.id) < (nodeChance[cls] ?? 0.08);
      });
    // Each star may appear in at most 2 lanes — allows junction stars at crossroads
    const useCount = new Map<string, number>();
    const colors = generateColors(laneCount);

    const canUse = (id: string) => (useCount.get(id) ?? 0) < 2;
    const recordUse = (ids: string[]) =>
      ids.forEach(id => useCount.set(id, (useCount.get(id) ?? 0) + 1));

    for (let i = 0; i < laneCount; i++) {
      const available = working.filter(s => canUse(s.id));
      if (available.length < 2) break;

      const start = available[Math.floor(random() * available.length)];
      const minEndSep = galaxyRadius * 0.6;
      const ends = available.filter(
        s => s.id !== start.id && this.calculateDistance(start, s) >= minEndSep
      );
      if (!ends.length) {
        i--;
        continue;
      }
      const end = ends[Math.floor(random() * ends.length)];

      const path = this.greedyPath(start, end, working, useCount, galaxyRadius);
      if (path.length < 2) {
        i--;
        continue;
      }

      let total = 0;
      for (let j = 0; j < path.length - 1; j++) {
        const a = working.find(s => s.id === path[j]);
        const b = working.find(s => s.id === path[j + 1]);
        if (a && b) total += this.calculateDistance(a, b);
      }

      warpLanes.push({
        id: `warp-chain-${i}`,
        name: `Warp Route ${i + 1}`,
        startStarId: start.id,
        endStarId: end.id,
        path,
        distance: total,
        color: colors[i % colors.length],
        opacity: 0.4,
        isActive: true,
      });

      recordUse(path);
      console.log(`Lane ${i + 1}: ${path.length} hops`);
    }

    return warpLanes;
  }
}
