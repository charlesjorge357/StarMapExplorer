import { WarpLane } from '../../../../shared/schema';
import * as THREE from 'three';

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
  static calculateDistance(a: SimpleStar, b: SimpleStar): number {
    const dx = a.position[0] - b.position[0];
    const dy = a.position[1] - b.position[1];
    const dz = a.position[2] - b.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

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

      // Generate curved mids
      const mids: string[] = [];
      for (let k = 1; k <= hopMidCount; k++) {
        const t = k / (requiredHops - 1);
        const [px, py, pz] = this.generateCurvedWaypoint(
          t,
          start.position,
          end.position,
          galaxyRadius * 0.4
        );
        let nearest = { id: '', dist: Infinity };
        working.forEach((s) => {
          if (s.id === start.id || s.id === end.id || used.has(s.id)) return;
          const d = Math.hypot(
            s.position[0] - px,
            s.position[1] - py,
            s.position[2] - pz
          );
          if (d < nearest.dist) nearest = { id: s.id, dist: d };
        });
        if (nearest.id) mids.push(nearest.id);
      }

      const basePath = [start.id, ...mids, end.id];
      const maxSegment = hopSpacing * 1.5;
      const maxDeviation = galaxyRadius * 0.2;
      const enhanced: string[] = [];

      for (let j = 0; j < basePath.length - 1; j++) {
        const aId = basePath[j];
        const bId = basePath[j + 1];
        const aStar = working.find((s) => s.id === aId)!;
        const bStar = working.find((s) => s.id === bId)!;

        enhanced.push(aId);

        // Try inserting up to 3 midpoints between a and b
        let midpoints: string[] = [];
        const aPos = new THREE.Vector3(...aStar.position);
        const bPos = new THREE.Vector3(...bStar.position);
        const abDir = bPos.clone().sub(aPos).normalize();
        const segDist = aPos.distanceTo(bPos);

        for (let attempt = 0; attempt < 3; attempt++) {
          let best: { id: string; score: number } | null = null;

          for (const s of working) {
            // Reject stars already used or in path (start, end, midpoints, or enhanced)
            if (
              used.has(s.id) ||
              s.id === aId ||
              s.id === bId ||
              midpoints.includes(s.id) ||
              enhanced.includes(s.id)
            ) continue;

            const sPos = new THREE.Vector3(...s.position);
            const proj = sPos.clone().sub(aPos).dot(abDir);
            if (proj < 0 || proj > segDist) continue;

            // Reject candidates that are behind any previously chosen midpoints in this segment (enforce forward progress)
            if (midpoints.length > 0) {
              const lastMidPos = working.find((ws) => ws.id === midpoints[midpoints.length - 1])!;
              const lastMidVector = new THREE.Vector3(...lastMidPos.position);
              const lastProj = lastMidVector.clone().sub(aPos).dot(abDir);
              if (proj <= lastProj) continue; // Candidate is not further along, skip
            }

            const closest = aPos.clone().add(abDir.clone().multiplyScalar(proj));
            const deviation = sPos.distanceTo(closest);

            if (deviation < maxDeviation) {
              const totalPath = aPos.distanceTo(sPos) + sPos.distanceTo(bPos);
              const score = totalPath + deviation;
              if (!best || score < best.score) {
                best = { id: s.id, score };
              }
            }
          }

          if (best) {
            midpoints.push(best.id);
            used.add(best.id); // Immediately mark midpoint star as used
          } else {
            break;
          }
        }

        enhanced.push(...midpoints);
      }

      enhanced.push(end.id);

      const path = Array.from(new Set(enhanced));
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
      console.log(`Lane ${i + 1}: ${path.length} hops`);
    }

    return warpLanes;
  }
}
