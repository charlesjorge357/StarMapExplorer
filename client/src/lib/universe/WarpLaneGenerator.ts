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
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360 / count) % 360;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
}

// Usage:

interface Graph {
  [starId: string]: { [neighborId: string]: number };
}

export class WarpLaneGenerator {
  static calculateDistance(a: SimpleStar, b: SimpleStar): number {
    const dx = a.position[0] - b.position[0];
    const dy = a.position[1] - b.position[1];
    const dz = a.position[2] - b.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** Generate a point on a curved path between start and end */
  static generateCurvedWaypoint(
    t: number,
    start: [number, number, number],
    end: [number, number, number],
    curveStrength: number
  ): [number, number, number] {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const mz = (sz + ez) / 2;

    const arcOffset: [number, number, number] = [
      (Math.random() - 0.5) * curveStrength,
      (Math.random() - 0.5) * curveStrength,
      (Math.random() - 0.5) * curveStrength,
    ];

    const cx = mx + arcOffset[0];
    const cy = my + arcOffset[1];
    const cz = mz + arcOffset[2];

    // Quadratic Bézier curve: B(t) = (1 - t)^2 * P0 + 2(1 - t)t * C + t^2 * P2
    const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t ** 2 * ex;
    const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t ** 2 * ey;
    const z = (1 - t) ** 2 * sz + 2 * (1 - t) * t * cz + t ** 2 * ez;

    return [x, y, z];
  }

  static generateWarpLanes(
    stars: SimpleStar[],
    galaxyRadius: number,
    laneCount: number = 10
  ): WarpLane[] {
    console.log(`Generating ${laneCount} warp lanes across ${stars.length} stars`);
    const warpLanes: WarpLane[] = [];
    const working = stars.slice(0, Math.min(stars.length, 500));
    const used = new Set<string>();
    const colors = generateColors(laneCount);

    for (let i = 0; i < laneCount; i++) {
      const available = working.filter((s) => !used.has(s.id));
      if (available.length < 2) break;

      const start = available[Math.floor(Math.random() * available.length)];

      const minEndSep = galaxyRadius * 0.6;
      const ends = available.filter(
        (s) => s.id !== start.id && this.calculateDistance(start, s) >= minEndSep
      );
      if (!ends.length) {
        i--;
        continue;
      }

      const end = ends[Math.floor(Math.random() * ends.length)];

      const distance = this.calculateDistance(start, end);
      const hopSpacing = galaxyRadius * 0.1;
      const requiredHops = Math.max(4, Math.floor(distance / hopSpacing));
      const hopMidCount = requiredHops - 2;

      const mids: string[] = [];

      // Generate curved waypoints along Bezier arc
      for (let k = 1; k <= hopMidCount; k++) {
        const t = k / (requiredHops - 1);
        const [px, py, pz] = this.generateCurvedWaypoint(
          t,
          start.position,
          end.position,
          galaxyRadius * 0.4 // arc strength
        );

        let nearest: { id: string; dist: number } = { id: '', dist: Infinity };
        working.forEach((s) => {
          if (s.id === start.id || s.id === end.id || used.has(s.id)) return;
          const d = Math.sqrt(
            (s.position[0] - px) ** 2 +
            (s.position[1] - py) ** 2 +
            (s.position[2] - pz) ** 2
          );
          if (d < nearest.dist) {
            nearest = { id: s.id, dist: d };
          }
        });

        if (nearest.id) mids.push(nearest.id);
      }

      const path = [start.id, ...mids, end.id];
      if (path.length < 2) {
        i--;
        continue;
      }

      let total = 0;
      for (let j = 0; j < path.length - 1; j++) {
        const a = working.find((s) => s.id === path[j])!;
        const b = working.find((s) => s.id === path[j + 1])!;
        total += this.calculateDistance(a, b);
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

      path.forEach((id) => used.add(id));
      console.log(`Lane ${i + 1}: ${path.length} hops (mids sampled: ${mids.length})`);
    }

    return warpLanes;
  }
}

